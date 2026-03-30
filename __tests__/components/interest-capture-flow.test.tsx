import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InterestCaptureFlow } from "@/components/features/onboarding/InterestCaptureFlow";

describe("InterestCaptureFlow", () => {
  const originalFetch = global.fetch;
  const topicsPayload = {
    data: {
      topics: [
        {
          id: "sport_cricket",
          name: "Cricket",
          slug: "cricket",
          schemaType: "SPORT",
          entityStatus: "READY",
          parentId: null,
        },
        {
          id: "sport_draft",
          name: "Draft Sport",
          slug: "draft-sport",
          schemaType: "SPORT",
          entityStatus: "DRAFT",
          parentId: null,
        },
        {
          id: "team_india",
          name: "India",
          slug: "india-cricket-team",
          schemaType: "SPORTS_TEAM",
          entityStatus: "READY",
          parentId: "sport_cricket",
        },
        {
          id: "event_world_cup",
          name: "World Cup",
          slug: "world-cup",
          schemaType: "SPORTS_EVENT",
          entityStatus: "READY",
          parentId: "team_india",
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => topicsPayload,
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

  it("filters out non-ready sports from step one", async () => {
    render(<InterestCaptureFlow onSkip={jest.fn()} onComplete={jest.fn()} />);

    expect(await screen.findByRole("button", { name: /cricket/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /draft sport/i })).not.toBeInTheDocument();
  });

  it("filters entities by selected sport using ancestor mapping", async () => {
    render(<InterestCaptureFlow onSkip={jest.fn()} onComplete={jest.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: /cricket/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByRole("button", { name: /world cup/i })).toBeInTheDocument();
  });

  it("shows save error and does not complete when save fails", async () => {
    const onComplete = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unable to save preferences right now" }),
    });

    render(<InterestCaptureFlow onSkip={jest.fn()} onComplete={onComplete} />);

    fireEvent.click(await screen.findByRole("button", { name: /cricket/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));

    expect(
      await screen.findByText(/unable to save preferences right now/i)
    ).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("uses token-driven modal styles", async () => {
    render(<InterestCaptureFlow onSkip={jest.fn()} onComplete={jest.fn()} />);

    const heading = await screen.findByRole("heading", { name: /pick your sports/i });
    const modalCard = heading.closest("div")?.parentElement;

    expect(modalCard?.className).toContain("bg-card");
    expect(modalCard?.className).toContain("border-border");
  });

  it("does not auto-call onSkip when no eligible sports are available", async () => {
    const onSkip = jest.fn();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          topics: [
            {
              id: "sport_draft",
              name: "Draft Sport",
              slug: "draft-sport",
              schemaType: "SPORT",
              entityStatus: "DRAFT",
              parentId: null,
            },
          ],
        },
      }),
    });

    const { container } = render(<InterestCaptureFlow onSkip={onSkip} onComplete={jest.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/topics?limit=5000");
    });
    expect(onSkip).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });
});
