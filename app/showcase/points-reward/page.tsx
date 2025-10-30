"use client";

import { ShowcasePage } from "@/components/showcase/ShowcasePage";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { PointsRewardDemos } from "@/components/shared/PointsRewardDemos";

export default function PointsRewardShowcasePage() {
  return (
    <ShowcaseThemeProvider>
      <ShowcasePage
        title="Points Reward Components"
        subtitle="Celebratory animated components for displaying user points and achievements"
        badge="UI Components"
        variant="default"
      >
        <PointsRewardDemos />
      </ShowcasePage>
    </ShowcaseThemeProvider>
  );
}

