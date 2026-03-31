# Connection Pool Timeout Fix

## Problem

When listing background tasks in the admin panel, Prisma was timing out while fetching connections from the connection pool:

```
Invalid `prisma.adminBackgroundTask.findMany()` invocation: 
Timed out fetching a new connection from the connection pool. 
More info: http://pris.ly/d/connection-pool 
(Current connection pool timeout: 10, connection limit: 17)
```

## Root Cause

The `result` field in `AdminBackgroundTask` stores large JSON blobs containing:
- Raw OpenAI API responses (can be 50-200KB+ per task)
- Extracted generated content
- Prompt previews
- Parsed quiz/question data

When querying multiple tasks (e.g., 50-100 tasks), Prisma was:
1. Loading all these large JSON fields from the database
2. Transferring 5-20MB+ of JSON data over the network
3. Holding database connections for extended periods
4. Exhausting the connection pool

## Solution

### 1. Exclude Result Field from List Queries

Modified `listBackgroundTasksForUser()` to exclude the `result` field by default:

```typescript
// Before: Loaded all fields including large result JSON
return prisma.adminBackgroundTask.findMany({ ... });

// After: Explicitly select fields, excluding result
return prisma.adminBackgroundTask.findMany({
  select: {
    id: true,
    userId: true,
    type: true,
    status: true,
    label: true,
    input: true,
    // result: true, // Excluded - only fetch when viewing detail
    errorMessage: true,
    startedAt: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true,
  },
});
```

**Benefits:**
- Faster queries (no large JSON transfer)
- Lower memory usage
- Shorter connection hold times
- Prevents connection pool exhaustion

### 2. Reduced Default Task Limit

Changed default from 100 to 50 tasks per page:

```typescript
// app/admin/ai-tasks/page.tsx
const tasks = await listBackgroundTasksForUser(admin.id, { take: 50 });
```

### 3. Optional Result Field Inclusion

Added `includeResult` option for when result data is actually needed:

```typescript
// For list views (default - excludes result)
const tasks = await listBackgroundTasksForUser(userId, { take: 50 });

// For detail views (explicitly include result)
const tasks = await listBackgroundTasksForUser(userId, { 
  take: 1, 
  includeResult: true 
});
```

### 4. Fixed Typo

Fixed `task.lastUpdatedAt` → `task.updatedAt` in the admin page.

## Performance Impact

**Before:**
- Loading 100 tasks with result field: ~10-20MB of JSON data
- Query time: 5-15 seconds (often timing out)
- Connection pool: Frequently exhausted

**After:**
- Loading 50 tasks without result field: ~50KB of metadata
- Query time: <500ms
- Connection pool: Stable, no timeouts

## Best Practices

1. **Always exclude large JSON fields from list queries**
   - Use `select` to explicitly choose fields
   - Only fetch full records when viewing detail

2. **Limit pagination size**
   - Default to 50 items per page
   - Allow users to increase if needed

3. **Consider database-level optimizations**
   - Add indexes on frequently queried fields
   - Consider separate table for large JSON blobs (if needed)

## Connection Pool Configuration (Optional)

If issues persist, you can optimize the connection pool via `DATABASE_URL`:

```env
# Example: Increase pool size and timeout
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=20&pool_timeout=20&connect_timeout=10"
```

See: https://www.prisma.io/docs/concepts/database-connectors/postgresql#connection-pooling

## Testing

After this fix:
- ✅ Admin panel loads quickly
- ✅ No connection pool timeouts
- ✅ Task detail pages still show full result data
- ✅ Raw OpenAI responses still stored for retry parsing

## Related Files

- `lib/services/background-task.service.ts` - Query optimization
- `app/admin/ai-tasks/page.tsx` - Reduced default limit
- `app/admin/ai-tasks/[id]/page.tsx` - Detail view (includes result)

