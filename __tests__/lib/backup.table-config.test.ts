import { BACKUP_TABLES } from "@/lib/backup/table-config";
import fs from "fs";
import path from "path";

describe("BACKUP_TABLES topic coverage", () => {
  it("includes all topic-related models", () => {
    const models = new Set(BACKUP_TABLES.map((table) => table.model));

    expect(models.has("Topic")).toBe(true);
    expect(models.has("TopicRelation")).toBe(true);
    expect(models.has("TopicSourceDocument")).toBe(true);
    expect(models.has("TopicClaim")).toBe(true);
    expect(models.has("TopicContentSnapshot")).toBe(true);
    expect(models.has("TopicIngestionRun")).toBe(true);
  });

  it("includes collection and user discovery/follow models", () => {
    const models = new Set(BACKUP_TABLES.map((table) => table.model));

    expect(models.has("Collection")).toBe(true);
    expect(models.has("CollectionQuiz")).toBe(true);
    expect(models.has("UserCollectionProgress")).toBe(true);
    expect(models.has("UserInterestPreference")).toBe(true);
    expect(models.has("UserFollowedTopic")).toBe(true);
    expect(models.has("UserDiscoveryPreference")).toBe(true);
  });

  it("tracks all product-state Prisma models except explicit operational exclusions", () => {
    const prismaSchemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const prismaSchema = fs.readFileSync(prismaSchemaPath, "utf8");
    const prismaModels = new Set(
      Array.from(prismaSchema.matchAll(/^model\s+(\w+)\s*{/gm)).map((match) => match[1])
    );
    const backupModels = new Set(BACKUP_TABLES.map((table) => table.model));
    const excludedOperationalModels = new Set(["BackupUploadSession"]);

    const missingFromBackup = Array.from(prismaModels)
      .filter((model) => !excludedOperationalModels.has(model))
      .filter((model) => !backupModels.has(model))
      .sort();

    expect(missingFromBackup).toEqual([]);
  });
});
