import { z } from "zod";

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");
const cluesSchema = z.record(z.unknown());

const wordleWordSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, "Word cannot be empty")
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z]+$/.test(value), "Word must contain only letters A-Z (no spaces or punctuation)")
  .refine((value) => value.length >= 3 && value.length <= 12, "Word must be 3-12 letters");

const dailyWordleImportItemSchema = z.object({
  word: wordleWordSchema,
  clues: cluesSchema.optional(),
});

export const dailyWordleImportSchema = z
  .object({
    startDate: dateStringSchema,
    words: z.array(wordleWordSchema).min(1).max(400).optional(),
    items: z.array(dailyWordleImportItemSchema).min(1).max(400).optional(),
    overwriteExisting: z.boolean().optional().default(false),
    allowOverwriteWithAttempts: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.words && data.items) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either words or items, not both",
        path: ["items"],
      });
      return;
    }

    if (!data.words && !data.items) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either words or items is required",
        path: ["words"],
      });
      return;
    }

    const values = data.items ? data.items.map((item) => item.word) : (data.words ?? []);

    const seen = new Set<string>();
    for (let i = 0; i < values.length; i++) {
      const word = values[i];
      if (seen.has(word)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate word "${word}" in import list`,
          path: data.items ? ["items", i, "word"] : ["words", i],
        });
      }
      seen.add(word);
    }
  });

export type DailyWordleImportInput = z.infer<typeof dailyWordleImportSchema>;
