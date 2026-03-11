"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PreOnboardingFlow } from "@/components/features/onboarding/PreOnboardingFlow";
import { trackEvent } from "@/lib/analytics";
import { usePreOnboardingState } from "@/hooks/usePreOnboardingState";

const APP_ENTRY_PATHS = ["/", "/quizzes", "/leaderboard"];

type MobileAppPreOnboardingGateProps = {
  isDetectingMobileAppContext: boolean;
  isMobileAppContext: boolean;
};

export function MobileAppPreOnboardingGate({
  isDetectingMobileAppContext,
  isMobileAppContext,
}: MobileAppPreOnboardingGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, shouldShow, markCompleted, markSkipped } = usePreOnboardingState();
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const isEligiblePath = useMemo(
    () => APP_ENTRY_PATHS.includes(pathname),
    [pathname]
  );

  const isVisible = !isDetectingMobileAppContext && isHydrated && isMobileAppContext && isEligiblePath && shouldShow;

  useEffect(() => {
    if (!isVisible || hasTrackedView) {
      return;
    }

    trackEvent("pre_onboarding_viewed", { path: pathname });
    setHasTrackedView(true);
  }, [hasTrackedView, isVisible, pathname]);

  useEffect(() => {
    if (!isVisible) {
      setHasTrackedView(false);
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const navigateToQuizFeed = () => {
    router.replace("/quizzes");
  };

  const handleSkip = () => {
    trackEvent("pre_onboarding_skipped", { path: pathname });
    markSkipped();
    navigateToQuizFeed();
  };

  const handleFinish = () => {
    trackEvent("pre_onboarding_completed", { path: pathname });
    trackEvent("pre_onboarding_cta_clicked", { destination: "/quizzes", step: 3 });
    markCompleted();
    navigateToQuizFeed();
  };

  const handleStepChange = (step: number) => {
    trackEvent("pre_onboarding_step_viewed", { step });
  };

  return (
    <PreOnboardingFlow
      onFinish={handleFinish}
      onSkip={handleSkip}
      onStepChange={handleStepChange}
    />
  );
}
