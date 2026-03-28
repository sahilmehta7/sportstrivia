import { render, screen, waitFor } from "@testing-library/react";
import { AuthInterestOnboardingGate } from "@/components/features/onboarding/AuthInterestOnboardingGate";

const replaceMock = jest.fn();
let sessionState: { status: "authenticated" | "unauthenticated" | "loading"; userId?: string } = {
  status: "authenticated",
  userId: "user_1",
};

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: sessionState.status,
    data:
      sessionState.status === "authenticated"
        ? { user: { id: sessionState.userId } }
        : null,
  }),
}));

jest.mock("@/components/features/onboarding/InterestCaptureFlow", () => ({
  InterestCaptureFlow: () => <div data-testid="interest-capture-flow">capture-flow</div>,
}));

describe("AuthInterestOnboardingGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionState = { status: "authenticated", userId: "user_1" };
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          interests: [],
        },
      }),
    }) as unknown as typeof fetch;
  });

  it("uses user-scoped localStorage keys", async () => {
    window.localStorage.setItem("hasSkippedInterestOnboarding_v1_user_1", "true");
    sessionState = { status: "authenticated", userId: "user_2" };

    render(<AuthInterestOnboardingGate />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me/interests");
    });
    expect(await screen.findByTestId("interest-capture-flow")).toBeInTheDocument();
  });
});
