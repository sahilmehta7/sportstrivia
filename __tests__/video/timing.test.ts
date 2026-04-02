import { getQuestionBlockFrames, getVideoDurationInFrames } from "@/video/timing";

describe("video timing", () => {
  it("uses per-question timeLimitSeconds for question block frames", () => {
    const fps = 30;
    expect(getQuestionBlockFrames(fps, 10)).toBe(390);
    expect(getQuestionBlockFrames(fps, 20)).toBe(690);
    expect(getQuestionBlockFrames(fps, 30)).toBe(990);
  });

  it("computes total duration from mixed question time limits", () => {
    const fps = 30;
    const durationInFrames = getVideoDurationInFrames([10, 20, 30], fps);

    // cover 60 + intro 75 + (390 + 690 + 990) + outro 90
    expect(durationInFrames).toBe(2295);
  });
});
