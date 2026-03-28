import { parseFaqMarkdown } from "@/lib/faq-utils";

describe("parseFaqMarkdown", () => {
  it("parses compact - Q:/A: markdown format from topic-content pipeline", () => {
    const md = [
      "- Q: Who won the 2023 Cricket World Cup?",
      "A: Australia won the 2023 Cricket World Cup.",
      "",
      "- Q: Where was the final played?",
      "A: The final was played in Ahmedabad.",
    ].join("\n");

    expect(parseFaqMarkdown(md)).toEqual([
      {
        question: "Who won the 2023 Cricket World Cup?",
        answer: "Australia won the 2023 Cricket World Cup.",
      },
      {
        question: "Where was the final played?",
        answer: "The final was played in Ahmedabad.",
      },
    ]);
  });

  it("parses heading-based FAQ format for backward compatibility", () => {
    const md = [
      "### What is cricket?",
      "Cricket is a bat-and-ball sport.",
      "",
      "### How many players are on a side?",
      "Each side fields eleven players.",
    ].join("\n");

    expect(parseFaqMarkdown(md)).toEqual([
      { question: "What is cricket?", answer: "Cricket is a bat-and-ball sport." },
      { question: "How many players are on a side?", answer: "Each side fields eleven players." },
    ]);
  });
});
