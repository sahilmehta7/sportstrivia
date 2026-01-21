export type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "outline"
  | "ghost"
  | "link"
  | "neon"
  | "glass";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export const glassBase = [
  "backdrop-blur-xl",
  "border",
  "transition-all",
  "duration-300",
  "border-white/10",
  "bg-white/10",
  "dark:border-white/10",
  "dark:bg-white/10",
].join(" ");

export const focusRing = [
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-primary/50",
  "focus-visible:ring-offset-2",
  "ring-offset-background",
].join(" ");

export const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-[10px] gap-1.5 rounded-full font-black tracking-widest",
  sm: "h-9 px-4 text-[10px] gap-2 rounded-full font-black tracking-widest",
  md: "h-11 px-6 text-xs gap-2.5 rounded-full font-black tracking-widest",
  lg: "h-14 px-8 text-sm gap-3 rounded-full font-black tracking-widest",
  xl: "h-16 px-10 text-base gap-4 rounded-full font-black tracking-widest",
};

const textBase = "text-foreground font-black uppercase tracking-widest";

export const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "text-primary-foreground",
    "bg-primary",
    "hover:opacity-90 hover:scale-[1.02]",
    "active:scale-95",
    "shadow-neon-cyan/20",
    "transition-all duration-300",
  ].join(" "),

  neon: [
    "text-primary-foreground",
    "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto]",
    "hover:bg-[position:right_center] hover:scale-[1.05]",
    "active:scale-95",
    "shadow-neon-cyan/40",
    "transition-all duration-500",
  ].join(" "),

  secondary: [
    glassBase,
    "text-foreground",
    "border-white/20",
    "hover:bg-white/20 hover:border-white/30",
    "active:scale-95",
  ].join(" "),

  destructive: [
    glassBase,
    "text-red-400",
    "border-red-500/20",
    "hover:bg-red-500/20",
    "active:scale-95",
  ].join(" "),

  success: [
    glassBase,
    "text-emerald-400",
    "border-emerald-500/20",
    "hover:bg-emerald-500/20",
    "active:scale-95",
  ].join(" "),

  warning: [
    glassBase,
    "text-amber-400",
    "border-amber-500/20",
    "hover:bg-amber-500/20",
    "active:scale-95",
  ].join(" "),

  info: [
    glassBase,
    "text-cyan-400",
    "border-cyan-500/20",
    "hover:bg-cyan-500/20",
    "active:scale-95",
  ].join(" "),

  outline: [
    "border-2",
    "border-white/10",
    "bg-transparent",
    "text-foreground",
    "hover:border-primary/50 hover:text-primary",
    "active:scale-95",
  ].join(" "),

  ghost: [
    "bg-transparent",
    "text-muted-foreground",
    "hover:text-foreground hover:bg-white/5",
    "active:scale-95",
  ].join(" "),

  link: [
    "bg-transparent border-0 p-0 h-auto",
    "text-primary hover:text-primary/80",
    "underline underline-offset-8 decoration-2",
  ].join(" "),

  glass: [
    glassBase,
    "text-foreground",
    "border-white/20",
    "hover:bg-white/20 hover:border-white/30",
    "active:scale-95",
  ].join(" "),
};

export const iconOnlySizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 w-8 rounded-full",
  sm: "h-9 w-9 rounded-full",
  md: "h-11 w-11 rounded-full",
  lg: "h-14 w-14 rounded-full",
  xl: "h-16 w-16 rounded-full",
};
