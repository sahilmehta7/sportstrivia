export type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "outline"
  | "ghost"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export const glassBase = [
  // Base glass surface with subtle border and blur
  "backdrop-blur-xl",
  "border",
  "transition-colors",
  "transition-shadow",
  "duration-200",
  // Light and dark borders that match showcase surfaces
  "border-slate-200/60",
  "bg-white/70",
  "dark:border-white/10",
  "dark:bg-white/10",
].join(" ");

export const focusRing = [
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-offset-2",
  "ring-offset-transparent",
  "dark:ring-offset-transparent",
].join(" ");

export const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-[10px] gap-1.5 rounded-full",
  sm: "h-8 px-3 text-xs gap-2 rounded-full",
  md: "h-10 px-4 text-sm gap-2.5 rounded-full",
  lg: "h-12 px-5 text-base gap-3 rounded-full",
};

// Text colors default to high contrast on glass surfaces
const textBase = "text-slate-900 dark:text-white";

// Variant maps tuned to match existing showcase glass tokens
export const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    // Footer-like CTA gradient (no glass surface)
    "text-white",
    "bg-gradient-to-r from-orange-400 to-pink-500",
    "hover:from-orange-400 hover:to-pink-500 hover:brightness-[1.05]",
    "active:brightness-95",
    "shadow-[0_12px_30px_-16px_rgba(249,115,22,0.55)]",
    "dark:shadow-[0_12px_30px_-16px_rgba(249,115,22,0.45)]",
  ].join(" "),

  secondary: [
    glassBase,
    textBase,
    "bg-gradient-to-br from-slate-100/70 via-slate-50/60 to-slate-100/70",
    "dark:from-white/10 dark:via-white/5 dark:to-white/10",
    "hover:from-slate-200/70 hover:to-slate-200/70",
    "active:from-slate-300/70 active:to-slate-300/70",
  ].join(" "),

  destructive: [
    glassBase,
    textBase,
    "bg-gradient-to-br from-red-500/20 via-rose-500/15 to-red-500/20",
    "dark:from-red-400/20 dark:via-rose-400/15 dark:to-red-400/20",
    "hover:from-red-500/30 hover:to-rose-500/30",
    "active:from-red-600/35 active:to-rose-600/35",
  ].join(" "),

  success: [
    glassBase,
    textBase,
    "bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-teal-500/20",
    "dark:from-emerald-400/20 dark:via-emerald-400/15 dark:to-teal-400/20",
    "hover:from-emerald-500/30 hover:to-teal-500/30",
    "active:from-emerald-600/35 active:to-teal-600/35",
  ].join(" "),

  warning: [
    glassBase,
    textBase,
    "bg-gradient-to-br from-amber-500/25 via-amber-500/15 to-orange-500/20",
    "dark:from-amber-400/25 dark:via-amber-400/15 dark:to-orange-400/20",
    "hover:from-amber-500/35 hover:to-orange-500/30",
    "active:from-amber-600/40 active:to-orange-600/35",
  ].join(" "),

  info: [
    glassBase,
    textBase,
    "bg-gradient-to-br from-cyan-500/20 via-sky-500/15 to-blue-500/20",
    "dark:from-cyan-400/20 dark:via-sky-400/15 dark:to-blue-400/20",
    "hover:from-cyan-500/30 hover:to-blue-500/30",
    "active:from-cyan-600/35 active:to-blue-600/35",
  ].join(" "),

  outline: [
    focusRing,
    "backdrop-blur-xl",
    "border",
    "border-slate-300/50 dark:border-white/20",
    "bg-transparent",
    textBase,
    "hover:bg-white/20 dark:hover:bg-white/10",
    "active:bg-white/30 dark:active:bg-white/15",
  ].join(" "),

  ghost: [
    focusRing,
    "bg-transparent",
    textBase,
    "hover:bg-white/15 dark:hover:bg-white/5",
    "active:bg-white/25 dark:active:bg-white/10",
  ].join(" "),

  link: [
    focusRing,
    "bg-transparent border-0 p-0 h-auto",
    "text-blue-700 hover:text-blue-900",
    "dark:text-blue-300 dark:hover:text-blue-200",
    "underline underline-offset-4",
  ].join(" "),
};

export const iconOnlySizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 w-7 rounded-full",
  sm: "h-8 w-8 rounded-full",
  md: "h-10 w-10 rounded-full",
  lg: "h-12 w-12 rounded-full",
};


