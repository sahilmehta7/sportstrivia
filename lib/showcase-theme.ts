/**
 * Neon Arena Theme Utilities
 * 
 * A unified theme system using CSS variables from globals.css.
 * All utilities work with both light and dark modes via CSS variables.
 */

export type BackgroundVariant = "default" | "dark" | "vibrant" | "cool" | "neon";
export type SurfaceVariant = "base" | "raised" | "sunken" | "glass";
export type ChipEmphasis = "solid" | "outline" | "ghost" | "neon";
export type NeonColor = "cyan" | "magenta" | "lime";

/* ===================
   GLASS CARD STYLES
   =================== */

/**
 * Standard glass card with backdrop blur
 */
export function getGlassCard(): string {
  return "glass rounded-lg";
}

/**
 * Elevated glass card with stronger glow
 */
export function getGlassCardElevated(): string {
  return "glass-elevated rounded-lg";
}

/**
 * Glass card with hover glow effect
 */
export function getGlassCardInteractive(): string {
  return "glass rounded-lg transition-all duration-base hover:shadow-glass-lg hover:border-primary/20";
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
      return "bg-gradient-to-br from-secondary/10 via-background to-primary/10";
    case "cool":
      return "bg-gradient-to-br from-primary/10 via-background to-accent/10";
    case "neon":
      return "bg-gradient-to-br from-neon-cyan/5 via-background to-neon-magenta/5";
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
 * Get blur circle classes for animated backgrounds
 */
export function getBlurCircles(): BlurCircles {
  return {
    circle1: "blur-circle blur-circle-cyan",
    circle2: "blur-circle blur-circle-magenta",
    circle3: "blur-circle blur-circle-lime",
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
export function getGradientText(variant: "neon" | "accent" = "neon"): string {
  return variant === "neon" ? "text-gradient-neon" : "text-gradient-accent";
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
   NEON GLOW EFFECTS
   =================== */

/**
 * Get neon glow box-shadow class
 */
export function getNeonGlow(color: NeonColor = "cyan"): string {
  const glows: Record<NeonColor, string> = {
    cyan: "shadow-neon-cyan",
    magenta: "shadow-neon-magenta",
    lime: "shadow-neon-lime",
  };
  return glows[color];
}

/**
 * Get neon glow utility class
 */
export function getNeonGlowClass(color: NeonColor = "cyan"): string {
  const classes: Record<NeonColor, string> = {
    cyan: "neon-glow-cyan",
    magenta: "neon-glow-magenta",
    lime: "neon-glow-lime",
  };
  return classes[color];
}

/**
 * Animated neon glow
 */
export function getAnimatedNeonGlow(): string {
  return "animate-glow-pulse";
}

/* ===================
   SURFACE STYLES
   =================== */

export function getSurfaceStyles(variant: SurfaceVariant = "base"): string {
  switch (variant) {
    case "raised":
      return "bg-card-elevated border border-border shadow-glass";
    case "sunken":
      return "bg-muted border border-border/50 shadow-inner";
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
    "h-input w-full rounded-md",
    "bg-input border border-border",
    "text-foreground placeholder:text-muted-foreground",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
    "transition-colors duration-fast",
  ].join(" ");
}

export function getInputStylesCompact(): string {
  return [
    "h-input-sm w-full rounded-md",
    "bg-input border border-border",
    "text-foreground placeholder:text-muted-foreground",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
    "transition-colors duration-fast",
  ].join(" ");
}

/* ===================
   CHIP/BADGE STYLES
   =================== */

export function getChipStyles(emphasis: ChipEmphasis = "solid"): string {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors";

  switch (emphasis) {
    case "outline":
      return `${base} border border-border text-muted-foreground hover:bg-muted`;
    case "ghost":
      return `${base} text-muted-foreground hover:bg-muted`;
    case "neon":
      return `${base} bg-primary/10 text-primary border border-primary/30 shadow-neon-cyan`;
    default:
      return `${base} bg-primary text-primary-foreground`;
  }
}

/* ===================
   BUTTON STYLES
   =================== */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "neon" | "destructive";

export function getButtonStyles(variant: ButtonVariant = "primary"): string {
  const base = [
    "inline-flex items-center justify-center",
    "min-h-touch rounded-md px-4",
    "font-medium transition-all duration-base",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" ");

  switch (variant) {
    case "secondary":
      return `${base} bg-secondary text-secondary-foreground hover:bg-secondary/80`;
    case "ghost":
      return `${base} hover:bg-muted text-muted-foreground`;
    case "outline":
      return `${base} border border-border bg-transparent hover:bg-muted`;
    case "neon":
      return `${base} bg-primary text-primary-foreground shadow-neon-cyan hover:shadow-neon-cyan/60 hover:scale-105`;
    case "destructive":
      return `${base} bg-destructive text-destructive-foreground hover:bg-destructive/90`;
    default:
      return `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
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
 * @deprecated Use getBackgroundVariant instead
 */
export function getGlassBackground(): string {
  return getBackgroundVariant("neon");
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
