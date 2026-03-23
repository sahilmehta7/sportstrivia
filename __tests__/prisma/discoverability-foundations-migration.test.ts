import fs from "node:fs";
import path from "node:path";

describe("discoverability foundations migration", () => {
  it("backfills Topic.alternateNames and makes it non-null", () => {
    const migrationPath = path.join(
      process.cwd(),
      "prisma/migrations/20260322_discoverability_foundations/migration.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain('UPDATE "Topic"');
    expect(sql).toContain('"alternateNames" = ARRAY[]::TEXT[]');
    expect(sql).toContain('ALTER COLUMN "alternateNames" SET DEFAULT ARRAY[]::TEXT[]');
    expect(sql).toContain('ALTER COLUMN "alternateNames" SET NOT NULL');
  });
});
