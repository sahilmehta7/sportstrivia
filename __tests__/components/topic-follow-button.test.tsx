import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TopicFollowButton } from "@/components/topics/TopicFollowButton";

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

const { useToast } = jest.requireMock("@/hooks/use-toast") as {
  useToast: jest.Mock;
};

describe("TopicFollowButton", () => {
  const toastMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ toast: toastMock });
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("follows a topic when the user clicks follow", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <TopicFollowButton
        topicId="team_india"
        topicName="India"
        schemaType="SPORTS_TEAM"
        entityStatus="READY"
        initialIsFollowing={false}
        isAuthenticated
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /follow india/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me/interests/team_india", {
        method: "POST",
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /following india/i })).toBeInTheDocument();
    });
  });

  it("unfollows a topic when already following", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <TopicFollowButton
        topicId="team_india"
        topicName="India"
        schemaType="SPORTS_TEAM"
        entityStatus="READY"
        initialIsFollowing
        isAuthenticated
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /following india/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me/interests/team_india", {
        method: "DELETE",
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /follow india/i })).toBeInTheDocument();
    });
  });

  it("does not render when entity status is not READY", () => {
    render(
      <TopicFollowButton
        topicId="team_india"
        topicName="India"
        schemaType="SPORTS_TEAM"
        entityStatus="DRAFT"
        initialIsFollowing={false}
        isAuthenticated
      />
    );

    expect(screen.queryByRole("button", { name: /follow india/i })).not.toBeInTheDocument();
  });
});
