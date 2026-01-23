/**
 * Minimalist Athletic Theme Utilities
 * 
 * A unified theme system using CSS variables from globals.css.
 * All utilities work with both light and dark modes via CSS variables.
 */

export type BackgroundVariant = "default" | "dark" | "vibrant" | "cool" | "editorial";
export type SurfaceVariant = "base" | "raised" | "sunken" | "glass";
export type ChipEmphasis = "solid" | "outline" | "ghost" | "accent";

/* ===================
   GLASS CARD STYLES
   =================== */

/**
 * Standard glass card with backdrop blur
 */
export function getGlassCard(): string {
  return "glass rounded-md";
}

/**
 * Elevated glass card with stronger glow
 */
export function getGlassCardElevated(): string {
  return "glass-elevated rounded-md";
}

/**
 * Glass card with hover effect
 */
export function getGlassCardInteractive(): string {
  return "glass rounded-md transition-all duration-base hover:shadow-athletic hover:border-primary/20";
}

/* ===================
   BACKGROUND VARIANTS
   =================== */

export function getBackgroundVariant(variant: BackgroundVariant): string {
  switch (variant) {
    case "default":
      return "bg-background";
    case "dark":
      return "bg-card";
    case "vibrant":
      return "bg-gradient-to-br from-accent/10 via-background to-primary/10";
    case "cool":
      return "bg-gradient-to-br from-primary/10 via-background to-secondary/10";
    case "editorial":
      return "bg-gradient-to-br from-primary/5 via-background to-accent/5";
    default:
      return "bg-background";
  }
}

/**
 * Animated background with blur circles
 */
export function getAnimatedBackground(): string {
  return "relative overflow-hidden bg-background";
}

/* ===================
   BLUR CIRCLES
   =================== */

export type BlurCircles = {
  circle1: string;
  circle2: string;
  circle3: string;
};

/**
 * Get blur circle classes for animated backgrounds (more subtle for editorial)
 */
export function getBlurCircles(): BlurCircles {
  return {
    circle1: "blur-circle bg-primary/10",
    circle2: "blur-circle bg-accent/10",
    circle3: "blur-circle bg-secondary/10",
  };
}

/* ===================
   TEXT COLORS
   =================== */

export function getTextColor(variant: "primary" | "secondary" | "muted" = "primary"): string {
  const tokens: Record<string, string> = {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    muted: "text-muted-foreground/70",
  };
  return tokens[variant] ?? tokens.primary;
}

/**
 * Gradient text effect
 */
export function getGradientText(variant: "editorial" | "accent" | "neon" = "editorial"): string {
  if (variant === "neon") return "text-gradient-primary"; // Use primary for neon
  return variant === "editorial" ? "text-gradient-editorial" : "text-gradient-accent";
}

/* ===================
   ACCENT COLORS
   =================== */

export function getAccentColor(
  type: "primary" | "secondary" | "success" | "warning" | "error"
): string {
  const tokens: Record<string, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-success",
    warning: "text-warning",
    error: "text-destructive",
  };
  return tokens[type] ?? tokens.primary;
}

/* ===================
   SURFACE STYLES
   =================== */

export function getSurfaceStyles(variant: SurfaceVariant = "base"): string {
  switch (variant) {
    case "raised":
      return "bg-card-elevated border border-border shadow-athletic";
    case "sunken":
      return "bg-muted border border-border/50";
    case "glass":
      return "glass";
    default:
      return "bg-card border border-border";
  }
}

/* ===================
   INPUT STYLES
   =================== */

export function getInputStyles(): string {
  return [
    "h-input w-full rounded-sm",
    "bg-input border border-border",
    "text-foreground placeholder:text-muted-foreground",
    "focus:border-primary focus:ring-2 focus:ring-primary/10",
    "transition-colors duration-fast",
  ].join(" ");
}

export function getInputStylesCompact(): string {
  return [
    "h-input-sm w-full rounded-sm",
    "bg-input border border-border",
    "text-foreground placeholder:text-muted-foreground",
    "focus:border-primary focus:ring-2 focus:ring-primary/10",
    "transition-colors duration-fast",
  ].join(" ");
}

/* ===================
   CHIP/BADGE STYLES
   =================== */

export function getChipStyles(emphasis: ChipEmphasis = "solid"): string {
  const base = "inline-flex items-center rounded-sm px-3 py-1 text-sm font-semibold transition-colors uppercase tracking-wider";

  switch (emphasis) {
    case "outline":
      return `${base} border border-border text-muted-foreground hover:bg-muted`;
    case "ghost":
      return `${base} text-muted-foreground hover:bg-muted`;
    case "accent":
      return `${base} bg-accent/20 text-accent border border-accent/30`;
    default:
      return `${base} bg-primary text-primary-foreground`;
  }
}

/* ===================
   BUTTON STYLES
   =================== */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "accent" | "destructive";

export function getButtonStyles(variant: ButtonVariant = "primary"): string {
  const base = [
    "inline-flex items-center justify-center",
    "min-h-touch rounded-sm px-6",
    "font-bold uppercase tracking-widest transition-all duration-base",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" ");

  switch (variant) {
    case "secondary":
      return `${base} bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-athletic`;
    case "ghost":
      return `${base} hover:bg-muted text-foreground`;
    case "outline":
      return `${base} border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground`;
    case "accent":
      return `${base} bg-accent text-accent-foreground shadow-athletic hover:scale-[1.02]`;
    case "destructive":
      return `${base} bg-destructive text-destructive-foreground hover:bg-destructive/90`;
    default:
      return `${base} bg-primary text-primary-foreground hover:bg-primary/95 shadow-athletic`;
  }
}

/* ===================
   CARD GLOW EFFECT
   =================== */

export function getCardGlow(): string {
  return "shadow-glass hover:shadow-glass-lg transition-shadow duration-base";
}

/* ===================
   DIVIDER
   =================== */

export function getDividerStyles(): string {
  return "bg-border";
}

/* ===================
   LEGACY COMPATIBILITY
   =================== */

/**
 * @deprecated Use getBackgroundVariant("editorial") instead
 */
export function getGlassBackground(): string {
  return getBackgroundVariant("editorial");
}

/**
 * @deprecated Use getSurfaceStyles("glass") instead
 */
export function getGlassBorder(): string {
  return "border-border";
}

/**
 * @deprecated Use getNeonGlow instead
 */
export function getShadowColor(): string {
  return "shadow-glass";
}
