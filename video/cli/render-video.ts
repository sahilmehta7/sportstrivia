import path from "node:path";
import fs from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { calculateVideoMetadata } from "../calculate-video-metadata";
import { withVideoWebpackOverride } from "../webpack-override";
import { getCliHelpText, parseCliArgs } from "./args";

async function main() {
  const parsed = parseCliArgs(globalThis.process.argv.slice(2));
  if (parsed.help) {
    console.log(getCliHelpText());
    globalThis.process.exit(0);
  }

  const metadata = await calculateVideoMetadata(parsed.input);
  const outputPath = parsed.outPath
    ? path.resolve(parsed.outPath)
    : path.resolve(globalThis.process.cwd(), "out", metadata.defaultOutName);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const entryPoint = path.resolve(globalThis.process.cwd(), "video/entry.ts");
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => withVideoWebpackOverride(config),
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "QuizYoutubeLandscape",
    inputProps: metadata.props,
  });

  await renderMedia({
    serveUrl: bundleLocation,
    composition,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: metadata.props,
    crf: 20,
    overwrite: true,
  });

  const durationInSeconds = (metadata.durationInFrames / metadata.props.fps).toFixed(2);
  console.log("[video:render] Render completed.");
  console.log(`[video:render] Output: ${outputPath}`);
  console.log(`[video:render] Duration: ${durationInSeconds}s (${metadata.durationInFrames} frames)`);
}

main().catch((error) => {
  console.error("[video:render] Failed:", error);
  globalThis.process.exit(1);
});
