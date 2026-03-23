import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProfileDiscoverabilityPanel } from "@/components/profile/ProfileDiscoverabilityPanel";

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

const { useToast } = jest.requireMock("@/hooks/use-toast") as {
  useToast: jest.Mock;
};

describe("ProfileDiscoverabilityPanel", () => {
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
            interests: [
              {
                topicId: "sport_cricket",
                source: "ONBOARDING",
                strength: 1,
                topic: {
                  id: "sport_cricket",
                  name: "Cricket",
                  slug: "cricket",
                  schemaType: "SPORT",
                },
              },
            ],
            preferences: {
              preferredDifficulty: "MEDIUM",
              preferredPlayModes: ["STANDARD"],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            follows: [
              {
                topic: {
                  id: "team_india",
                  name: "India",
                  slug: "india-cricket-team",
                  schemaType: "SPORTS_TEAM",
                },
              },
            ],
          },
        }),
      });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("shows followed entities and saves updated interests", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ProfileDiscoverabilityPanel />);

    expect(await screen.findByDisplayValue("India")).toBeInTheDocument();
    expect(screen.getByDisplayValue("sport_cricket")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/interest topic ids/i), {
      target: { value: "sport_cricket,team_india" },
    });
    fireEvent.change(screen.getByLabelText(/preferred difficulty/i), {
      target: { value: "HARD" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save discoverability preferences/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith("/api/users/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: [
            { topicId: "sport_cricket", source: "PROFILE", strength: 1 },
            { topicId: "team_india", source: "PROFILE", strength: 1 },
          ],
          preferences: {
            preferredDifficulty: "HARD",
            preferredPlayModes: ["STANDARD"],
          },
        }),
      });
    });
  });
});
