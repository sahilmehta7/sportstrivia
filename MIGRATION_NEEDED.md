# ⚠️ Database Migration Required

## New Features Requiring Migration

The following features have been added that require a database schema update:

### 1. Admin Settings (AppSettings table)

A new `AppSettings` model has been added to store configurable settings like the AI quiz generator prompt.

---

## 🔧 How to Apply Migration

When your database is accessible, run ONE of the following commands:

### Option 1: Quick Push (Recommended for Development)

```bash
npx prisma db push
```

This will:
- Update your database schema immediately
- Not create migration files
- Best for rapid development

### Option 2: Create Migration (Recommended for Production)

```bash
npx prisma migrate dev --name add_app_settings
```

This will:
- Create a migration file
- Apply the migration
- Update migration history
- Better for version control

---

## 📋 What Gets Created

### AppSettings Table

```sql
CREATE TABLE "AppSettings" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "category" TEXT DEFAULT 'general' NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  
  CONSTRAINT "AppSettings_key_key" UNIQUE ("key")
);

CREATE INDEX "AppSettings_category_idx" ON "AppSettings"("category");
```

---

## ✅ Verification

After running the migration, verify it worked:

```bash
# Check if table exists
npx prisma studio
```

Then navigate to AppSettings table in Prisma Studio.

---

## 🎯 Features That Depend on This

### Admin Settings Page
- **Route:** `/admin/settings`
- **Status:** ⚠️ Works with fallback (uses default prompt)
- **After Migration:** ✅ Can save custom prompts to database

### AI Quiz Generator  
- **Route:** `/admin/ai-quiz`
- **Status:** ✅ Works (uses default prompt)
- **After Migration:** ✅ Uses custom prompt from settings

---

## 💡 Note

**The app will work without this migration!**

- Settings service has fallback to default values
- No errors or crashes
- Just can't save custom settings to database
- After migration, full persistence enabled

---

## 🚀 Quick Command

```bash
npx prisma db push
```

That's it! Run this when your database is ready.

