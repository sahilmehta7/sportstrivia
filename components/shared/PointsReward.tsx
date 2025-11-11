"use client";

import React, { useEffect, useState } from "react";
import {
  Trophy,
  CheckCircle,
  Flame,
  Clock,
  Award,
  Users,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type {
  PointsRewardProps,
  PointsCategory,
  PointsSize,
  PointsBreakdown,
} from "./PointsReward.types";

// Icon mapping
const iconMap: Record<PointsCategory, LucideIcon> = {
  quiz: Trophy,
  answer: CheckCircle,
  streak: Flame,
  time: Clock,
  badge: Award,
  friend: Users,
  challenge: Target,
};

// Category colors (light/dark)
const categoryColors: Record<
  PointsCategory,
  { light: string; dark: string }
> = {
  quiz: { light: "text-blue-500", dark: "text-blue-400" },
  answer: { light: "text-green-500", dark: "text-green-400" },
  streak: { light: "text-orange-500", dark: "text-orange-400" },
  time: { light: "text-purple-500", dark: "text-purple-400" },
  badge: { light: "text-yellow-500", dark: "text-yellow-400" },
  friend: { light: "text-pink-500", dark: "text-pink-400" },
  challenge: { light: "text-red-500", dark: "text-red-400" },
};

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

function AnimatedNumber({ value, duration = 600, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={cn(mounted ? "animate-counter-up" : "", className)}>
      {displayValue}
    </span>
  );
}

export function PointsReward({
  points,
  reason,
  variant,
  size = "md",
  category,
  breakdown,
  onClose,
  className,
}: PointsRewardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const Icon = iconMap[category];
  const colorClass = isDark
    ? categoryColors[category].dark
    : categoryColors[category].light;

  // Size configurations
  const sizeConfig: Record<PointsSize, { icon: string; text: string; points: string }> = {
    sm: {
      icon: "h-4 w-4",
      text: "text-xs",
      points: "text-lg font-bold",
    },
    md: {
      icon: "h-6 w-6",
      text: "text-sm",
      points: "text-2xl font-bold",
    },
    lg: {
      icon: "h-8 w-8",
      text: "text-base",
      points: "text-4xl font-bold",
    },
  };

  const config = sizeConfig[size];

  // Base glassmorphism styles
  const glassStyles = isDark
    ? "bg-white/10 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    : "bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]";

  // Variant-specific styles
  const variantStyles = {
    toast: "rounded-lg p-4 min-w-[280px] max-w-[320px] animate-points-pop",
    modal: "rounded-2xl p-8 animate-points-pop",
    inline: "rounded-xl p-6 w-full animate-points-pop",
    badge: "rounded-full px-3 py-1.5 animate-points-pop",
  };

  // Gold gradient for points
  const pointsGradient =
    "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent";

  // Shimmer effect overlay
  const ShimmerOverlay = () => (
    <div className="absolute inset-0 overflow-hidden rounded-inherit">
      <div
        className={cn(
          "absolute inset-0 -translate-x-full animate-shimmer",
          isDark ? "bg-gradient-to-r from-transparent via-white/10 to-transparent" : "bg-gradient-to-r from-transparent via-white/30 to-transparent"
        )}
        style={{ width: "200%" }}
      />
    </div>
  );

  // Particle burst effect
  const ParticleBurst = () => {
    const particles = Array.from({ length: 8 });
    return (
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full animate-particle-burst"
            style={{
              background: isDark ? "#fbbf24" : "#f59e0b",
              transform: `rotate(${i * 45}deg) translateX(40px)`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  };

  // Content based on variant
  if (variant === "badge") {
    return (
      <div
        className={cn(
          "relative inline-flex items-center gap-1.5 overflow-hidden",
          glassStyles,
          variantStyles.badge,
          className
        )}
      >
        <span className="text-xs font-semibold text-foreground/80">+</span>
        <span className={cn("text-xs font-bold", pointsGradient)}>
          {points}
        </span>
        <span className="text-xs text-foreground/60">points</span>
      </div>
    );
  }

  if (variant === "toast") {
    return (
      <div
        className={cn(
          "relative flex items-center gap-3 overflow-hidden",
          glassStyles,
          variantStyles.toast,
          className
        )}
      >
        <ShimmerOverlay />
        <ParticleBurst />
        <div className={cn("shrink-0", colorClass)}>
          <Icon className={config.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={cn(config.points, pointsGradient)}>
              +<AnimatedNumber value={points} />
            </span>
            <span className="text-xs text-foreground/60">points</span>
          </div>
          <p className={cn(config.text, "text-foreground/80 truncate")}>
            {reason}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center text-center overflow-hidden",
          glassStyles,
          variantStyles.modal,
          className
        )}
      >
        <ShimmerOverlay />
        <ParticleBurst />
        
        {/* Icon */}
        <div className={cn("mb-4 animate-pulse-glow", colorClass)}>
          <Icon className={config.icon} />
        </div>

        {/* Points display */}
        <div className="mb-3">
          <div className="flex items-baseline justify-center gap-2">
            <span className={cn(config.points, pointsGradient)}>
              +<AnimatedNumber value={points} />
            </span>
            <span className="text-sm text-foreground/60">points earned</span>
          </div>
          <p className={cn(config.text, "text-foreground/80 mt-2")}>
            {reason}
          </p>
        </div>

        {/* Breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="w-full mt-4 space-y-2">
            <div className="h-px bg-border" />
            <div className="space-y-1.5">
              {breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-foreground/70">
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close button for modal */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "mt-6 px-6 py-2 rounded-lg font-medium transition-all",
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            )}
          >
            Awesome!
          </button>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        glassStyles,
        variantStyles.inline,
        className
      )}
    >
      <ShimmerOverlay />
      
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("shrink-0 mt-1", colorClass)}>
          <Icon className={config.icon} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn(config.points, pointsGradient)}>
              +<AnimatedNumber value={points} />
            </span>
            <span className="text-sm text-foreground/60">XP</span>
          </div>
          {reason ? (
            <p className={cn(config.text, "text-foreground/80 mb-4")}>
              {reason}
            </p>
          ) : null}

          {/* Breakdown */}
          {breakdown && breakdown.length > 0 && (
            <div className="divide-y divide-border/40 border-t border-border/40">
              {breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-6 py-3 text-sm text-foreground/80"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <span className="text-base leading-none">{item.icon}</span>}
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <span className="font-semibold text-foreground">+{item.points} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

