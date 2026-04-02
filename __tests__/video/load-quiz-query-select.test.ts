import { quizVideoQuerySelect } from "@/video/load-quiz-for-video";

describe("quiz video query select", () => {
  it("does not select explanations and only selects minimal fields needed for reveal", () => {
    const questionSelect = quizVideoQuerySelect.questionPool.select.question.select as Record<string, unknown>;
    expect(questionSelect).not.toHaveProperty("explanation");
    expect(questionSelect).toHaveProperty("answers");
  });
});
