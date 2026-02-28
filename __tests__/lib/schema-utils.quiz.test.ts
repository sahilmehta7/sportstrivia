import { getQuizSchema } from "@/lib/schema-utils";

describe("getQuizSchema", () => {
  const baseQuiz = {
    id: "quiz_1",
    title: "Cricket Masters Quiz",
    slug: "cricket-masters-quiz",
    description: "Test your cricket knowledge.",
    difficulty: "MEDIUM",
    duration: 600,
    passingScore: 70,
    averageRating: 4.5,
    totalReviews: 12,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  };

  it("uses sport as about with url when sportUrl is provided", () => {
    const schema = getQuizSchema({
      ...baseQuiz,
      sport: "Cricket",
      sportUrl: "https://www.sportstrivia.in/topics/cricket",
      topicConfigs: [
        {
          topic: {
            name: "IPL",
            slug: "ipl",
          },
        },
      ],
    });

    expect(schema.about).toEqual({
      "@type": "Thing",
      name: "Cricket",
      url: "https://www.sportstrivia.in/topics/cricket",
    });
    expect(Array.isArray(schema.about)).toBe(false);
  });

  it("uses sport as about without url when sportUrl is absent", () => {
    const schema = getQuizSchema({
      ...baseQuiz,
      sport: "Football",
    });

    expect(schema.about).toEqual({
      "@type": "Thing",
      name: "Football",
    });
  });

  it("falls back to Sports when sport is missing", () => {
    const schema = getQuizSchema({
      ...baseQuiz,
      sport: null,
    });

    expect(schema.about).toEqual({
      "@type": "Thing",
      name: "Sports",
    });
  });

  it("does not derive about from non-sport topics", () => {
    const schema = getQuizSchema({
      ...baseQuiz,
      sport: "Basketball",
      topicConfigs: [
        {
          topic: {
            name: "NBA Finals",
            slug: "nba-finals",
          },
        },
      ],
    });

    expect(schema.about).toEqual({
      "@type": "Thing",
      name: "Basketball",
    });
  });
});
