import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In - Enter the Arena",
  description: "Join the elite circle of sports fans. Sign in to track your trivia legacy, compete on leaderboards, and claim your place among the elite.",
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full"></div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
