import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InterestCaptureFlow } from "@/components/features/onboarding/InterestCaptureFlow";

describe("InterestCaptureFlow", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          topics: [
            {
              id: "sport_cricket",
              name: "Cricket",
              slug: "cricket",
              schemaType: "SPORT",
              parentId: null,
              children: [
                {
                  id: "team_india",
                  name: "India",
                  slug: "india-cricket-team",
                  schemaType: "SPORTS_TEAM",
                  parentId: "sport_cricket",
                  children: [],
                },
              ],
            },
          ],
        },
      }),
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("supports skip path", async () => {
    const onSkip = jest.fn();

    render(<InterestCaptureFlow onSkip={onSkip} onComplete={jest.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: /skip for now/i }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("saves onboarding interests with ONBOARDING source", async () => {
    const onComplete = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    render(<InterestCaptureFlow onSkip={jest.fn()} onComplete={onComplete} />);

    fireEvent.click(await screen.findByRole("button", { name: /cricket/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(await screen.findByRole("button", { name: /india/i }));
    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith("/api/users/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds: ["sport_cricket", "team_india"],
          source: "ONBOARDING",
          preferences: {
            preferredDifficulty: null,
            preferredPlayModes: ["STANDARD"],
          },
        }),
      });
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
