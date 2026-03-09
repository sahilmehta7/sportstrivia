"use client";

import { useEffect, useState } from "react";

type MobileAppContextState = {
  isDetectingMobileAppContext: boolean;
  isMobileAppContext: boolean;
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
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateContext = () => {
      setState({
        isDetectingMobileAppContext: false,
        isMobileAppContext: detectMobileAppContext(),
      });
    };

    updateContext();
    mediaQuery.addEventListener("change", updateContext);

    return () => {
      mediaQuery.removeEventListener("change", updateContext);
    };
  }, []);

  return state;
}
