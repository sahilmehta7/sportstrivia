import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { loadQuizForVideo } from "../video/load-quiz-for-video";
import { quizVideoRenderInputSchema } from "../video/types";

const usage = `
Generate TTS voiceovers for quiz questions.

Usage:
  npm run video:tts -- --quizSlug=<slug>
  npm run video:tts -- --quizId=<id>

Optional:
  --questionLimit=10
  --seed=my-seed
  --voice=alloy
  --model=gpt-4o-mini-tts
`;

type Args = {
  quizSlug?: string;
  quizId?: string;
  seed?: string;
  questionLimit?: number;
  voice: string;
  model: string;
  help: boolean;
};

const parseIntArg = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number: "${value}"`);
  }
  return parsed;
};

const parseArgs = (argv: string[]): Args => {
  const map = new Map<string, string>();
  let help = false;

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    if (!arg.includes("=")) {
      throw new Error(`Flag ${arg} requires a value. Use --flag=value.`);
    }
    const [key, value] = arg.slice(2).split("=", 2);
    if (!value || value.trim().length === 0) {
      throw new Error(`Flag --${key} requires a value.`);
    }
    map.set(key, value);
  }

  const npmArgsFallback: Record<string, string | undefined> = {
    quizSlug: globalThis.process.env.npm_config_quizslug,
    quizId: globalThis.process.env.npm_config_quizid,
    seed: globalThis.process.env.npm_config_seed,
    questionLimit: globalThis.process.env.npm_config_questionlimit,
    voice: globalThis.process.env.npm_config_voice,
    model: globalThis.process.env.npm_config_model,
  };

  for (const [key, value] of Object.entries(npmArgsFallback)) {
    if (!map.has(key) && value && value.trim().length > 0) {
      map.set(key, value);
    }
  }

  return {
    quizSlug: map.get("quizSlug"),
    quizId: map.get("quizId"),
    seed: map.get("seed"),
    questionLimit: parseIntArg(map.get("questionLimit")),
    voice: map.get("voice") ?? "alloy",
    model: map.get("model") ?? "gpt-4o-mini-tts",
    help,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  loadEnvConfig(globalThis.process.cwd());
  const args = parseArgs(globalThis.process.argv.slice(2));
  if (args.help) {
    console.log(usage);
    return;
  }

  const apiKey = globalThis.process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for TTS generation.");
  }

  const input = quizVideoRenderInputSchema.parse({
    quizSlug: args.quizSlug,
    quizId: args.quizId,
    seed: args.seed,
    questionLimit: args.questionLimit,
    fps: 30,
    themeVariant: "dark",
    logoCorner: "top-right",
  });

  const quizData = await loadQuizForVideo(input);
  const outDir = path.resolve(globalThis.process.cwd(), "public", "video", "voiceovers", quizData.quiz.slug);
  await fs.mkdir(outDir, { recursive: true });

  console.log(`[video:tts] Quiz: ${quizData.quiz.title}`);
  console.log(`[video:tts] Questions: ${quizData.questions.length}`);
  console.log(`[video:tts] Selection seed: ${quizData.selectionSeed}`);
  console.log(`[video:tts] Output dir: ${outDir}`);

  for (const question of quizData.questions) {
    const fileName = `q-${String(question.order + 1).padStart(2, "0")}.mp3`;
    const outputPath = path.join(outDir, fileName);
    const prompt = `Question ${question.order + 1}. ${question.questionText}. Options: ${question.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`)
      .join(", ")}.`;

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: args.model,
        voice: args.voice,
        input: prompt,
        format: "mp3",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`TTS failed for ${question.id}: ${response.status} ${body}`);
    }

    const audioBytes = new Uint8Array(await response.arrayBuffer());
    await fs.writeFile(outputPath, audioBytes);
    console.log(`[video:tts] Wrote ${fileName}`);
    await sleep(120);
  }

  console.log("[video:tts] Done.");
}

main().catch((error) => {
  console.error("[video:tts] Failed:", error);
  console.error(usage);
  globalThis.process.exit(1);
});
