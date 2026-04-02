export type ShortsThemeVariant = "dark" | "flare" | "ice";

export type ShortsTheme = {
  name: string;
  background: {
    base: string;
    gradient: string;
    grid: string;
    vignette: string;
    glowA: string;
    glowB: string;
    glowC: string;
  };
  card: {
    fill: string;
    border: string;
    borderStrong: string;
    shadow: string;
    accentLine: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
  };
  timer: {
    safe: string;
    warning: string;
    danger: string;
    track: string;
  };
  answer: {
    idleBg: string;
    idleBorder: string;
    correctBg: string;
    correctBorder: string;
    pulseGlow: string;
  };
  brand: {
    plate: string;
    border: string;
  };
};

const DARK_THEME: ShortsTheme = {
  name: "Obsidian Arena",
  background: {
    base: "#05070D",
    gradient:
      "linear-gradient(152deg, rgba(7,12,22,0.97) 0%, rgba(6,18,34,0.95) 45%, rgba(10,8,16,0.97) 100%)",
    grid:
      "repeating-linear-gradient(90deg, rgba(121,222,255,0.06) 0 2px, transparent 2px 56px), repeating-linear-gradient(0deg, rgba(121,222,255,0.035) 0 2px, transparent 2px 56px)",
    vignette: "radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,4,9,0.65) 74%, rgba(1,2,5,0.9) 100%)",
    glowA: "rgba(59,130,246,0.4)",
    glowB: "rgba(6,182,212,0.34)",
    glowC: "rgba(239,68,68,0.24)",
  },
  card: {
    fill: "linear-gradient(160deg, rgba(9,17,32,0.88) 0%, rgba(8,14,28,0.82) 100%)",
    border: "rgba(125,211,252,0.24)",
    borderStrong: "rgba(125,211,252,0.54)",
    shadow: "0 26px 60px rgba(1,3,8,0.62)",
    accentLine: "linear-gradient(90deg, #22D3EE 0%, #3B82F6 45%, #EF4444 100%)",
  },
  text: {
    primary: "#ECF6FF",
    secondary: "rgba(206,232,255,0.84)",
    muted: "rgba(206,232,255,0.6)",
    accent: "#67E8F9",
  },
  timer: {
    safe: "#22D3EE",
    warning: "#F59E0B",
    danger: "#F43F5E",
    track: "rgba(103,232,249,0.14)",
  },
  answer: {
    idleBg: "linear-gradient(145deg, rgba(10,19,35,0.9), rgba(7,14,28,0.86))",
    idleBorder: "rgba(148,197,235,0.22)",
    correctBg: "linear-gradient(140deg, rgba(14,116,144,0.38), rgba(37,99,235,0.3))",
    correctBorder: "rgba(103,232,249,0.8)",
    pulseGlow: "0 0 38px rgba(34,211,238,0.48)",
  },
  brand: {
    plate: "rgba(7,15,30,0.9)",
    border: "rgba(125,211,252,0.35)",
  },
};

const FLARE_THEME: ShortsTheme = {
  name: "Stadium Flare",
  background: {
    base: "#12050A",
    gradient:
      "linear-gradient(154deg, rgba(35,6,14,0.94) 0%, rgba(57,8,19,0.92) 44%, rgba(16,8,22,0.95) 100%)",
    grid:
      "repeating-linear-gradient(90deg, rgba(251,146,60,0.055) 0 2px, transparent 2px 58px), repeating-linear-gradient(0deg, rgba(248,113,113,0.035) 0 2px, transparent 2px 58px)",
    vignette: "radial-gradient(circle at 50% 38%, transparent 0%, rgba(27,6,12,0.62) 72%, rgba(10,3,6,0.88) 100%)",
    glowA: "rgba(251,113,133,0.4)",
    glowB: "rgba(251,146,60,0.36)",
    glowC: "rgba(245,158,11,0.32)",
  },
  card: {
    fill: "linear-gradient(155deg, rgba(34,9,21,0.86) 0%, rgba(22,8,17,0.84) 100%)",
    border: "rgba(251,146,60,0.3)",
    borderStrong: "rgba(251,146,60,0.62)",
    shadow: "0 30px 64px rgba(9,2,3,0.6)",
    accentLine: "linear-gradient(90deg, #F97316 0%, #F59E0B 35%, #FB7185 100%)",
  },
  text: {
    primary: "#FFF2EC",
    secondary: "rgba(255,220,206,0.86)",
    muted: "rgba(255,220,206,0.6)",
    accent: "#FDBA74",
  },
  timer: {
    safe: "#FDBA74",
    warning: "#F59E0B",
    danger: "#FB7185",
    track: "rgba(253,186,116,0.16)",
  },
  answer: {
    idleBg: "linear-gradient(140deg, rgba(39,10,24,0.9), rgba(29,8,18,0.86))",
    idleBorder: "rgba(251,191,153,0.25)",
    correctBg: "linear-gradient(140deg, rgba(194,65,12,0.4), rgba(225,29,72,0.32))",
    correctBorder: "rgba(253,186,116,0.86)",
    pulseGlow: "0 0 40px rgba(251,146,60,0.45)",
  },
  brand: {
    plate: "rgba(42,10,23,0.86)",
    border: "rgba(251,146,60,0.4)",
  },
};

const ICE_THEME: ShortsTheme = {
  name: "Ice Broadcast",
  background: {
    base: "#030A12",
    gradient:
      "linear-gradient(156deg, rgba(3,14,24,0.94) 0%, rgba(8,23,39,0.91) 45%, rgba(7,8,20,0.94) 100%)",
    grid:
      "repeating-linear-gradient(90deg, rgba(96,165,250,0.055) 0 2px, transparent 2px 54px), repeating-linear-gradient(0deg, rgba(167,243,208,0.03) 0 2px, transparent 2px 54px)",
    vignette: "radial-gradient(circle at 48% 40%, transparent 0%, rgba(2,10,18,0.64) 73%, rgba(1,4,10,0.9) 100%)",
    glowA: "rgba(14,165,233,0.42)",
    glowB: "rgba(37,99,235,0.32)",
    glowC: "rgba(16,185,129,0.26)",
  },
  card: {
    fill: "linear-gradient(150deg, rgba(6,23,39,0.88), rgba(4,15,30,0.86))",
    border: "rgba(125,211,252,0.28)",
    borderStrong: "rgba(125,211,252,0.62)",
    shadow: "0 28px 62px rgba(1,7,12,0.66)",
    accentLine: "linear-gradient(90deg, #38BDF8 0%, #60A5FA 42%, #34D399 100%)",
  },
  text: {
    primary: "#E6F8FF",
    secondary: "rgba(200,238,252,0.86)",
    muted: "rgba(200,238,252,0.6)",
    accent: "#7DD3FC",
  },
  timer: {
    safe: "#7DD3FC",
    warning: "#FBBF24",
    danger: "#F43F5E",
    track: "rgba(125,211,252,0.14)",
  },
  answer: {
    idleBg: "linear-gradient(140deg, rgba(8,28,44,0.9), rgba(5,20,35,0.86))",
    idleBorder: "rgba(125,211,252,0.24)",
    correctBg: "linear-gradient(140deg, rgba(8,145,178,0.38), rgba(14,116,144,0.3))",
    correctBorder: "rgba(167,243,208,0.8)",
    pulseGlow: "0 0 40px rgba(125,211,252,0.46)",
  },
  brand: {
    plate: "rgba(5,21,36,0.88)",
    border: "rgba(125,211,252,0.42)",
  },
};

const THEMES: Record<ShortsThemeVariant, ShortsTheme> = {
  dark: DARK_THEME,
  flare: FLARE_THEME,
  ice: ICE_THEME,
};

export const resolveShortsTheme = (variant: ShortsThemeVariant): ShortsTheme => THEMES[variant];
