"use client";

import { useEffect, useState } from "react";

type MobileAppContextState = {
  isDetectingMobileAppContext: boolean;
  isMobileAppContext: boolean;
  isMobileViewport: boolean;
  shouldShowPreOnboardingContext: boolean;
};

function detectMobileAppContext() {
  if (typeof window === "undefined") {
    return false;
  }

  const isStandaloneDisplayMode = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  const isAndroidTrustedWebActivity = document.referrer.startsWith("android-app://");

  return isStandaloneDisplayMode || isIosStandalone || isAndroidTrustedWebActivity;
}

export function useMobileAppContext() {
  const [state, setState] = useState<MobileAppContextState>({
    isDetectingMobileAppContext: true,
    isMobileAppContext: false,
    isMobileViewport: false,
    shouldShowPreOnboardingContext: false,
  });

  useEffect(() => {
    const standaloneMediaQuery = window.matchMedia("(display-mode: standalone)");
    const mobileViewportMediaQuery = window.matchMedia("(max-width: 1023.98px)");

    const updateContext = () => {
      const isMobileAppContext = detectMobileAppContext();
      const isMobileViewport = mobileViewportMediaQuery.matches;

      setState({
        isDetectingMobileAppContext: false,
        isMobileAppContext,
        isMobileViewport,
        shouldShowPreOnboardingContext: isMobileAppContext || isMobileViewport,
      });
    };

    updateContext();
    standaloneMediaQuery.addEventListener("change", updateContext);
    mobileViewportMediaQuery.addEventListener("change", updateContext);

    return () => {
      standaloneMediaQuery.removeEventListener("change", updateContext);
      mobileViewportMediaQuery.removeEventListener("change", updateContext);
    };
  }, []);

  return state;
}
