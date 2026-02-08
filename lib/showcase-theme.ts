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
 * @param _theme - Optional legacy parameter, ignored (uses CSS variables)
 */
export function getGlassCard(_theme?: unknown): string {
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

/**
 * Get text color for variant
 * @param _themeOrVariant - Optional legacy theme parameter OR the variant
 * @param variantArg - Variant when using legacy 2-arg signature
 */
export function getTextColor(
  _themeOrVariant?: unknown | "primary" | "secondary" | "muted",
  variantArg?: "primary" | "secondary" | "muted"
): string {
  // Support legacy (theme, variant) signature
  const variant = typeof _themeOrVariant === "string" && ["primary", "secondary", "muted"].includes(_themeOrVariant)
    ? _themeOrVariant as "primary" | "secondary" | "muted"
    : variantArg ?? "primary";
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
/**
 * Gradient text effect
 * @param _themeOrVariant - Optional legacy theme parameter OR the variant
 * @param variantArg - Variant when using legacy 2-arg signature
 */
export function getGradientText(
  _themeOrVariant?: unknown | "editorial" | "accent" | "neon",
  variantArg?: "editorial" | "accent" | "neon"
): string {
  // Support legacy (theme, variant) signature
  const variant = typeof _themeOrVariant === "string" && ["editorial", "accent", "neon"].includes(_themeOrVariant)
    ? _themeOrVariant as "editorial" | "accent" | "neon"
    : variantArg ?? "editorial";

  if (variant === "neon") return "text-gradient-primary"; // Use primary for neon
  return variant === "editorial" ? "text-gradient-editorial" : "text-gradient-accent";
}

/* ===================
   ACCENT COLORS
   =================== */

/**
 * Get accent color class
 * @param _themeOrType - Optional legacy theme parameter OR the type
 * @param typeArg - Type when using legacy 2-arg signature
 */
export function getAccentColor(
  _themeOrType?: unknown | "primary" | "secondary" | "success" | "warning" | "error",
  typeArg?: "primary" | "secondary" | "success" | "warning" | "error"
): string {
  // Support legacy (theme, type) signature
  const type = typeof _themeOrType === "string" && ["primary", "secondary", "success", "warning", "error"].includes(_themeOrType)
    ? _themeOrType as "primary" | "secondary" | "success" | "warning" | "error"
    : typeArg ?? "primary";

  const tokens: Record<string, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-success",
    warning: "text-warning",
    error: "text-destructive",
  };
  return tokens[type] ?? tokens.primary;
}

/**
 * Get surface styles for variant
 * @param _themeOrVariant - Optional legacy theme parameter OR the variant
 * @param variantArg - Variant when using legacy 2-arg signature
 */
export function getSurfaceStyles(
  _themeOrVariant?: unknown | SurfaceVariant,
  variantArg?: SurfaceVariant
): string {
  // Support legacy (theme, variant) signature
  const variant = typeof _themeOrVariant === "string" && ["base", "raised", "sunken", "glass"].includes(_themeOrVariant)
    ? _themeOrVariant as SurfaceVariant
    : variantArg ?? "base";
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

/**
 * Get chip styles for emphasis
 * @param _themeOrEmphasis - Optional legacy theme parameter OR the emphasis
 * @param emphasisArg - Emphasis when using legacy 2-arg signature
 */
export function getChipStyles(
  _themeOrEmphasis?: unknown | ChipEmphasis,
  emphasisArg?: ChipEmphasis
): string {
  // Support legacy (theme, emphasis) signature
  const emphasis = typeof _themeOrEmphasis === "string" && ["solid", "outline", "ghost", "accent"].includes(_themeOrEmphasis)
    ? _themeOrEmphasis as ChipEmphasis
    : emphasisArg ?? "solid";
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

/**
 * Get divider styles
 * @param _theme - Optional legacy parameter, ignored
 */
export function getDividerStyles(_theme?: unknown): string {
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
