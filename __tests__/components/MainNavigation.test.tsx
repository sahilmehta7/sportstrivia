import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { useSession } from "next-auth/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({
    theme: "dark",
    setTheme: jest.fn(),
  })),
}));

// Mock child components to simplify testing
jest.mock("@/components/shared/UserAvatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}));

jest.mock("@/components/shared/NotificationsDropdown", () => ({
  NotificationsDropdown: () => <div data-testid="notifications-dropdown" />,
}));

jest.mock("@/components/shared/GlobalQuizSearch", () => ({
  GlobalQuizSearch: () => <div data-testid="global-quiz-search" />,
}));

describe("MainNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton when session is loading", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "loading",
    });

    render(<MainNavigation />);

    // This should fail initially because we haven't implemented the skeleton yet
    expect(screen.getByTestId("nav-skeleton")).toBeInTheDocument();
  });

  it("renders login button when unauthenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<MainNavigation />);

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.queryByTestId("user-avatar")).not.toBeInTheDocument();
  });

  it("renders user profile when authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          image: "/test-image.png",
          role: "USER",
        },
      },
      status: "authenticated",
    });

    render(<MainNavigation />);

    expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
  });
});
