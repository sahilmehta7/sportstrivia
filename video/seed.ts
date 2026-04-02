type SeedInput = {
  seed?: string;
  quizSlug?: string;
  quizId?: string;
  now?: Date;
};

const IST_TIME_ZONE = "Asia/Kolkata";

export const getIstDateString = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const resolveSelectionSeed = (input: SeedInput) => {
  const provided = input.seed?.trim();
  if (provided) return provided;

  const identity = input.quizSlug || input.quizId || "quiz";
  const day = getIstDateString(input.now);
  return `daily:${identity}:${day}`;
};

