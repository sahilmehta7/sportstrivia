#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components"];
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const EXCLUDED_PATH_SEGMENTS = new Set([
  "node_modules",
  ".next",
  "dist",
  "out",
  ".git",
]);

const ALLOWED_TOKENS = new Set(["rounded-none", "rounded-full"]);
const TOKEN_PATTERN = /\brounded(?:-[\w[\]/.%:-]+)?\b/g;
const strictMode = process.argv.includes("--strict");
const TARGET_ROUTE_PREFIXES = [
  "app/page.tsx",
  "app/quizzes/",
  "app/topics/",
  "app/search/",
  "app/daily/",
  "app/leaderboard/",
  "app/notifications/",
  "app/friends/",
];

function shouldSkipFile(filePath) {
  if (
    filePath.includes(`${path.sep}app${path.sep}admin${path.sep}`) ||
    filePath.includes(`${path.sep}components${path.sep}admin${path.sep}`) ||
    filePath.includes(`${path.sep}__tests__${path.sep}`)
  ) {
    return true;
  }
  return false;
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if ([...EXCLUDED_PATH_SEGMENTS].some((segment) => fullPath.includes(`${path.sep}${segment}${path.sep}`))) {
      continue;
    }
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!FILE_EXTENSIONS.has(ext)) continue;
    if (shouldSkipFile(fullPath)) continue;
    files.push(fullPath);
  }
  return files;
}

function auditFile(filePath) {
  const originalContent = fs.readFileSync(filePath, "utf8");
  const content = originalContent
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
  const lines = originalContent.split(/\r?\n/);
  const violations = [];
  const classSegments = [];

  const pushMatchesFromSegment = (segment, indexOffset = 0) => {
    if (!segment) return;
    const matches = segment.match(TOKEN_PATTERN);
    if (!matches) return;
    matches.forEach((token) => {
      if (ALLOWED_TOKENS.has(token)) return;
      const segmentStart = content.indexOf(segment);
      const beforeSegment = content.slice(0, Math.max(0, segmentStart));
      const line = beforeSegment.split(/\r?\n/).length + indexOffset;
      violations.push({
        file: path.relative(ROOT, filePath),
        line,
        token,
        content: lines[Math.max(0, line - 1)]?.trim() ?? "",
      });
    });
  };

  const plainClassPattern = /class(Name)?\s*=\s*["'`]([^"'`]+)["'`]/g;
  for (const match of content.matchAll(plainClassPattern)) {
    classSegments.push(match[2]);
  }

  const templateClassPattern = /class(Name)?\s*=\s*\{`([^`]+)`\}/g;
  for (const match of content.matchAll(templateClassPattern)) {
    classSegments.push(match[2]);
  }

  const cnPattern = /class(Name)?\s*=\s*\{cn\(([\s\S]*?)\)\}/g;
  for (const match of content.matchAll(cnPattern)) {
    const args = match[2];
    for (const str of args.matchAll(/["'`]([^"'`]+)["'`]/g)) {
      classSegments.push(str[1]);
    }
  }

  classSegments.forEach((segment) => pushMatchesFromSegment(segment));

  // Backstop: catch likely class-like utility strings not inside explicit className attributes.
  for (const tokenMatch of content.matchAll(TOKEN_PATTERN)) {
    const token = tokenMatch[0];
    if (ALLOWED_TOKENS.has(token)) continue;
    const idx = tokenMatch.index ?? 0;
    const contextStart = Math.max(0, idx - 120);
    const context = content.slice(contextStart, idx + 120);
    if (!/class(Name)?|cva\(|variants?\s*=|cn\(/.test(context)) continue;
    const line = content.slice(0, idx).split(/\r?\n/).length;
    const key = `${path.relative(ROOT, filePath)}:${line}:${token}`;
    if (violations.some((item) => `${item.file}:${item.line}:${item.token}` === key)) continue;
    violations.push({
      file: path.relative(ROOT, filePath),
      line,
      token,
      content: lines[Math.max(0, line - 1)]?.trim() ?? "",
    });
  }

  return violations;
}

const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const violations = files.flatMap(auditFile);

if (violations.length === 0) {
  console.log("square-edge audit: no disallowed rounded classes found");
  process.exit(0);
}

console.log(`square-edge audit: found ${violations.length} disallowed rounded class token(s)\n`);

const routeSummary = TARGET_ROUTE_PREFIXES.map((prefix) => {
  const count = violations.filter((violation) => violation.file.startsWith(prefix)).length;
  return { prefix, count };
}).filter((item) => item.count > 0);

if (routeSummary.length > 0) {
  console.log("target-route summary:");
  routeSummary.forEach((item) => {
    console.log(`- ${item.prefix}: ${item.count}`);
  });
  const totalTargetFindings = routeSummary.reduce((acc, item) => acc + item.count, 0);
  console.log(`target-route total: ${totalTargetFindings}\n`);
}

for (const violation of violations.slice(0, 200)) {
  console.log(`${violation.file}:${violation.line}  ${violation.token}`);
}

if (violations.length > 200) {
  console.log(`...and ${violations.length - 200} more`);
}

if (strictMode) {
  process.exit(1);
}

console.log("\nrun with --strict to fail on violations (strict mode is currently disabled by default)");
process.exit(0);
