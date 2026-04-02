import { buildQuickRenderArgs } from "@/scripts/video-quick";
import type { QuizVideoRenderInput } from "@/video/types";

describe("video:quick render arg construction", () => {
  it("always forwards resolved selection seed to video:render", () => {
    const input: QuizVideoRenderInput = {
      quizSlug: "daily-football-quiz",
      fps: 30,
      showAnswerReveal: true,
      themeVariant: "dark",
      logoCorner: "top-right",
    };

    const args = buildQuickRenderArgs({
      input,
      outputPath: "/tmp/out.mp4",
      selectionSeed: "daily:daily-football-quiz:2026-04-02",
    });

    expect(args).toContain("--seed=daily:daily-football-quiz:2026-04-02");
    expect(args).toContain("--quizSlug=daily-football-quiz");
  });
});
