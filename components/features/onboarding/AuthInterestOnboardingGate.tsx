"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { InterestCaptureFlow } from "@/components/features/onboarding/InterestCaptureFlow";

const SKIPPED_KEY = "hasSkippedInterestOnboarding_v1";
const COMPLETED_KEY = "hasCompletedInterestOnboarding_v1";
const ENTRY_PATHS = ["/", "/quizzes", "/leaderboard"];
const TOPICS_PRECHECK_LIMIT = 5000;

type InterestsResponse = {
  data: {
    interests: Array<{
      source: string;
    }>;
  };
};

type FollowsResponse = {
  data: {
    follows?: Array<{ topic: { id: string } }>;
    sports?: Array<{ topic: { id: string } }>;
    teams?: Array<{ topic: { id: string } }>;
    athletes?: Array<{ topic: { id: string } }>;
    events?: Array<{ topic: { id: string } }>;
    organizations?: Array<{ topic: { id: string } }>;
  };
};

type TopicsResponse = {
  data: {
    topics: Array<{
      schemaType: string;
      entityStatus?: string;
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

      try {
        const [interestsResponse, followsResponse, topicsResponse] = await Promise.all([
          fetch("/api/users/me/interests"),
          fetch("/api/users/me/follows"),
          fetch(`/api/topics?limit=${TOPICS_PRECHECK_LIMIT}`),
        ]);

        if (!interestsResponse.ok || !followsResponse.ok || !topicsResponse.ok) {
          setVisible(false);
          setLoading(false);
          return;
        }

        const interestsPayload = (await interestsResponse.json()) as Partial<InterestsResponse>;
        const followsPayload = (await followsResponse.json()) as Partial<FollowsResponse>;
        const topicsPayload = (await topicsResponse.json()) as Partial<TopicsResponse>;

        const interests = interestsPayload?.data?.interests;
        const follows = followsPayload?.data;
        const topics = topicsPayload?.data?.topics;

        if (!Array.isArray(interests) || !follows || !Array.isArray(topics)) {
          setVisible(false);
          return;
        }

        const hasAnyInterests = interests.length > 0;
        const hasAnyFollows =
          (follows.follows?.length ?? 0) > 0 ||
          (follows.sports?.length ?? 0) > 0 ||
          (follows.teams?.length ?? 0) > 0 ||
          (follows.athletes?.length ?? 0) > 0 ||
          (follows.events?.length ?? 0) > 0 ||
          (follows.organizations?.length ?? 0) > 0;
        const hasEligibleSports = topics.some(
          (topic) => topic.schemaType === "SPORT" && topic.entityStatus === "READY"
        );
        const shouldPromptFromServer = !hasAnyInterests && !hasAnyFollows && hasEligibleSports;

        setVisible(shouldPromptFromServer && !skipped && !completed);
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
