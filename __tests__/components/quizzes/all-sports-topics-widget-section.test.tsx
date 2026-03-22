import React from "react";
import { render, screen } from "@testing-library/react";
import { AllSportsTopicsWidgetSection } from "@/app/quizzes/components/all-sports-topics-widget-section";

jest.mock("@/lib/services/topic.service", () => ({
  getRootTopics: jest.fn(),
}));

const { getRootTopics } = jest.requireMock("@/lib/services/topic.service") as {
  getRootTopics: jest.Mock;
};

describe("AllSportsTopicsWidgetSection", () => {
  it("sorts topics by quiz count descending", async () => {
    getRootTopics.mockResolvedValue([
      { id: "a", name: "Football", slug: "football", displayEmoji: "⚽", _count: { quizTopicConfigs: 8 } },
      { id: "b", name: "Cricket", slug: "cricket", displayEmoji: "🏏", _count: { quizTopicConfigs: 12 } },
      { id: "c", name: "Tennis", slug: "tennis", displayEmoji: "🎾", _count: { quizTopicConfigs: 5 } },
    ]);

    render(await AllSportsTopicsWidgetSection());

    const topicLinks = screen.getAllByRole("link");
    expect(topicLinks[0]).toHaveAttribute("href", "/topics/cricket");
    expect(topicLinks[1]).toHaveAttribute("href", "/topics/football");
    expect(topicLinks[2]).toHaveAttribute("href", "/topics/tennis");
  });
});
