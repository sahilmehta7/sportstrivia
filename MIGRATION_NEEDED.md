# ⚠️ Database Migration Needed

## Schema Drift Detected

Your Prisma schema has fields that don't exist in the database yet:
- `Quiz.maxAttemptsPerUser` (Int?)
- `Quiz.attemptResetPeriod` (enum AttemptResetPeriod)

## To Fix

### Option 1: Use Direct URL (Recommended)

The CLI can't connect through the pooler. Use the direct database URL:

1. Get your direct connection URL from Supabase (not the pooled one)
2. Temporarily update `.env`:
   ```env
   # Comment out pooled URL
   # DATABASE_URL="postgresql://...pooler.supabase.com..."
   
   # Use direct URL for migration
   DATABASE_URL="postgresql://...db.supabase.com..."
   ```

3. Run migration:
   ```bash
   npx prisma db push
   ```

4. Restore pooled URL for production use

### Option 2: Using DIRECT_URL

Add to `.env`:
```env
DIRECT_URL="postgresql://...db.supabase.com..."  # Direct connection
DATABASE_URL="postgresql://...pooler.supabase.com..."  # Pooled for app
```

Then run:
```bash
npx prisma db push
```

### Option 3: Remove Unused Fields

If you're not using these fields yet, you can comment them out in `prisma/schema.prisma`:

```prisma
// maxAttemptsPerUser Int?
// attemptResetPeriod AttemptResetPeriod @default(NEVER)
```

Then regenerate Prisma client:
```bash
npx prisma generate
```

## Current Workaround

I've updated the AI cover route to use explicit `select` instead of `include` to avoid pulling non-existent fields. The feature will work, but you should still run the migration when possible.

## Why This Happened

The schema was updated with new fields but the migration wasn't run. This is common during development when:
- Making rapid schema changes
- Working with multiple databases
- Using connection poolers vs direct connections

## Impact

- ✅ App still works (workaround applied)
- ⚠️ New fields not usable yet
- ⚠️ Schema and database out of sync
- ❌ Some Prisma queries may fail if they reference these fields

## After Migration

Once migration completes successfully:
1. New fields will be available
2. All queries will work
3. Schema drift resolved
4. Can implement attempt limits feature
