/**
 * @jest-environment node
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { SAMPLE_QUIZ_VIDEO_PROPS } from "@/video/sample-props";

const runSmoke = process.env.RUN_VIDEO_RENDER_TESTS === "1";
const maybeTest = runSmoke ? test : test.skip;

describe("video render smoke", () => {
  jest.setTimeout(240_000);

  maybeTest("renders mp4 for quiz composition", async () => {
    const entryPoint = path.resolve(process.cwd(), "video/entry.ts");
    const bundleLocation = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "QuizYoutubeLandscape",
      inputProps: {
        ...SAMPLE_QUIZ_VIDEO_PROPS,
        questions: SAMPLE_QUIZ_VIDEO_PROPS.questions.slice(0, 1),
      },
    });

    const output = path.join(os.tmpdir(), `quiz-smoke-${Date.now()}.mp4`);

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: output,
      overwrite: true,
      inputProps: {
        ...SAMPLE_QUIZ_VIDEO_PROPS,
        questions: SAMPLE_QUIZ_VIDEO_PROPS.questions.slice(0, 1),
      },
    });

    expect(fs.existsSync(output)).toBe(true);
    expect(fs.statSync(output).size).toBeGreaterThan(0);
  });
});

