# API Fixes: Challenges & Datetime Validation

## Overview
Fixed two critical API errors that were preventing proper functionality of challenges and quiz editing.

## Issue 1: Challenge API - Non-existent Relations

### Problem
```
Unknown field `challengerAttempt` for include statement on model `Challenge`
Unknown field `challengedAttempt` for include statement on model `Challenge`
```

The Challenge API was trying to include `challengerAttempt` and `challengedAttempt` relations that don't exist in the Prisma schema.

### Root Cause
The `challengeInclude` constant in `lib/dto/challenge-filters.dto.ts` was attempting to include relations that were never defined in the schema.

### Actual Schema
```prisma
model Challenge {
  id              String          @id @default(cuid())
  challengerId    String
  challengedId    String
  quizId          String
  
  challengerScore Float?          // Direct fields, not relations
  challengedScore Float?
  expiresAt       DateTime?
  
  status          ChallengeStatus @default(PENDING)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  challenger User @relation("Challenger", ...)
  challenged User @relation("Challenged", ...)
  quiz       Quiz @relation(...)
}
```

The Challenge model stores **scores directly** (`challengerScore`, `challengedScore`), not as relations to `QuizAttempt`.

### Solution
Removed the non-existent relations from `challengeInclude`:

```typescript
// BEFORE (Broken)
export const challengeInclude: Prisma.ChallengeInclude = {
  challenger: { ... },
  challenged: { ... },
  quiz: { ... },
  challengerAttempt: { ... },  // ❌ Doesn't exist
  challengedAttempt: { ... },  // ❌ Doesn't exist
};

// AFTER (Fixed)
export const challengeInclude: Prisma.ChallengeInclude = {
  challenger: { ... },
  challenged: { ... },
  quiz: { ... },
  // Scores are accessed directly as challengerScore and challengedScore
};
```

### What This Fixes
- ✅ `/api/challenges` endpoint now works
- ✅ Challenge list loads properly
- ✅ Sent/received/active challenges display correctly
- ✅ No more Prisma validation errors

## Issue 2: Datetime Validation - Empty Strings

### Problem
```
Invalid datetime
path: ["startTime"]
path: ["endTime"]  
path: ["answersRevealTime"]
```

When editing quizzes with empty datetime fields, the validation was failing because empty strings were being sent instead of `undefined`.

### Root Cause
HTML datetime-local inputs can be:
1. Filled with a valid datetime string
2. Empty (which sends `""` as the value)

Zod's `z.string().datetime()` validation rejects empty strings.

### Solution

#### 1. Enhanced Preprocessing (`app/api/admin/quizzes/[id]/route.ts`)
```typescript
const cleanedBody = Object.fromEntries(
  Object.entries(body).map(([key, value]) => {
    // Convert null to undefined
    if (value === null) return [key, undefined];
    
    // Convert empty/whitespace strings to undefined for specific fields
    if (typeof value === "string" && value.trim() === "" && 
        ["startTime", "endTime", "answersRevealTime", "descriptionImageUrl", "descriptionVideoUrl", "seoTitle", "seoDescription"].includes(key)) {
      return [key, undefined];
    }
    
    return [key, value];
  })
);
```

**Key changes:**
- Check `typeof value === "string"` before calling `.trim()`
- Use `.trim()` to catch whitespace-only strings
- Apply to all optional string fields that can be empty

#### 2. Permissive Schema Validation (`lib/validations/quiz.schema.ts`)
```typescript
// Allow: valid datetime, empty string, null, or undefined
startTime: z.union([
  z.string().datetime(),
  z.literal(""),
  z.null(),
  z.undefined()
]).optional(),
```

This accepts all possible representations of "no value":
- `""` (empty string from form)
- `null` (from JSON)
- `undefined` (omitted field)
- Valid ISO datetime string

#### 3. Applied to Both Endpoints
- `POST /api/admin/quizzes` (create)
- `PUT /api/admin/quizzes/[id]` (update)

### What This Fixes
- ✅ Can save quizzes without scheduling (empty dates)
- ✅ Can clear existing dates by emptying the field
- ✅ No more Zod validation errors
- ✅ Handles all edge cases (null, empty, whitespace)
- ✅ Works for URL fields too

## Testing

### Challenge API
```bash
# Test challenges endpoint
curl -X GET http://localhost:8000/api/challenges?type=sent&status=PENDING
curl -X GET http://localhost:8000/api/challenges?type=received
```

Should return challenges without errors.

### Quiz Editing
1. Go to Admin → Quizzes → Edit any quiz
2. Leave scheduling fields empty
3. Click Save
4. ✅ Should save successfully

Or:
1. Fill in startTime/endTime
2. Save
3. Clear the fields (empty them)
4. Save again
5. ✅ Should save successfully

## Related Files Modified

1. `lib/dto/challenge-filters.dto.ts` - Removed invalid relations
2. `app/api/admin/quizzes/[id]/route.ts` - Enhanced preprocessing
3. `app/api/admin/quizzes/route.ts` - Enhanced preprocessing
4. `lib/validations/quiz.schema.ts` - Permissive datetime validation

## Prevention

### For Future Schema Changes
When adding relations to models:
1. Define in `schema.prisma` first
2. Run `prisma generate`
3. Then use in queries
4. Never assume relations exist without checking schema

### For Form Fields
When adding optional datetime/URL fields:
1. Add to preprocessing list
2. Use `.union()` for multiple allowed types
3. Test with empty, null, and valid values
4. Consider `.transform()` for normalization

## Impact

### Before
- ❌ Challenges page threw 500 errors
- ❌ Quiz editing failed with empty dates
- ❌ User experience broken

### After
- ✅ Challenges load and display correctly
- ✅ Quiz editing works with all field combinations
- ✅ Smooth user experience
- ✅ Proper error handling

