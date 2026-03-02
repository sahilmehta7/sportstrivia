import { BACKUP_TABLES } from "@/lib/backup/table-config";

describe("BACKUP_TABLES topic coverage", () => {
  it("includes all topic-related models", () => {
    const models = new Set(BACKUP_TABLES.map((table) => table.model));

    expect(models.has("Topic")).toBe(true);
    expect(models.has("TopicSourceDocument")).toBe(true);
    expect(models.has("TopicClaim")).toBe(true);
    expect(models.has("TopicContentSnapshot")).toBe(true);
    expect(models.has("TopicIngestionRun")).toBe(true);
  });
});
