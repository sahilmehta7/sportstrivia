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
  const makeFetchMock = ({
    interests = [],
    topics = [],
  }: {
    interests?: Array<{ source: string }>;
    topics?: Array<{ schemaType: string; entityStatus?: string }>;
  }) =>
    jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/users/me/interests")) {
        return {
          ok: true,
          json: async () => ({ data: { interests } }),
        };
      }
      if (url.includes("/api/topics")) {
        return {
          ok: true,
          json: async () => ({ data: { topics } }),
        };
      }

      return {
        ok: false,
        json: async () => ({}),
      };
    });

  beforeEach(() => {
    jest.clearAllMocks();
    sessionState = { status: "authenticated", userId: "user_1" };
    window.localStorage.clear();
    global.fetch = makeFetchMock({
      interests: [],
      topics: [{ schemaType: "SPORT", entityStatus: "READY" }],
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

  it("does not show onboarding when explicit interests already exist (any source)", async () => {
    global.fetch = makeFetchMock({
      interests: [{ source: "PROFILE" }],
      topics: [{ schemaType: "SPORT", entityStatus: "READY" }],
    }) as unknown as typeof fetch;

    render(<AuthInterestOnboardingGate />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me/interests");
    });
    expect(screen.queryByTestId("interest-capture-flow")).not.toBeInTheDocument();
  });

  it("shows onboarding only when no saved intent exists and eligible sports exist", async () => {
    global.fetch = makeFetchMock({
      interests: [],
      topics: [{ schemaType: "SPORT", entityStatus: "READY" }],
    }) as unknown as typeof fetch;

    render(<AuthInterestOnboardingGate />);

    expect(await screen.findByTestId("interest-capture-flow")).toBeInTheDocument();
  });

  it("does not show onboarding when no eligible sports exist", async () => {
    global.fetch = makeFetchMock({
      interests: [],
      topics: [{ schemaType: "SPORT", entityStatus: "DRAFT" }],
    }) as unknown as typeof fetch;

    render(<AuthInterestOnboardingGate />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me/interests");
    });
    expect(screen.queryByTestId("interest-capture-flow")).not.toBeInTheDocument();
  });

  it("applies local skip only after server says prompt is eligible", async () => {
    window.localStorage.setItem("hasSkippedInterestOnboarding_v1_user_1", "true");
    global.fetch = makeFetchMock({
      interests: [],
      topics: [{ schemaType: "SPORT", entityStatus: "READY" }],
    }) as unknown as typeof fetch;

    render(<AuthInterestOnboardingGate />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me/interests");
      expect(global.fetch).toHaveBeenCalledWith("/api/topics?limit=5000");
    });
    expect(screen.queryByTestId("interest-capture-flow")).not.toBeInTheDocument();
  });

  it("hides onboarding on malformed payloads", async () => {
    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/users/me/interests")) {
        return { ok: true, json: async () => ({}) };
      }
      if (url.includes("/api/topics")) {
        return { ok: true, json: async () => ({ data: { topics: [] } }) };
      }
      return { ok: false, json: async () => ({}) };
    }) as unknown as typeof fetch;

    render(<AuthInterestOnboardingGate />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users/me/interests");
    });
    expect(screen.queryByTestId("interest-capture-flow")).not.toBeInTheDocument();
  });
});
