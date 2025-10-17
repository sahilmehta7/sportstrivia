# Admin Settings Feature - Complete Guide

## ✅ Admin Settings Page Complete!

Customize your application settings including the AI Quiz Generator prompt template.

---

## 🎯 Features

### Editable AI Quiz Prompt
- ✅ View current prompt template
- ✅ Edit with live character count
- ✅ Save custom prompt
- ✅ Reset to default anytime
- ✅ Unsaved changes indicator
- ✅ Placeholder documentation

### Settings Management
- ✅ Database-backed storage
- ✅ Per-user update tracking
- ✅ Category organization
- ✅ Default value fallbacks

---

## 📋 Setup Required

### Run Database Migration

When your database is available, run:

```bash
npx prisma db push
```

Or create a proper migration:

```bash
npx prisma migrate dev --name add_app_settings
```

This will create the `AppSettings` table:

```sql
CREATE TABLE "AppSettings" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "category" TEXT DEFAULT 'general',
  "updatedAt" TIMESTAMP NOT NULL,
  "updatedBy" TEXT
);

CREATE INDEX "AppSettings_category_idx" ON "AppSettings"("category");
```

---

## 🎯 How to Use

### Access Settings

Navigate to: **Admin → Settings** (`/admin/settings`)

### Edit AI Quiz Prompt

#### View Current Prompt

The settings page loads your current AI quiz generator prompt template with all the placeholders.

#### Available Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{TOPIC}}` | Topic name | "Shane Warne" |
| `{{TOPIC_LOWER}}` | Lowercase topic | "shane warne" |
| `{{SLUGIFIED_TOPIC}}` | URL-friendly slug | "shane-warne" |
| `{{SPORT}}` | Sport category | "Cricket" |
| `{{DIFFICULTY}}` | Quiz difficulty | "HARD" |
| `{{NUM_QUESTIONS}}` | Number of questions | "10" |
| `{{DURATION}}` | Quiz duration (seconds) | "600" |

#### Edit the Prompt

1. Modify the text in the textarea
2. Add/remove placeholders as needed
3. Customize instructions
4. Click **"Save Changes"**
5. Changes apply immediately to AI generator

#### Reset to Default

1. Click **"Reset to Default"**
2. Confirm in the dialog
3. Prompt restored to original template

---

## 🎨 UI Components

### Settings Page Layout

```
┌─────────────────────────────────────────────────┐
│ Settings                                        │
│ Configure application settings and preferences  │
├─────────────────────────────────────────────────┤
│ AI Quiz Generator Prompt        [Default]      │
│ Customize the prompt template...               │
│                    [Reset] [Save Changes]       │
├─────────────────────────────────────────────────┤
│ Available Placeholders:                         │
│ {{TOPIC}} - Topic name                         │
│ {{SPORT}} - Sport category                     │
│ ...                                            │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐  │
│ │ [Editable prompt template textarea]       │  │
│ │                                           │  │
│ │ Large multi-line text editor              │  │
│ │                                           │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ Prompt Status: Using custom prompt template    │
│ Characters: 1,247                              │
└─────────────────────────────────────────────────┘
```

### Status Indicators

**Default Prompt:**
```
AI Quiz Generator Prompt [Default]
```

**Custom Prompt:**
```
AI Quiz Generator Prompt [Unsaved Changes]
```

**After Save:**
```
AI Quiz Generator Prompt
```

---

## 🔌 API Integration

### Get Settings

```
GET /api/admin/settings?key=ai_quiz_prompt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "ai_quiz_prompt",
    "value": "Your prompt template...",
    "isDefault": false
  }
}
```

### Update Setting

```
PUT /api/admin/settings
```

**Request:**
```json
{
  "key": "ai_quiz_prompt",
  "value": "Updated prompt template..."
}
```

### Reset to Default

```
DELETE /api/admin/settings?key=ai_quiz_prompt
```

---

## 📊 Database Schema

```prisma
model AppSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  category  String   @default("general")
  updatedAt DateTime @updatedAt
  updatedBy String?  // User ID who made the change
  
  @@index([category])
}
```

**Fields:**
- `key` - Unique setting identifier (e.g., "ai_quiz_prompt")
- `value` - Setting value (stored as text for flexibility)
- `category` - Grouping (e.g., "ai", "email", "general")
- `updatedAt` - Last modification time
- `updatedBy` - Admin user ID who updated it

---

## 🎯 Settings Flow

### On First Load

1. Check database for `ai_quiz_prompt` setting
2. If exists → Load custom prompt
3. If not exists → Use default prompt from code
4. Display in settings page

### When Saving

1. User edits prompt in textarea
2. Clicks "Save Changes"
3. API validates and saves to database
4. Setting marked as custom (not default)
5. AI generator uses new prompt immediately

### When Resetting

1. User clicks "Reset to Default"
2. Confirms action
3. Database entry is deleted
4. System falls back to code default
5. Setting marked as default again

---

## 💡 Example Customizations

### Shorter Prompt

```
Create a {{DIFFICULTY}} difficulty quiz about {{TOPIC}}.
Generate {{NUM_QUESTIONS}} questions.
Output valid JSON matching this structure: {...}
```

### More Detailed Instructions

```
You are an expert {{SPORT}} quiz creator...

Guidelines:
- Include historical context
- Reference specific players and teams
- Use dates and statistics
- Make questions engaging

Create {{NUM_QUESTIONS}} questions about {{TOPIC}}...
```

### Different JSON Structure

You can even customize the expected JSON format:
```
{
  "title": "{{TOPIC}} - The Ultimate Quiz",
  "metadata": {
    "sport": "{{SPORT}}",
    "level": "{{DIFFICULTY}}"
  },
  ...
}
```

---

## 🔒 Security

**Access Control:**
- ✅ Admin-only access
- ✅ Requires authentication
- ✅ Tracks who made changes (updatedBy)

**Validation:**
- ✅ Prompt must not be empty
- ✅ Key must be valid enum value
- ✅ Value stored as TEXT (no size limit)

---

## 🎨 Future Settings

The settings page is designed to be extensible. Future settings may include:

- **Email Templates**
  - Welcome email
  - Password reset
  - Achievement notifications

- **Platform Configuration**
  - Site name and branding
  - Default quiz settings
  - Leaderboard display options

- **Badge Criteria**
  - Customizable achievement thresholds
  - Badge images and descriptions

- **AI Configuration**
  - Model selection (GPT-4, GPT-3.5)
  - Temperature settings
  - Max tokens per generation

---

## 📂 Files Created

**Database:**
- `prisma/schema.prisma` - Added AppSettings model

**Services:**
- `lib/services/settings.service.ts` - Settings CRUD operations

**API:**
- `app/api/admin/settings/route.ts` - Settings endpoints (GET, PUT, DELETE)

**UI:**
- `app/admin/settings/page.tsx` - Settings management interface

**Updated:**
- `app/api/admin/ai/generate-quiz/route.ts` - Uses stored prompt

---

## ✅ Testing Checklist

- [ ] Run database migration (`npx prisma db push`)
- [ ] Navigate to Admin → Settings
- [ ] View default prompt
- [ ] Edit prompt (e.g., change instructions)
- [ ] Save changes
- [ ] Generate quiz with AI
- [ ] Verify custom prompt was used
- [ ] Reset to default
- [ ] Verify default prompt restored
- [ ] Generate quiz again
- [ ] Verify default prompt used

---

## 🚀 Quick Start

### 1. Run Migration

```bash
npx prisma db push
```

### 2. Access Settings

Navigate to: **Admin → Settings**

### 3. Customize Prompt

Edit the AI quiz generator prompt to match your needs:
- Change tone and style
- Add/remove instructions
- Modify JSON structure
- Add domain-specific guidelines

### 4. Save & Test

1. Save your changes
2. Go to AI Quiz Generator
3. Generate a quiz
4. Verify your customizations appear in output

---

## 💡 Tips

### Effective Prompts

**Do:**
- ✅ Be specific about desired output format
- ✅ Include examples
- ✅ List clear instructions
- ✅ Use all relevant placeholders
- ✅ Test with different topics

**Avoid:**
- ❌ Vague instructions
- ❌ Conflicting requirements
- ❌ Too many constraints
- ❌ Overly complex structures

### Placeholder Usage

**Always use:**
- `{{TOPIC}}` in question topics
- `{{NUM_QUESTIONS}}` for quantity
- `{{DIFFICULTY}}` for overall level

**Optional:**
- `{{SPORT}}` if sport-specific instructions needed
- `{{DURATION}}` for time-based context
- `{{TOPIC_LOWER}}` for keywords

### Testing Changes

After editing the prompt:
1. Generate a small quiz (5 questions)
2. Review quality
3. Adjust prompt if needed
4. Save when satisfied
5. Scale up to larger quizzes

---

## 🎉 Feature Complete

The Admin Settings page is now ready with:
- ✅ Editable AI prompt template
- ✅ Database-backed storage  
- ✅ Save/Reset functionality
- ✅ Live preview and editing
- ✅ Graceful fallbacks
- ✅ Extensible for future settings

Access it at: **Admin → Settings** 🎊

