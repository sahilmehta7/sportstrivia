"use client";

import { useState } from "react";
import { PointsRewardModal } from "./PointsRewardModal";
import { PointsRewardToast } from "./PointsRewardToast";
import { PointsReward } from "./PointsReward";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import type { PointsBreakdown } from "./PointsReward.types";

interface DemoExample {
  title: string;
  description: string;
  points: number;
  reason: string;
  category: "quiz" | "answer" | "streak" | "time" | "badge" | "friend" | "challenge";
  breakdown?: PointsBreakdown[];
}

const demoExamples: DemoExample[] = [
  {
    title: "Quiz Completion",
    description: "Complete a quiz successfully",
    points: 1250,
    reason: "Quiz completed! Great job!",
    category: "quiz",
    breakdown: [
      { label: "Base Points", points: 600, icon: "💯" },
      { label: "Accuracy Bonus", points: 400, icon: "🎯" },
      { label: "Time Bonus", points: 250, icon: "⚡" },
    ],
  },
  {
    title: "Correct Answer",
    description: "Answer a question correctly",
    points: 150,
    reason: "Correct answer!",
    category: "answer",
  },
  {
    title: "Streak Bonus",
    description: "Build up your streak",
    points: 85,
    reason: "5-question streak!",
    category: "streak",
  },
  {
    title: "Time Bonus",
    description: "Answer quickly",
    points: 45,
    reason: "Time bonus! Saved 12s",
    category: "time",
  },
  {
    title: "Badge Earned",
    description: "Unlock a new badge",
    points: 0,
    reason: "Badge unlocked: Quiz Master",
    category: "badge",
  },
  {
    title: "Friend Action",
    description: "Follow or interact with friends",
    points: 50,
    reason: "Followed @friendusername",
    category: "friend",
  },
  {
    title: "Challenge Won",
    description: "Win a challenge",
    points: 300,
    reason: "Challenge won!",
    category: "challenge",
  },
];

export function PointsRewardDemos() {
  const { theme } = useShowcaseTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [currentDemo, setCurrentDemo] = useState<DemoExample | null>(null);

  const showDemo = (demo: DemoExample, type: "modal" | "toast" | "inline") => {
    setCurrentDemo(demo);
    if (type === "modal") {
      setModalOpen(true);
    } else if (type === "toast") {
      setToastOpen(true);
    }
  };

  return (
    <div className="space-y-12">
      {/* Introduction */}
      <div className={`${getGlassCard(theme)} rounded-2xl p-6`}>
        <h2 className={`text-2xl font-bold mb-2 ${getTextColor(theme, "primary")}`}>
          Points Reward Component
        </h2>
        <p className={getTextColor(theme, "secondary")}>
          Celebratory animated components for displaying user points and achievements across different contexts. 
          Features glassmorphism styling, smooth animations, and support for multiple display formats.
        </p>
      </div>

      {/* Variants Overview */}
      <section>
        <h2 className={`text-xl font-semibold mb-4 ${getTextColor(theme, "primary")}`}>
          All Variants & Categories
        </h2>
        <div className="space-y-12">
          {demoExamples.map((demo, index) => (
            <div key={index} className={`${getGlassCard(theme)} rounded-2xl p-6 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${getTextColor(theme, "primary")}`}>
                    {demo.title}
                  </h3>
                  <p className={`text-sm ${getTextColor(theme, "secondary")}`}>
                    {demo.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ShowcaseButton
                    size="sm"
                    variant="outline"
                    onClick={() => showDemo(demo, "toast")}
                  >
                    Toast
                  </ShowcaseButton>
                  <ShowcaseButton
                    size="sm"
                    variant="outline"
                    onClick={() => showDemo(demo, "modal")}
                  >
                    Modal
                  </ShowcaseButton>
                </div>
              </div>
              
              {/* Inline variant demonstration */}
              <div className="mt-4">
                <p className={`text-xs uppercase tracking-wider mb-3 ${getTextColor(theme, "muted")}`}>
                  Inline Variant
                </p>
                <PointsReward
                  points={demo.points}
                  reason={demo.reason}
                  category={demo.category}
                  variant="inline"
                  size="md"
                  breakdown={demo.breakdown}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {currentDemo && (
        <PointsRewardModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          points={currentDemo.points}
          reason={currentDemo.reason}
          category={currentDemo.category}
          breakdown={currentDemo.breakdown}
        />
      )}

      {/* Toast */}
      {currentDemo && (
        <PointsRewardToast
          open={toastOpen}
          onOpenChange={setToastOpen}
          points={currentDemo.points}
          reason={currentDemo.reason}
          category={currentDemo.category}
          breakdown={currentDemo.breakdown}
        />
      )}
    </div>
  );
}

