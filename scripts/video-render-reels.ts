import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { REELS_PLAN_APRIL_2026, type ReelsPlanItem } from "./video-reels-plan";

type ScriptArgs = {
  plan: "april-2026";
  outputDir?: string;
  dryRun: boolean;
  limit?: number;
  help: boolean;
};

const usage = `
Batch render Remotion reels from a social plan.

Usage:
  npm run video:reels -- --plan=april-2026 [--outputDir=./out/reels/april-2026] [--dryRun=true] [--limit=3]

Examples:
  npm run video:reels -- --plan=april-2026 --dryRun=true
  npm run video:reels -- --plan=april-2026 --limit=4
  npm run video:reels -- --plan=april-2026 --outputDir=./out/reels/custom
`;

const parseBooleanArg = (value: string | undefined, name: string) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`Invalid value for ${name}: "${value}". Expected "true" or "false".`);
};

const parseIntArg = (value: string | undefined, name: string) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid value for ${name}: "${value}"`);
  }
  return parsed;
};

const sanitize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseArgs = (argv: string[]): ScriptArgs => {
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

  const plan = (map.get("plan") ?? "april-2026") as ScriptArgs["plan"];
  if (plan !== "april-2026") {
    throw new Error(`Unsupported plan: "${plan}".`);
  }

  return {
    plan,
    outputDir: map.get("outputDir"),
    dryRun: parseBooleanArg(map.get("dryRun"), "dryRun") ?? false,
    limit: parseIntArg(map.get("limit"), "limit"),
    help,
  };
};

const getPlanItems = (plan: ScriptArgs["plan"]): ReelsPlanItem[] => {
  if (plan === "april-2026") return REELS_PLAN_APRIL_2026;
  return [];
};

const buildFileName = (item: ReelsPlanItem, index: number) => {
  const serial = String(index + 1).padStart(2, "0");
  return `${item.publishDate}-${serial}-${item.platform}-${sanitize(item.quizSlug)}-${item.themeVariant}.mp4`;
};

const buildQuickArgs = (item: ReelsPlanItem, outputDir: string, index: number) => {
  const fileName = buildFileName(item, index);
  const seed = `reels:${item.publishDate}:${item.platform}:${item.quizSlug}`;
  const args = [
    "run",
    "video:quick",
    "--",
    `--quizSlug=${item.quizSlug}`,
    "--videoFormat=shorts",
    `--themeVariant=${item.themeVariant}`,
    `--questionLimit=${item.questionLimit}`,
    `--questionTimeLimitSeconds=${item.questionTimeLimitSeconds}`,
    `--showAnswerReveal=${item.showAnswerReveal}`,
    `--seed=${seed}`,
    `--outputDir=${outputDir}`,
    `--fileName=${fileName}`,
  ];

  return { args, fileName, seed };
};

const runOne = async (args: string[]) => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npm", args, {
      cwd: globalThis.process.cwd(),
      stdio: "inherit",
      shell: false,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`video:quick exited with code ${code ?? "unknown"}`));
      }
    });
  });
};

const run = async () => {
  const parsed = parseArgs(globalThis.process.argv.slice(2));
  if (parsed.help) {
    console.log(usage);
    globalThis.process.exit(0);
  }

  const allItems = getPlanItems(parsed.plan);
  const items = parsed.limit ? allItems.slice(0, parsed.limit) : allItems;
  const outputDir =
    parsed.outputDir ?? path.resolve(globalThis.process.cwd(), "out", "reels", parsed.plan);
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`[video:reels] Plan: ${parsed.plan}`);
  console.log(`[video:reels] Items: ${items.length}`);
  console.log(`[video:reels] Output dir: ${outputDir}`);
  console.log(`[video:reels] Dry run: ${parsed.dryRun}`);

  for (const [index, item] of items.entries()) {
    const { args, fileName, seed } = buildQuickArgs(item, outputDir, index);
    console.log(
      `[video:reels] ${index + 1}/${items.length} ${item.publishDate} ${item.platform} | ${item.postLabel}`
    );
    console.log(`[video:reels] quiz=${item.quizSlug} theme=${item.themeVariant} seed=${seed}`);
    console.log(`[video:reels] out=${fileName}`);
    if (parsed.dryRun) {
      console.log(`[video:reels] command: npm ${args.join(" ")}`);
      continue;
    }
    await runOne(args);
  }

  console.log("[video:reels] Done.");
};

const isEntrypoint =
  typeof globalThis.process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(globalThis.process.argv[1]).href;

if (isEntrypoint) {
  run().catch((error) => {
    console.error("[video:reels] Failed:", error);
    console.error(usage);
    globalThis.process.exit(1);
  });
}

