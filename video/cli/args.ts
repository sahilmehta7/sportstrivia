import { DEFAULT_FPS } from "../constants";
import type { QuizVideoRenderInput } from "../types";
import type { ShortsThemeVariant } from "../shorts/themes";

type ParsedCliArgs = {
  input: QuizVideoRenderInput;
  outPath?: string;
  help: boolean;
};

const parseIntArg = (value: string | undefined, name: string) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid value for ${name}: "${value}"`);
  }
  return parsed;
};

const parseBooleanArg = (value: string | undefined, name: string) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`Invalid value for ${name}: "${value}". Expected "true" or "false".`);
};

const parseVideoFormatArg = (value: string | undefined) => {
  if (!value) return "landscape" as const;
  const normalized = value.trim().toLowerCase();
  if (normalized === "landscape" || normalized === "shorts") {
    return normalized;
  }
  throw new Error(`Invalid value for videoFormat: "${value}". Expected "landscape" or "shorts".`);
};

const parseThemeVariantArg = (value: string | undefined): ShortsThemeVariant => {
  if (!value) return "dark";
  const normalized = value.trim().toLowerCase();
  if (normalized === "dark" || normalized === "flare" || normalized === "ice") {
    return normalized;
  }
  throw new Error(`Invalid value for themeVariant: "${value}". Expected "dark", "flare", or "ice".`);
};

export const getCliHelpText = () => `
Usage:
  npm run video:render -- --quizSlug=<slug> [--questionLimit=10] [--questionTimeLimitSeconds=12] [--videoFormat=landscape|shorts] [--themeVariant=dark|flare|ice] [--fps=30] [--showAnswerReveal=true] [--seed=my-seed] [--out=./out/video.mp4]
  npm run video:render -- --quizId=<id> [--questionLimit=10] [--questionTimeLimitSeconds=12] [--videoFormat=landscape|shorts] [--themeVariant=dark|flare|ice] [--fps=30] [--showAnswerReveal=true] [--seed=my-seed] [--out=./out/video.mp4]
  npm run video:metadata -- --quizSlug=<slug> [--questionLimit=10] [--questionTimeLimitSeconds=12] [--videoFormat=landscape|shorts] [--themeVariant=dark|flare|ice] [--fps=30] [--showAnswerReveal=true] [--seed=my-seed]
`;

export const parseCliArgs = (argv: string[]): ParsedCliArgs => {
  const map = new Map<string, string>();
  let help = false;

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    if (!arg.includes("=")) {
      throw new Error(`Flag ${arg} requires a value. Use --flag=value format.`);
    }
    const [key, rawValue] = arg.slice(2).split("=", 2);
    if (!rawValue || rawValue.trim().length === 0) {
      throw new Error(`Flag --${key} requires a value.`);
    }
    map.set(key, rawValue);
  }

  const npmArgsFallback: Record<string, string | undefined> = {
    quizSlug: globalThis.process.env.npm_config_quizslug,
    quizId: globalThis.process.env.npm_config_quizid,
    seed: globalThis.process.env.npm_config_seed,
    questionLimit: globalThis.process.env.npm_config_questionlimit,
    questionTimeLimitSeconds: globalThis.process.env.npm_config_questiontimelimitseconds,
    videoFormat: globalThis.process.env.npm_config_videoformat,
    themeVariant: globalThis.process.env.npm_config_themevariant,
    fps: globalThis.process.env.npm_config_fps,
    showAnswerReveal: globalThis.process.env.npm_config_showanswerreveal,
    out: globalThis.process.env.npm_config_out,
  };

  for (const [key, value] of Object.entries(npmArgsFallback)) {
    if (!map.has(key) && value && value.trim().length > 0) {
      map.set(key, value);
    }
  }

  const input: QuizVideoRenderInput = {
    quizId: map.get("quizId"),
    quizSlug: map.get("quizSlug"),
    seed: map.get("seed"),
    questionLimit: parseIntArg(map.get("questionLimit"), "questionLimit"),
    questionTimeLimitSeconds: parseIntArg(map.get("questionTimeLimitSeconds"), "questionTimeLimitSeconds"),
    fps: parseIntArg(map.get("fps"), "fps") ?? DEFAULT_FPS,
    videoFormat: parseVideoFormatArg(map.get("videoFormat")),
    showAnswerReveal: parseBooleanArg(map.get("showAnswerReveal"), "showAnswerReveal") ?? true,
    themeVariant: parseThemeVariantArg(map.get("themeVariant")),
    logoCorner: "top-right",
  };

  if (input.videoFormat === "landscape" && input.themeVariant !== "dark") {
    throw new Error('themeVariant is only supported for shorts. Use --videoFormat=shorts or --themeVariant=dark.');
  }

  return {
    input,
    outPath: map.get("out"),
    help,
  };
};
