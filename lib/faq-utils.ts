export type FaqPair = {
  question: string;
  answer: string;
};

function parseHeadingFaq(md: string): FaqPair[] {
  return md
    .split(/\n(?=###\s+)/g)
    .map((section) => {
      const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!lines[0]?.startsWith("### ")) return null;
      const question = lines[0].replace(/^###\s+/, "").trim();
      const answer = lines.slice(1).join(" ").trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is FaqPair => Boolean(item));
}

function parseCompactFaq(md: string): FaqPair[] {
  const lines = md.split("\n").map((line) => line.trim()).filter(Boolean);
  const pairs: FaqPair[] = [];
  let currentQuestion = "";
  let answerParts: string[] = [];
  let seenAnswerStart = false;

  const flushPair = () => {
    const question = currentQuestion.trim();
    const answer = answerParts.join(" ").trim();
    if (question && answer) pairs.push({ question, answer });
    currentQuestion = "";
    answerParts = [];
    seenAnswerStart = false;
  };

  for (const line of lines) {
    const questionMatch = line.match(/^-?\s*Q:\s*(.+)$/i);
    if (questionMatch) {
      flushPair();
      currentQuestion = questionMatch[1].trim();
      continue;
    }

    if (!currentQuestion) continue;

    const answerMatch = line.match(/^-?\s*A:\s*(.+)$/i);
    if (answerMatch) {
      answerParts.push(answerMatch[1].trim());
      seenAnswerStart = true;
      continue;
    }

    if (seenAnswerStart) {
      answerParts.push(line);
    }
  }

  flushPair();
  return pairs;
}

export function parseFaqMarkdown(md: string): FaqPair[] {
  const merged = [...parseHeadingFaq(md), ...parseCompactFaq(md)];
  const deduped = new Map<string, FaqPair>();

  for (const item of merged) {
    const key = item.question.toLowerCase().trim();
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values()).slice(0, 8);
}
