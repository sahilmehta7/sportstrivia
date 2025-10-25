type ShowcaseTheme = "light" | "dark";

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
