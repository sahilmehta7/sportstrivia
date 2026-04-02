import { calculateVideoMetadata } from "../calculate-video-metadata";
import { VIDEO_HEIGHT, VIDEO_SHORTS_HEIGHT, VIDEO_SHORTS_WIDTH, VIDEO_WIDTH } from "../constants";
import { getCliHelpText, parseCliArgs } from "./args";

async function main() {
  const parsed = parseCliArgs(globalThis.process.argv.slice(2));
  if (parsed.help) {
    console.log(getCliHelpText());
    globalThis.process.exit(0);
  }

  const metadata = await calculateVideoMetadata(parsed.input);
  const durationInSeconds = (metadata.durationInFrames / metadata.props.fps).toFixed(2);
  const dimensions =
    metadata.props.videoFormat === "shorts"
      ? { width: VIDEO_SHORTS_WIDTH, height: VIDEO_SHORTS_HEIGHT }
      : { width: VIDEO_WIDTH, height: VIDEO_HEIGHT };

  console.log(
    JSON.stringify(
      {
        outName: metadata.defaultOutName,
        durationInFrames: metadata.durationInFrames,
        durationInSeconds: Number(durationInSeconds),
        fps: metadata.props.fps,
        videoFormat: metadata.props.videoFormat,
        dimensions,
        selectionSeed: metadata.selectionSeed,
        questionCount: metadata.props.questions.length,
        quiz: metadata.props.quiz,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[video:metadata] Failed:", error);
  globalThis.process.exit(1);
});
