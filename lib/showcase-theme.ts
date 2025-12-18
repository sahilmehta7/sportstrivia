
export type BackgroundVariant = "default" | "dark" | "vibrant" | "cool";

function composeThemeClasses(light: string, dark: string) {
  const darkPrefixed = dark
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => (cls.startsWith("dark:") ? cls : `dark:${cls}`))
    .join(" ");
  return `${light} ${darkPrefixed}`.trim();
}

export function getGlassCard() {
  return composeThemeClasses(
    "bg-white/60 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] border border-slate-200/50",
    "bg-white/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] border-white/10",
  );
}

export function getGlassBackground() {
  return composeThemeClasses(
    "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80",
    "bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80",
  );
}

export function getGlassBorder() {
  return composeThemeClasses("border-white/20", "border-white/10");
}

export function getTextColor(variant: "primary" | "secondary" | "muted" = "primary") {
  const tokens = {
    primary: composeThemeClasses("text-slate-900", "text-white"),
    secondary: composeThemeClasses("text-slate-700", "text-white/80"),
    muted: composeThemeClasses("text-slate-600", "text-white/60"),
  };
  return tokens[variant] ?? tokens.primary;
}

export function getAccentColor(
  type: "primary" | "secondary" | "success" | "warning" | "error",
) {
  const tokens = {
    primary: composeThemeClasses("text-blue-600", "text-blue-300"),
    secondary: composeThemeClasses("text-purple-600", "text-purple-300"),
    success: composeThemeClasses("text-emerald-600", "text-emerald-300"),
    warning: composeThemeClasses("text-amber-600", "text-amber-300"),
    error: composeThemeClasses("text-red-600", "text-red-300"),
  };
  return tokens[type] ?? tokens.primary;
}

export function getBackgroundVariant(variant: BackgroundVariant) {
  switch (variant) {
    case "default":
      return composeThemeClasses(
        "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80",
        "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
      );
    case "dark":
      return composeThemeClasses(
        "bg-gradient-to-br from-slate-100/90 via-slate-50/80 to-white/70",
        "bg-gradient-to-br from-black via-slate-950 to-slate-900",
      );
    case "vibrant":
      return composeThemeClasses(
        "bg-gradient-to-br from-purple-50/80 via-pink-50/90 to-rose-50/80",
        "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
      );
    case "cool":
      return composeThemeClasses(
        "bg-gradient-to-br from-cyan-50/80 via-blue-50/90 to-indigo-50/80",
        "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
      );
    default:
      return composeThemeClasses(
        "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80",
        "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
      );
  }
}

export function getBlurCircles() {
  const circle = (light: string, dark: string) => composeThemeClasses(light, dark);
  return {
    circle1: circle("bg-emerald-400/20", "bg-emerald-400/40"),
    circle2: circle("bg-pink-500/20", "bg-pink-500/40"),
    circle3: circle("bg-blue-500/15", "bg-blue-500/30"),
  };
}

export function getShadowColor() {
  return composeThemeClasses(
    "shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)]",
    "shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]",
  );
}

export type SurfaceVariant = "base" | "raised" | "sunken";

export function getSurfaceStyles(variant: SurfaceVariant = "base") {
  switch (variant) {
    case "raised":
      return composeThemeClasses(
        "bg-white/90 border border-white/70 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)]",
        "bg-white/12 border-white/20 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)]",
      );
    case "sunken":
      return composeThemeClasses(
        "bg-white/65 border border-white/50 shadow-[inset_0_16px_40px_-24px_rgba(15,23,42,0.15)]",
        "bg-white/6 border-white/12 shadow-[inset_0_18px_45px_-30px_rgba(0,0,0,0.6)]",
      );
    default:
      return composeThemeClasses(
        "bg-white/80 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        "bg-white/8 border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
      );
  }
}

export function getInputStyles() {
  return composeThemeClasses(
    "bg-white/80 border border-slate-200/70 text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/70",
    "bg-white/10 border-white/15 text-white placeholder:text-white/50 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/40",
  );
}

export type ChipEmphasis = "solid" | "outline" | "ghost";

export function getChipStyles(emphasis: ChipEmphasis = "solid") {
  switch (emphasis) {
    case "outline":
      return composeThemeClasses(
        "border border-slate-200 text-slate-600 bg-white/70 hover:bg-white/90",
        "border-white/25 text-white/80 bg-white/5 hover:bg-white/10",
      );
    case "ghost":
      return composeThemeClasses(
        "border border-transparent text-slate-500 hover:bg-slate-100/70",
        "border-transparent text-white/70 hover:bg-white/10",
      );
    default:
      return composeThemeClasses(
        "bg-slate-900 text-white border border-slate-900 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.45)]",
        "bg-white/15 text-white border-white/20 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.45)]",
      );
  }
}

export function getDividerStyles() {
  return composeThemeClasses("bg-slate-200", "bg-white/10");
}

export function getCardGlow() {
  return composeThemeClasses(
    "shadow-[0_26px_60px_-24px_rgba(59,130,246,0.25)]",
    "shadow-[0_32px_80px_-32px_rgba(15,23,42,0.65)]",
  );
}
