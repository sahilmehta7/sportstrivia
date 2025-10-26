import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";

export type BackgroundVariant = "default" | "dark" | "vibrant" | "cool";

export function getGlassCard(theme: ShowcaseTheme) {
  return theme === "light"
    ? "bg-white/60 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] border border-slate-200/50"
    : "bg-white/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] border border-white/10";
}

export function getGlassBackground(theme: ShowcaseTheme) {
  return theme === "light"
    ? "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80"
    : "bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80";
}

export function getGlassBorder(theme: ShowcaseTheme) {
  return theme === "light"
    ? "border-white/20"
    : "border-white/10";
}

export function getTextColor(theme: ShowcaseTheme, variant: "primary" | "secondary" | "muted" = "primary") {
  if (theme === "light") {
    switch (variant) {
      case "primary": return "text-slate-900";
      case "secondary": return "text-slate-700";
      case "muted": return "text-slate-600";
      default: return "text-slate-900";
    }
  } else {
    switch (variant) {
      case "primary": return "text-white";
      case "secondary": return "text-white/80";
      case "muted": return "text-white/60";
      default: return "text-white";
    }
  }
}

export function getAccentColor(theme: ShowcaseTheme, type: "primary" | "secondary" | "success" | "warning" | "error") {
  if (theme === "light") {
    switch (type) {
      case "primary": return "text-blue-600";
      case "secondary": return "text-purple-600";
      case "success": return "text-emerald-600";
      case "warning": return "text-amber-600";
      case "error": return "text-red-600";
      default: return "text-blue-600";
    }
  } else {
    switch (type) {
      case "primary": return "text-blue-300";
      case "secondary": return "text-purple-300";
      case "success": return "text-emerald-300";
      case "warning": return "text-amber-300";
      case "error": return "text-red-300";
      default: return "text-blue-300";
    }
  }
}

export function getBackgroundVariant(variant: BackgroundVariant, theme: ShowcaseTheme) {
  if (theme === "light") {
    switch (variant) {
      case "default": return "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80";
      case "dark": return "bg-gradient-to-br from-slate-100/90 via-slate-50/80 to-white/70";
      case "vibrant": return "bg-gradient-to-br from-purple-50/80 via-pink-50/90 to-rose-50/80";
      case "cool": return "bg-gradient-to-br from-cyan-50/80 via-blue-50/90 to-indigo-50/80";
      default: return "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80";
    }
  } else {
    switch (variant) {
      case "default": return "bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500";
      case "dark": return "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800";
      case "vibrant": return "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-600";
      case "cool": return "bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-800";
      default: return "bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500";
    }
  }
}

export function getBlurCircles(theme: ShowcaseTheme) {
  if (theme === "light") {
    return {
      circle1: "bg-emerald-400/20",
      circle2: "bg-pink-500/20", 
      circle3: "bg-blue-500/15"
    };
  } else {
    return {
      circle1: "bg-emerald-400/40",
      circle2: "bg-pink-500/40",
      circle3: "bg-blue-500/30"
    };
  }
}

export function getShadowColor(theme: ShowcaseTheme) {
  return theme === "light"
    ? "shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)]"
    : "shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]";
}

export type SurfaceVariant = "base" | "raised" | "sunken";

export function getSurfaceStyles(theme: ShowcaseTheme, variant: SurfaceVariant = "base") {
  const base = theme === "light"
    ? "bg-white/80 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
    : "bg-white/8 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

  const raised = theme === "light"
    ? "bg-white/90 border border-white/70 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)]"
    : "bg-white/12 border border-white/20 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)]";

  const sunken = theme === "light"
    ? "bg-white/65 border border-white/50 shadow-[inset_0_16px_40px_-24px_rgba(15,23,42,0.15)]"
    : "bg-white/6 border border-white/12 shadow-[inset_0_18px_45px_-30px_rgba(0,0,0,0.6)]";

  switch (variant) {
    case "raised":
      return raised;
    case "sunken":
      return sunken;
    default:
      return base;
  }
}

export function getInputStyles(theme: ShowcaseTheme) {
  return theme === "light"
    ? "bg-white/80 border border-slate-200/70 text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/70"
    : "bg-white/10 border border-white/15 text-white placeholder:text-white/50 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/40";
}

export type ChipEmphasis = "solid" | "outline" | "ghost";

export function getChipStyles(theme: ShowcaseTheme, emphasis: ChipEmphasis = "solid") {
  if (theme === "light") {
    switch (emphasis) {
      case "outline":
        return "border border-slate-200 text-slate-600 bg-white/70 hover:bg-white/90";
      case "ghost":
        return "border border-transparent text-slate-500 hover:bg-slate-100/70";
      default:
        return "bg-slate-900 text-white border border-slate-900 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.45)]";
    }
  }

  switch (emphasis) {
    case "outline":
      return "border border-white/25 text-white/80 bg-white/5 hover:bg-white/10";
    case "ghost":
      return "border border-transparent text-white/70 hover:bg-white/10";
    default:
      return "bg-white/15 text-white border border-white/20 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.45)]";
  }
}

export function getDividerStyles(theme: ShowcaseTheme) {
  return theme === "light" ? "bg-slate-200" : "bg-white/10";
}

export function getCardGlow(theme: ShowcaseTheme) {
  return theme === "light"
    ? "shadow-[0_26px_60px_-24px_rgba(59,130,246,0.25)]"
    : "shadow-[0_32px_80px_-32px_rgba(15,23,42,0.65)]";
}
