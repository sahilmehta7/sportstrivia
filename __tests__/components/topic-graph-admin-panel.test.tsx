import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TopicGraphAdminPanel } from "@/components/admin/TopicGraphAdminPanel";

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

const { useToast } = jest.requireMock("@/hooks/use-toast") as {
  useToast: jest.Mock;
};

describe("TopicGraphAdminPanel", () => {
  const toastMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ toast: toastMock });
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            relations: [
              {
                id: "rel_1",
                relationType: "PLAYS_FOR",
                fromTopic: {
                  id: "athlete_1",
                  name: "Virat Kohli",
                  slug: "virat-kohli",
                  schemaType: "ATHLETE",
                },
                toTopic: {
                  id: "team_1",
                  name: "India",
                  slug: "india-cricket-team",
                  schemaType: "SPORTS_TEAM",
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            isReady: true,
            entityStatus: "READY",
            errors: [],
          },
        }),
      });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renders human-readable relation metadata and topic schema types", async () => {
    render(
      <TopicGraphAdminPanel
        topicId="athlete_1"
        topics={[
          { id: "athlete_1", name: "Virat Kohli", slug: "virat-kohli", schemaType: "ATHLETE" },
          { id: "team_1", name: "India", slug: "india-cricket-team", schemaType: "SPORTS_TEAM" },
          { id: "sport_1", name: "Cricket", slug: "cricket", schemaType: "SPORT" },
        ]}
      />
    );

    expect(await screen.findByText(/india-cricket-team/i)).toBeInTheDocument();
    expect(screen.getByText(/virat kohli/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /cricket \(SPORT\)/i })).toBeInTheDocument();
  });

  it("deletes the selected relation by id", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            relations: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            isReady: false,
            entityStatus: "NEEDS_REVIEW",
            errors: ["Needs sport anchor"],
          },
        }),
      });

    render(
      <TopicGraphAdminPanel
        topicId="athlete_1"
        topics={[
          { id: "athlete_1", name: "Virat Kohli", slug: "virat-kohli", schemaType: "ATHLETE" },
          { id: "team_1", name: "India", slug: "india-cricket-team", schemaType: "SPORTS_TEAM" },
        ]}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: /remove relation plays_for to india/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/topics/athlete_1/relations/rel_1", {
        method: "DELETE",
      });
    });
  });
});
