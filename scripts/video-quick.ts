import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { calculateVideoMetadata } from "../video/calculate-video-metadata";
import { quizVideoRenderInputSchema, type QuizVideoRenderInput } from "../video/types";

type QuickArgs = {
  input: QuizVideoRenderInput;
  outputDir?: string;
  fileName?: string;
  help: boolean;
};

export const buildQuickRenderArgs = (args: {
  input: QuizVideoRenderInput;
  outputPath: string;
  selectionSeed: string;
}) => {
  const { input, outputPath, selectionSeed } = args;
  const renderArgs = [
    "run",
    "video:render",
    "--",
    `--out=${outputPath}`,
    `--fps=${input.fps}`,
    `--seed=${selectionSeed}`,
  ];

  if (input.quizSlug) renderArgs.push(`--quizSlug=${input.quizSlug}`);
  if (input.quizId) renderArgs.push(`--quizId=${input.quizId}`);
  if (input.questionLimit) renderArgs.push(`--questionLimit=${input.questionLimit}`);
  if (input.questionTimeLimitSeconds) renderArgs.push(`--questionTimeLimitSeconds=${input.questionTimeLimitSeconds}`);
  renderArgs.push(`--videoFormat=${input.videoFormat}`);
  renderArgs.push(`--showAnswerReveal=${input.showAnswerReveal}`);

  return renderArgs;
};

const usage = `
Quick video generator for SportsTrivia quiz videos.

Usage:
  npm run video:quick -- --quizSlug=<slug> [--questionLimit=10] [--questionTimeLimitSeconds=12] [--videoFormat=landscape|shorts] [--fps=30] [--showAnswerReveal=true] [--seed=my-seed]
  npm run video:quick -- --quizId=<id> [--questionLimit=10] [--questionTimeLimitSeconds=12] [--videoFormat=landscape|shorts] [--fps=30] [--showAnswerReveal=true] [--seed=my-seed]

Optional:
  --outputDir=./out/videos
  --fileName=my-custom-video.mp4

Examples:
  npm run video:quick -- --quizSlug=daily-fc-barcelona-quiz
  npm run video:quick -- --quizSlug=daily-fc-barcelona-quiz --questionLimit=8 --questionTimeLimitSeconds=12 --videoFormat=shorts --fps=30 --showAnswerReveal=false --seed=episode-01
  npm run video:quick -- --quizId=cm123abc... --outputDir=./out/youtube
`;

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

const parseArgs = (argv: string[]): QuickArgs => {
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
    fps: globalThis.process.env.npm_config_fps,
    showAnswerReveal: globalThis.process.env.npm_config_showanswerreveal,
    outputDir: globalThis.process.env.npm_config_outputdir,
    fileName: globalThis.process.env.npm_config_filename,
  };

  for (const [key, value] of Object.entries(npmArgsFallback)) {
    if (!map.has(key) && value && value.trim().length > 0) {
      map.set(key, value);
    }
  }

  if (help) {
    return {
      input: {
        quizSlug: "help-placeholder",
        seed: "help-seed",
        fps: 30,
        videoFormat: "landscape",
        questionTimeLimitSeconds: 12,
        showAnswerReveal: true,
        themeVariant: "dark",
        logoCorner: "top-right",
      },
      outputDir: map.get("outputDir"),
      fileName: map.get("fileName"),
      help,
    };
  }

  const input = quizVideoRenderInputSchema.parse({
    quizId: map.get("quizId"),
    quizSlug: map.get("quizSlug"),
    seed: map.get("seed"),
    questionLimit: parseIntArg(map.get("questionLimit"), "questionLimit"),
    questionTimeLimitSeconds: parseIntArg(map.get("questionTimeLimitSeconds"), "questionTimeLimitSeconds"),
    videoFormat: (map.get("videoFormat") as "landscape" | "shorts" | undefined) ?? "landscape",
    fps: parseIntArg(map.get("fps"), "fps"),
    showAnswerReveal: parseBooleanArg(map.get("showAnswerReveal"), "showAnswerReveal"),
    themeVariant: "dark",
    logoCorner: "top-right",
  });

  return {
    input,
    outputDir: map.get("outputDir"),
    fileName: map.get("fileName"),
    help,
  };
};

const sanitize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatTimestamp = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}-${hh}${mm}`;
};

const run = async () => {
  const parsed = parseArgs(globalThis.process.argv.slice(2));
  if (parsed.help) {
    console.log(usage);
    globalThis.process.exit(0);
  }

  const metadata = await calculateVideoMetadata(parsed.input);
  const now = new Date();
  const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const baseOutputDir = parsed.outputDir
    ? path.resolve(parsed.outputDir)
    : path.resolve(globalThis.process.cwd(), "out", "videos", dateFolder);

  await fs.mkdir(baseOutputDir, { recursive: true });

  const defaultBaseName = `${sanitize(metadata.props.quiz.slug || metadata.props.quiz.title)}-${formatTimestamp(now)}.mp4`;
  const fileName = parsed.fileName ?? defaultBaseName;
  const outputPath = path.resolve(baseOutputDir, fileName);

  const renderArgs = buildQuickRenderArgs({
    input: parsed.input,
    outputPath,
    selectionSeed: metadata.selectionSeed,
  });

  const seconds = (metadata.durationInFrames / metadata.props.fps).toFixed(2);
  console.log(`[video:quick] Quiz: ${metadata.props.quiz.title}`);
  console.log(`[video:quick] Questions: ${metadata.props.questions.length}`);
  console.log(`[video:quick] Selection seed: ${metadata.selectionSeed}`);
  console.log(`[video:quick] Estimated duration: ${seconds}s`);
  console.log(`[video:quick] Output: ${outputPath}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn("npm", renderArgs, {
      cwd: globalThis.process.cwd(),
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`video:render exited with code ${code ?? "unknown"}`));
      }
    });
  });

  console.log(`[video:quick] Saved: ${outputPath}`);
};

const isEntrypoint =
  typeof globalThis.process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(globalThis.process.argv[1]).href;

if (isEntrypoint) {
  run().catch((error) => {
    console.error("[video:quick] Failed:", error);
    console.error(usage);
    globalThis.process.exit(1);
  });
}
