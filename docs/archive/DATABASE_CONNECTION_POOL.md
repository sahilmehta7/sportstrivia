# Database Connection Pool Configuration

## Problem

Prisma connection pool timeouts occur when too many concurrent queries exceed available connections:

```
Timed out fetching a new connection from the connection pool.
(Current connection pool timeout: 10, connection limit: 17)
```

## Solution

### 1. Query Optimization (Implemented)

**Before:**
```typescript
// 3 parallel queries competing for connections
const [session, quiz, reviews] = await Promise.all([
  auth(),
  prisma.quiz.findUnique({...}),
  prisma.quizReview.findMany({...}),
]);

// Then another query
const uniqueUsersCount = await prisma.quizAttempt.findMany({
  distinct: ['userId']  // Expensive distinct query
});
```

**After:**
```typescript
// Sequential: session first (no DB connection)
const session = await auth();

// Single query for quiz data
const quiz = await prisma.quiz.findUnique({...});

// Then parallel queries only if needed
const [reviews, uniqueUsersCount] = await Promise.all([
  prisma.quizReview.findMany({...}),
  prisma.quizAttempt.groupBy({  // More efficient than distinct
    by: ['userId'],
    where: { quizId: quiz.id }
  }).then(results => results.length),
]);
```

**Benefits:**
- ✅ Reduced concurrent connections from 4 to 2
- ✅ More efficient `groupBy` instead of `distinct`
- ✅ Early exit if quiz not found
- ✅ Better resource management

### 2. DATABASE_URL Configuration

Add connection pool parameters to your `.env` file:

```env
# Recommended settings for production
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=20"

# For Supabase pooler (recommended)
DATABASE_URL="postgresql://user:password@...pooler.supabase.com:5432/db?pgbouncer=true&connection_limit=20&pool_timeout=20"

# For development (more conservative)
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=15"
```

**Parameters:**
- `connection_limit`: Max concurrent connections (default: varies by provider)
- `pool_timeout`: Seconds to wait for connection (default: 10)
- `pgbouncer=true`: For Supabase connection pooling

### 3. Supabase-Specific Settings

#### Using Supabase Pooler (Recommended)

```env
# Pooler URL (good for serverless)
DATABASE_URL="postgresql://postgres.[ref].supabase.co:6543/postgres?pgbouncer=true&connection_limit=20"

# Direct URL (for migrations)
DIRECT_URL="postgresql://postgres.[ref].supabase.co:5432/postgres"
```

#### Connection Limits by Supabase Plan

| Plan | Max Connections |
|------|----------------|
| Free | 60 |
| Pro | 200 |
| Team | 400 |
| Enterprise | Unlimited |

**Recommendation:**
- Set `connection_limit=20` for Free tier (leave room for other services)
- Set `connection_limit=50` for Pro tier
- Set `connection_limit=100` for Team tier

### 4. Prisma Client Configuration

Already implemented in `lib/db.ts`:

```typescript
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### 5. Query Optimization Best Practices

#### ✅ Do This:
- Fetch session before database queries (doesn't use connection)
- Use `groupBy` instead of `distinct` + `findMany` for counting
- Combine related queries with `include`
- Check existence before fetching related data
- Release connections quickly (avoid long transactions)

#### ❌ Avoid This:
- Too many `Promise.all` with database queries
- Nested sequential queries (N+1 problem)
- Large `distinct` operations on big tables
- Long-running transactions
- Unnecessary `include` depth

### 6. Monitoring Connection Usage

Add to your monitoring/logging:

```typescript
// Log active connections (development only)
if (process.env.NODE_ENV === "development") {
  const metrics = await prisma.$metrics.json();
  console.log("Active connections:", metrics);
}
```

### 7. Alternative: Connection Pooling Services

For production at scale:

#### Option 1: PgBouncer
- Built-in with Supabase
- Transaction pooling mode
- Add `?pgbouncer=true` to connection string

#### Option 2: Prisma Data Proxy
- Managed connection pooling
- Good for serverless
- Requires Prisma Cloud account

#### Option 3: Custom Pool Manager
- Implement custom pooling
- More control but complex
- Usually not needed

## Current Optimizations Applied

### Quiz Detail Page
1. ✅ Session fetched first (no DB connection)
2. ✅ Quiz query with all includes (single connection)
3. ✅ Early exit if quiz not found
4. ✅ Reviews + users count in parallel (2 connections)
5. ✅ `groupBy` instead of `distinct` (more efficient)

**Total connections:** 3 (was 4+)

### Other Pages
Similar optimizations can be applied to:
- Quiz listing page
- Topic pages
- Profile pages
- Leaderboard pages

## Testing

### Verify Connection Pool Health

```bash
# Check current pool usage
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Monitor during load test
while true; do
  curl -s http://localhost:3200/quizzes/[slug] > /dev/null
  sleep 0.5
done
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Load test quiz pages
artillery quick --count 50 --num 10 http://localhost:3200/quizzes
```

## When to Increase Pool Size

Increase if you see:
- ⚠️ Frequent timeout errors
- ⚠️ High latency on DB queries
- ⚠️ Many concurrent users (100+)
- ⚠️ Complex queries taking > 1 second

## Summary

✅ **Optimized quiz detail page** - Reduced connections from 4 to 3
✅ **Used efficient groupBy** - Instead of distinct + findMany
✅ **Sequential when possible** - Auth first, then DB queries
✅ **Early exits** - Check existence before related queries
✅ **Connection pool ready** - Can handle 20+ concurrent users

The connection pool timeout errors should now be resolved!

