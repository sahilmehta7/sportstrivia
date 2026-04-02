import type { ShortsThemeVariant } from "../shorts/themes";

export type LandscapeTheme = {
  name: string;
  background: {
    base: string;
    vignette: string;
    gradientA: string;
    gradientB: string;
    glow: string;
    line: string;
  };
  surfaces: {
    panel: string;
    panelBorder: string;
    softPanel: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    reveal: string;
    warning: string;
  };
  timer: {
    track: string;
    fill: string;
    urgent: string;
  };
};

const BASE_THEME_BY_VARIANT: Record<ShortsThemeVariant, LandscapeTheme> = {
  dark: {
    name: "Prime Night",
    background: {
      base: "#071124",
      vignette: "rgba(1, 4, 12, 0.72)",
      gradientA: "#12284A",
      gradientB: "#091A33",
      glow: "rgba(44, 214, 255, 0.30)",
      line: "rgba(150, 201, 255, 0.16)",
    },
    surfaces: {
      panel: "rgba(8, 19, 36, 0.86)",
      panelBorder: "rgba(119, 171, 223, 0.28)",
      softPanel: "rgba(17, 36, 62, 0.62)",
      overlay: "rgba(5, 10, 20, 0.86)",
    },
    text: {
      primary: "#EAF4FF",
      secondary: "rgba(226, 238, 255, 0.84)",
      muted: "rgba(190, 211, 234, 0.72)",
      accent: "#3ED2FF",
      reveal: "#7DFFB2",
      warning: "#FF6D7E",
    },
    timer: {
      track: "rgba(127, 168, 214, 0.3)",
      fill: "#40D6FF",
      urgent: "#FF647A",
    },
  },
  flare: {
    name: "Stadium Energy",
    background: {
      base: "#190B12",
      vignette: "rgba(10, 3, 6, 0.72)",
      gradientA: "#472032",
      gradientB: "#221122",
      glow: "rgba(255, 164, 73, 0.32)",
      line: "rgba(255, 197, 122, 0.18)",
    },
    surfaces: {
      panel: "rgba(34, 14, 25, 0.86)",
      panelBorder: "rgba(255, 178, 112, 0.3)",
      softPanel: "rgba(61, 26, 40, 0.62)",
      overlay: "rgba(20, 8, 14, 0.86)",
    },
    text: {
      primary: "#FFF1E6",
      secondary: "rgba(255, 232, 214, 0.86)",
      muted: "rgba(255, 212, 186, 0.72)",
      accent: "#FFB05B",
      reveal: "#FFE27A",
      warning: "#FF6D6D",
    },
    timer: {
      track: "rgba(255, 188, 132, 0.26)",
      fill: "#FFAF5E",
      urgent: "#FF7070",
    },
  },
  ice: {
    name: "Championship Steel",
    background: {
      base: "#08141B",
      vignette: "rgba(4, 8, 12, 0.76)",
      gradientA: "#1C2F3F",
      gradientB: "#12202C",
      glow: "rgba(118, 215, 255, 0.3)",
      line: "rgba(190, 233, 255, 0.18)",
    },
    surfaces: {
      panel: "rgba(10, 24, 34, 0.84)",
      panelBorder: "rgba(166, 222, 255, 0.3)",
      softPanel: "rgba(22, 44, 62, 0.6)",
      overlay: "rgba(6, 14, 20, 0.86)",
    },
    text: {
      primary: "#EAF8FF",
      secondary: "rgba(223, 242, 255, 0.86)",
      muted: "rgba(181, 214, 233, 0.72)",
      accent: "#84D5FF",
      reveal: "#93FFDE",
      warning: "#FF7C9A",
    },
    timer: {
      track: "rgba(161, 207, 232, 0.3)",
      fill: "#8BD8FF",
      urgent: "#FF7893",
    },
  },
};

const lower = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const getSportAccent = (sport: string | null | undefined) => {
  const label = lower(sport);
  if (label.includes("football") || label.includes("soccer")) {
    return { accent: "#75FF8D", reveal: "#C0FFD1" };
  }
  if (label.includes("basket")) {
    return { accent: "#FFB15D", reveal: "#FFE18D" };
  }
  if (label.includes("cricket")) {
    return { accent: "#7FE7FF", reveal: "#B5F4FF" };
  }
  if (label.includes("tennis")) {
    return { accent: "#D4FF66", reveal: "#E7FFC2" };
  }
  if (label.includes("formula") || label.includes("racing") || label.includes("f1")) {
    return { accent: "#FF6D6D", reveal: "#FFC0C0" };
  }
  if (label.includes("hockey")) {
    return { accent: "#95D8FF", reveal: "#C8EAFF" };
  }
  return { accent: "", reveal: "" };
};

export const getLandscapeTheme = (
  variant: ShortsThemeVariant,
  sport: string | null | undefined
): LandscapeTheme => {
  const base = BASE_THEME_BY_VARIANT[variant];
  const sportAccent = getSportAccent(sport);

  if (!sportAccent.accent) {
    return base;
  }

  return {
    ...base,
    text: {
      ...base.text,
      accent: sportAccent.accent,
      reveal: sportAccent.reveal,
    },
    timer: {
      ...base.timer,
      fill: sportAccent.accent,
    },
  };
};

export const landscapeHeadlineFont = "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif";
export const landscapeBodyFont = "'Inter', 'Segoe UI', sans-serif";
