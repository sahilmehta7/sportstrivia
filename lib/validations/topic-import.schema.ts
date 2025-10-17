import { z } from "zod";

export const topicImportItemSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentName: z.string().optional(), // Reference parent by name
  parentSlug: z.string().optional(), // Or by slug
  imageUrl: z.string().url().optional(),
});

export const topicImportSchema = z.object({
  topics: z.array(topicImportItemSchema).min(1),
  // Options for handling conflicts
  overwriteParents: z.boolean().optional().default(false), // If true, update parent for existing topics
});

export type TopicImportItem = z.infer<typeof topicImportItemSchema>;
export type TopicImportInput = z.infer<typeof topicImportSchema>;

// Result types for conflict detection
export interface TopicImportConflict {
  name: string;
  slug: string;
  existingParent: string | null;
  newParent: string | null;
  action: "skip" | "update_parent" | "create";
}

export interface TopicImportResult {
  created: number;
  skipped: number;
  updated: number;
  conflicts: TopicImportConflict[];
  errors: string[];
}

