import { getIstDateString, resolveSelectionSeed } from "@/video/seed";

describe("video seed helpers", () => {
  it("keeps explicit seed unchanged", () => {
    const seed = resolveSelectionSeed({
      seed: "episode-42",
      quizSlug: "demo-quiz",
      quizId: "quiz_1",
      now: new Date("2026-04-02T12:00:00.000Z"),
    });
    expect(seed).toBe("episode-42");
  });

  it("uses deterministic daily seed from quiz identity and IST date", () => {
    const now = new Date("2026-04-02T12:00:00.000Z");
    const date = getIstDateString(now);
    const seed = resolveSelectionSeed({
      quizSlug: "demo-quiz",
      now,
    });
    expect(seed).toBe(`daily:demo-quiz:${date}`);
  });
});

