import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeleteAccountSection } from "@/components/profile/DeleteAccountSection";

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("@/lib/analytics", () => ({
  trackEvent: jest.fn(),
}));

const { signOut } = jest.requireMock("next-auth/react") as {
  signOut: jest.Mock;
};

const { useToast } = jest.requireMock("@/hooks/use-toast") as {
  useToast: jest.Mock;
};

const { trackEvent } = jest.requireMock("@/lib/analytics") as {
  trackEvent: jest.Mock;
};

describe("DeleteAccountSection", () => {
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

  it("renders danger zone and delete action", () => {
    render(<DeleteAccountSection />);

    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete account/i })
    ).toBeInTheDocument();
  });

  it("keeps confirm action disabled until exact DELETE is entered", async () => {
    render(<DeleteAccountSection />);

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(trackEvent).toHaveBeenCalledWith("account_delete_viewed", {
      source: "profile_settings",
    });

    const confirmButton = screen.getByRole("button", {
      name: /permanently delete account/i,
    });

    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Type DELETE"), {
      target: { value: "delete" },
    });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Type DELETE"), {
      target: { value: "DELETE" },
    });
    expect(confirmButton).toBeEnabled();
  });

  it("cancel closes dialog without calling delete API", async () => {
    render(<DeleteAccountSection />);

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /permanently delete account/i })
      ).not.toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("confirm calls delete API and signs out on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<DeleteAccountSection />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.change(screen.getByPlaceholderText("Type DELETE"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /permanently delete account/i })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me", {
        method: "DELETE",
      });
    });

    expect(trackEvent).toHaveBeenCalledWith("account_delete_confirmed", {
      source: "profile_settings",
    });

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith("account_delete_succeeded", {
        source: "profile_settings",
      });
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    });
  });

  it("shows destructive toast and tracks failure when delete fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Internal server error", code: "INTERNAL_ERROR" }),
    });

    render(<DeleteAccountSection />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.change(screen.getByPlaceholderText("Type DELETE"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /permanently delete account/i })
    );

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Delete failed",
          variant: "destructive",
        })
      );
    });

    expect(trackEvent).toHaveBeenCalledWith(
      "account_delete_failed",
      expect.objectContaining({
        source: "profile_settings",
        error_code: "INTERNAL_ERROR",
      })
    );
    expect(signOut).not.toHaveBeenCalled();
  });

  it("disables duplicate submits while pending", async () => {
    let resolveFetch: (value: any) => void = () => {};
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<DeleteAccountSection />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.change(screen.getByPlaceholderText("Type DELETE"), {
      target: { value: "DELETE" },
    });

    const confirmButton = screen.getByRole("button", {
      name: /permanently delete account/i,
    });

    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(confirmButton).toBeDisabled();

    resolveFetch({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it("tracks export-click analytics", async () => {
    render(<DeleteAccountSection />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));

    fireEvent.click(screen.getByRole("link", { name: /download my data first/i }));

    expect(trackEvent).toHaveBeenCalledWith("account_delete_export_clicked", {
      source: "profile_settings",
    });
  });
});

