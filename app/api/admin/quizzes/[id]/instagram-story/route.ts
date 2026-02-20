import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError } from "@/lib/errors";

// Uses `sharp` + Prisma, so force Node.js runtime
export const runtime = "nodejs";

type StoryQuestion = {
  id: string;
  questionText: string;
  answers: { answerText: string; displayOrder: number }[];
};

function escapeXml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapTextToLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const words = normalized.split(" ");
  const lines: string[] = [];

  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length > maxLines) lines.length = maxLines;

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1] ?? "";
    lines[maxLines - 1] = last.length > 1 ? `${last.slice(0, Math.max(1, last.length - 1))}…` : "…";
  }

  return lines;
}

function pickQuestions(options: {
  pool: StoryQuestion[];
  count: 1 | 2;
  questionIds?: string[];
  seed?: number;
}): StoryQuestion[] {
  const { pool, count, questionIds, seed } = options;
  if (pool.length === 0) return [];

  if (questionIds?.length) {
    const set = new Set(questionIds);
    return pool.filter((q) => set.has(q.id)).slice(0, count);
  }

  const rng = (() => {
    if (typeof seed !== "number" || Number.isNaN(seed)) return Math.random;
    let state = seed >>> 0;
    return () => {
      // xorshift32
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  })();

  const copy = [...pool];
  // Fisher–Yates shuffle (partial)
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

function renderQuestionBlockSvg(args: {
  x: number;
  y: number;
  width: number;
  questionIndexLabel: string;
  questionText: string;
  answers: string[];
}): string {
  const { x, y, width, questionIndexLabel, questionText, answers } = args;

  const questionFontSize = 52;
  const questionLineHeight = 64;
  const answerFontSize = 36;
  const answerLineHeight = 46;

  const questionLines = wrapTextToLines(questionText, 34, 4);
  const answerLinesByOption = answers.slice(0, 4).map((a) => wrapTextToLines(a, 44, 2));

  let cursorY = y;
  const blocks: string[] = [];

  blocks.push(
    `<text x="${x}" y="${cursorY}" fill="rgba(255,255,255,0.7)" font-size="22" font-weight="700" letter-spacing="4">${escapeXml(
      questionIndexLabel
    )}</text>`
  );
  cursorY += 40;

  for (const line of questionLines) {
    blocks.push(
      `<text x="${x}" y="${cursorY}" fill="#ffffff" font-size="${questionFontSize}" font-weight="900">${escapeXml(
        line
      )}</text>`
    );
    cursorY += questionLineHeight;
  }

  cursorY += 18;

  const optionLabels = ["A", "B", "C", "D"];
  for (let idx = 0; idx < answerLinesByOption.length; idx++) {
    const optionLines = answerLinesByOption[idx] ?? [];
    const optionX = x;
    const label = optionLabels[idx] ?? String(idx + 1);
    const pillWidth = 56;
    const pillHeight = 40;
    const pillY = cursorY - 30;

    blocks.push(
      `<rect x="${optionX}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="20" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.18)"/>` +
      `<text x="${optionX + pillWidth / 2}" y="${cursorY - 2}" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="900">${escapeXml(
        label
      )}</text>`
    );

    let answerCursorY = cursorY;
    const textX = optionX + pillWidth + 18;
    for (const line of optionLines) {
      blocks.push(
        `<text x="${textX}" y="${answerCursorY}" fill="rgba(255,255,255,0.9)" font-size="${answerFontSize}" font-weight="800">${escapeXml(
          line
        )}</text>`
      );
      answerCursorY += answerLineHeight;
    }

    cursorY = answerCursorY + 16;
  }

  // guardrail: prevent overflow by clipping within the available width
  return `<g clip-path="url(#clip-${x}-${y})"><defs><clipPath id="clip-${x}-${y}"><rect x="${x}" y="${y -
    40}" width="${width}" height="760" rx="28"/></clipPath></defs>${blocks.join("")}</g>`;
}

function buildStorySvg(args: {
  quizTitle: string;
  quizUrl: string;
  questions: StoryQuestion[];
}): string {
  const { quizTitle, quizUrl, questions } = args;

  const width = 1080;
  const height = 1920;
  const paddingX = 90;

  const headerLabel = "INSTAGRAM STORY TEASER";
  const titleLines = wrapTextToLines(quizTitle, 28, 2);

  const storyCount = questions.length;
  const blocks: string[] = [];

  // Background + frame
  blocks.push(`
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#070A12"/>
        <stop offset="45%" stop-color="#0B1230"/>
        <stop offset="100%" stop-color="#140A2E"/>
      </linearGradient>
      <radialGradient id="glow" cx="35%" cy="20%" r="75%">
        <stop offset="0%" stop-color="rgba(232,181,20,0.35)"/>
        <stop offset="60%" stop-color="rgba(232,181,20,0.0)"/>
      </radialGradient>
      <radialGradient id="glow2" cx="75%" cy="65%" r="80%">
        <stop offset="0%" stop-color="rgba(124,58,237,0.28)"/>
        <stop offset="60%" stop-color="rgba(124,58,237,0.0)"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <rect width="100%" height="100%" fill="url(#glow2)"/>
  `);

  // Header
  blocks.push(
    `<text x="${paddingX}" y="130" fill="rgba(255,255,255,0.65)" font-size="22" font-weight="800" letter-spacing="6">${escapeXml(
      headerLabel
    )}</text>`
  );

  const titleStartY = 200;
  let cursorY = titleStartY;
  for (const line of titleLines) {
    blocks.push(
      `<text x="${paddingX}" y="${cursorY}" fill="#ffffff" font-size="64" font-weight="1000">${escapeXml(
        line
      )}</text>`
    );
    cursorY += 78;
  }

  blocks.push(
    `<text x="${paddingX}" y="${cursorY + 10}" fill="rgba(255,255,255,0.75)" font-size="28" font-weight="800">Answer the question${storyCount === 2 ? "s" : ""} — then play the full quiz</text>`
  );

  // Question blocks
  const questionStartY = 520;
  if (questions.length === 1) {
    const q = questions[0]!;
    const answers = [...q.answers].sort((a, b) => a.displayOrder - b.displayOrder).map((a) => a.answerText);
    blocks.push(
      renderQuestionBlockSvg({
        x: paddingX,
        y: questionStartY,
        width: width - paddingX * 2,
        questionIndexLabel: "QUESTION 1",
        questionText: q.questionText,
        answers,
      })
    );
  } else {
    const top = questions[0];
    const bottom = questions[1];
    if (top) {
      const answers = [...top.answers].sort((a, b) => a.displayOrder - b.displayOrder).map((a) => a.answerText);
      blocks.push(
        renderQuestionBlockSvg({
          x: paddingX,
          y: questionStartY,
          width: width - paddingX * 2,
          questionIndexLabel: "QUESTION 1",
          questionText: top.questionText,
          answers,
        })
      );
    }
    if (bottom) {
      const answers = [...bottom.answers].sort((a, b) => a.displayOrder - b.displayOrder).map((a) => a.answerText);
      blocks.push(
        renderQuestionBlockSvg({
          x: paddingX,
          y: 1130,
          width: width - paddingX * 2,
          questionIndexLabel: "QUESTION 2",
          questionText: bottom.questionText,
          answers,
        })
      );
    }
  }

  // Footer CTA (URL)
  const footerY = 1830;
  const cta = "Play now:";
  blocks.push(
    `<rect x="${paddingX}" y="${footerY - 60}" width="${width - paddingX * 2}" height="120" rx="34" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>` +
    `<text x="${paddingX + 28}" y="${footerY - 10}" fill="rgba(255,255,255,0.9)" font-size="28" font-weight="900">${escapeXml(
      cta
    )}</text>` +
    `<text x="${paddingX + 28}" y="${footerY + 32}" fill="#E8B514" font-size="34" font-weight="1000">${escapeXml(
      quizUrl
    )}</text>`
  );

  // Small brand tag
  blocks.push(
    `<text x="${width - paddingX}" y="${130}" text-anchor="end" fill="rgba(255,255,255,0.55)" font-size="22" font-weight="900">SPORTS TRIVIA</text>`
  );

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
      </style>
      ${blocks.join("")}
    </svg>
  `;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const url = new URL(request.url);
    // ... rest of parameters setup ...
    const countRaw = url.searchParams.get("count") ?? "1";
    const count = countRaw === "2" ? 2 : 1;

    const seedRaw = url.searchParams.get("seed");
    const seed = seedRaw != null ? Number.parseInt(seedRaw, 10) : undefined;

    const questionIdsRaw = url.searchParams.get("questionIds");
    const questionIds = questionIdsRaw
      ? questionIdsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 2)
      : undefined;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        title: true,
        slug: true,
        questionPool: {
          select: {
            question: {
              select: {
                id: true,
                questionText: true,
                answers: {
                  select: { answerText: true, displayOrder: true },
                  orderBy: { displayOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const pool: StoryQuestion[] = quiz.questionPool
      .map((p) => p.question)
      .filter(Boolean)
      .map((q) => ({
        id: q.id,
        questionText: q.questionText,
        answers: q.answers,
      }));

    const questions = pickQuestions({
      pool,
      count: count as 1 | 2,
      questionIds,
      seed,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const quizUrl = baseUrl ? `${baseUrl}/quizzes/${quiz.slug}` : `/quizzes/${quiz.slug}`;

    const svg = buildStorySvg({
      quizTitle: quiz.title,
      quizUrl,
      questions,
    });

    const png = await sharp(Buffer.from(svg)).png({ quality: 95 }).toBuffer();

    return new NextResponse(png as any, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
