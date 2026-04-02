#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db";
import * as XLSX from "xlsx";

type CliOptions = {
  minLength: number;
  baseUrl: string;
  output: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    minLength: 140,
    baseUrl: "http://localhost:3200",
    output: "tmp/long-questions.xlsx",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--min-length") {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value < 1) {
        throw new Error("--min-length must be a positive number");
      }
      options.minLength = Math.floor(value);
      i += 1;
      continue;
    }

    if (arg === "--base-url") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--base-url requires a value");
      }
      options.baseUrl = value.replace(/\/$/, "");
      i += 1;
      continue;
    }

    if (arg === "--output") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--output requires a value");
      }
      options.output = value;
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(`
Export long questions to an Excel file.

Usage:
  tsx scripts/export-long-questions.ts [options]

Options:
  --min-length <number>  Minimum question length (default: 140)
  --base-url <url>       Localhost base URL for edit links (default: http://localhost:3200)
  --output <path>        Output .xlsx file path (default: tmp/long-questions.xlsx)
`);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const questions = await prisma.question.findMany({
    select: {
      id: true,
      questionText: true,
      difficulty: true,
      topicId: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const rows = questions
    .map((question) => {
      const text = question.questionText ?? "";
      const textLength = text.length;

      return {
        questionId: question.id,
        questionText: text,
        textLength,
        difficulty: question.difficulty,
        topicId: question.topicId,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
        editLink: `${options.baseUrl}/admin/questions/${question.id}/edit`,
      };
    })
    .filter((row) => row.textLength >= options.minLength)
    .sort((a, b) => b.textLength - a.textLength);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Long Questions");

  const outputPath = path.resolve(options.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  XLSX.writeFile(workbook, outputPath);

  console.log(`Exported ${rows.length} long questions to ${outputPath}`);
  console.log(`Threshold: questionText length >= ${options.minLength}`);
}

main()
  .catch((error) => {
    console.error("Failed to export long questions:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
