"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const COMPLETED_KEY = "hasCompletedPreOnboarding_v1";
const SKIPPED_KEY = "hasSkippedPreOnboarding_v1";
const FIRST_QUIZ_KEY = "hasCompletedFirstQuiz";
const PRE_ONBOARDING_STATE_EVENT = "pre-onboarding-state-change";

type PreOnboardingState = {
  isHydrated: boolean;
  hasCompleted: boolean;
  hasSkipped: boolean;
  hasCompletedFirstQuiz: boolean;
  shouldShow: boolean;
};

function readBoolean(key: string) {
  return window.localStorage.getItem(key) === "true";
}

export function usePreOnboardingState() {
  const [state, setState] = useState<PreOnboardingState>({
    isHydrated: false,
    hasCompleted: false,
    hasSkipped: false,
    hasCompletedFirstQuiz: false,
    shouldShow: false,
  });

  const syncFromStorage = useCallback(() => {
    const hasCompleted = readBoolean(COMPLETED_KEY);
    const hasSkipped = readBoolean(SKIPPED_KEY);
    const hasCompletedFirstQuiz = readBoolean(FIRST_QUIZ_KEY);

    setState({
      isHydrated: true,
      hasCompleted,
      hasSkipped,
      hasCompletedFirstQuiz,
      shouldShow: !hasCompleted && !hasSkipped && !hasCompletedFirstQuiz,
    });
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || [COMPLETED_KEY, SKIPPED_KEY, FIRST_QUIZ_KEY].includes(event.key)) {
        syncFromStorage();
      }
    };
    const handleStateChange = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PRE_ONBOARDING_STATE_EVENT, handleStateChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PRE_ONBOARDING_STATE_EVENT, handleStateChange);
    };
  }, [syncFromStorage]);

  const markCompleted = useCallback(() => {
    window.localStorage.setItem(COMPLETED_KEY, "true");
    window.localStorage.removeItem(SKIPPED_KEY);
    window.dispatchEvent(new Event(PRE_ONBOARDING_STATE_EVENT));
    syncFromStorage();
  }, [syncFromStorage]);

  const markSkipped = useCallback(() => {
    window.localStorage.setItem(SKIPPED_KEY, "true");
    window.dispatchEvent(new Event(PRE_ONBOARDING_STATE_EVENT));
    syncFromStorage();
  }, [syncFromStorage]);

  return useMemo(() => ({
    ...state,
    markCompleted,
    markSkipped,
  }), [markCompleted, markSkipped, state]);
}
