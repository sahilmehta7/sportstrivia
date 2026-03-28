"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { InterestCaptureFlow } from "@/components/features/onboarding/InterestCaptureFlow";

const SKIPPED_KEY = "hasSkippedInterestOnboarding_v1";
const COMPLETED_KEY = "hasCompletedInterestOnboarding_v1";
const ENTRY_PATHS = ["/", "/quizzes", "/leaderboard"];

type InterestsResponse = {
  data: {
    interests: Array<{
      source: string;
    }>;
  };
};

export function AuthInterestOnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const isEntryPath = useMemo(() => ENTRY_PATHS.includes(pathname), [pathname]);
  const userId = session?.user?.id;
  const skippedKey = userId ? `${SKIPPED_KEY}_${userId}` : SKIPPED_KEY;
  const completedKey = userId ? `${COMPLETED_KEY}_${userId}` : COMPLETED_KEY;

  useEffect(() => {
    async function load() {
      if (status !== "authenticated" || !userId || !isEntryPath) {
        setVisible(false);
        setLoading(false);
        return;
      }

      const skipped = window.localStorage.getItem(skippedKey) === "true";
      const completed = window.localStorage.getItem(completedKey) === "true";
      if (skipped || completed) {
        setVisible(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/users/me/interests");
        if (!response.ok) {
          setVisible(false);
          setLoading(false);
          return;
        }

        const payload = (await response.json()) as InterestsResponse;
        const hasOnboardingInterests = payload.data.interests.some(
          (interest) => interest.source === "ONBOARDING"
        );

        setVisible(!hasOnboardingInterests);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [completedKey, isEntryPath, skippedKey, status, userId]);

  const handleSkip = () => {
    window.localStorage.setItem(skippedKey, "true");
    setVisible(false);
    if (pathname === "/") {
      router.replace("/quizzes");
    }
  };

  const handleComplete = () => {
    window.localStorage.setItem(completedKey, "true");
    setVisible(false);
    if (pathname === "/") {
      router.replace("/quizzes");
    }
  };

  if (loading || !visible || status !== "authenticated") {
    return null;
  }

  return <InterestCaptureFlow onSkip={handleSkip} onComplete={handleComplete} />;
}
