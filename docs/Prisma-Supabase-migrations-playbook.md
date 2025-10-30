## Prisma + Supabase Migration Playbook (Data-Safe, No Shadow DB)

Purpose: Preserve data while keeping Prisma migrations and your Supabase schema in sync. Avoid PgBouncer pitfalls and shadow DB requirements.

### Environment Variables
- DATABASE_URL = Supabase Pooler (PgBouncer)
- DIRECT_URL = Supabase Direct (no PgBouncer)

Prisma will use DIRECT_URL automatically for migrations. Always run migrations with DIRECT_URL available.

### One-Time Setup
```bash
npm i --save-dev prisma@latest
npm i @prisma/client@latest
npx prisma format
npx prisma generate
```

Keep your Prisma CLI and client versions aligned.

### Data-Preserving Drift Fix (No Shadow DB)
When Prisma reports drift but you must keep data:

```bash
# 1) Create a migration that transforms the live DB to match prisma/schema.prisma
ts=$(date +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${ts}_drift_fix
npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/${ts}_drift_fix/migration.sql

# 2) Review the SQL (look for unintended drops). Adjust if needed.

# 3) Apply all pending migrations to Supabase (uses DIRECT_URL)
npx prisma migrate deploy

# 4) Verify
npx prisma migrate status
```

If deploy complains about a previously failed or already-applied migration:
```bash
# Replace FOLDER with the migration folder shown by Prisma
npx prisma migrate resolve --applied FOLDER
npx prisma migrate deploy
```

### Repeatable Day-to-Day Workflow
1) Edit `prisma/schema.prisma`.
2) Generate a migration from live DB → desired schema (no shadow DB):
```bash
ts=$(date +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${ts}_change
npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/${ts}_change/migration.sql
```
3) Inspect the SQL (renames, enums, types). Adjust if needed.
4) Apply: `npx prisma migrate deploy`.
5) Commit the new `prisma/migrations/${ts}_change` folder.

Use `prisma migrate dev` only with a local Postgres where you control CREATE DATABASE. On Supabase, prefer `migrate diff` + `migrate deploy`.

### Tips to Avoid Breakage
- Always run migrations with DIRECT_URL (never the pooler alone).
- Avoid `prisma db push` against Supabase; rely on migration files + `migrate deploy`.
- Don’t change schema via Supabase SQL editor. If you must, mirror the change by generating a diff migration immediately after.
- Enums: prefer additive `ALTER TYPE ... ADD VALUE`. For breaking enum changes, create a new type, cast, swap.
- Renames/types: adjust SQL to use `ALTER TABLE ... RENAME ...` and `USING` casts; avoid drop/recreate when preserving data.
- Keep `prisma` and `@prisma/client` versions in lockstep; run `npx prisma format` before `npx prisma generate`.

### Troubleshooting (Map error → fix)
- Prepared statement/timeout/cannot run inside a transaction: migration using pooler → ensure DIRECT_URL is set and used.
- Drift detected with demand to reset: generate a drift-fix migration via `migrate diff` (see above), then `migrate deploy`.
- Permission/shadow DB errors: avoid shadow DB completely by using the diff flow here.
- Enum/rename failures: hand-tune the generated SQL for additive enum changes and safe renames/casts.

### Quick Commands Reference
```bash
# Generate Prisma client
npx prisma generate

# Create drift-fix migration (live DB → schema)
ts=$(date +%Y%m%d%H%M%S); mkdir -p prisma/migrations/${ts}_drift_fix; \
npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/${ts}_drift_fix/migration.sql

# Apply pending migrations
npx prisma migrate deploy

# Mark a migration as applied (if needed), then re-deploy
npx prisma migrate resolve --applied FOLDER && npx prisma migrate deploy
```


