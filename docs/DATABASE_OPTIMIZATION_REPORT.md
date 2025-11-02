# Database Optimization & Security Report
**Generated:** $(date)
**Database:** Supabase PostgreSQL (via Prisma)
**Schema Version:** Current

## Executive Summary

This report identifies **critical security vulnerabilities** and **performance optimization opportunities** in the Supabase database schema. The analysis is based on:
- Supabase advisor recommendations (security & performance)
- Context7 best practices documentation
- Current schema and query patterns analysis
- Index usage and coverage review

---

## 🔴 CRITICAL ISSUES

### 1. Row Level Security (RLS) Disabled on All Tables
**Priority:** CRITICAL | **Category:** Security | **Impact:** High

**Issue:**
All 33 public tables have RLS disabled, exposing data to potential unauthorized access if direct database access is compromised.

**Affected Tables:**
- User, Account, Session, VerificationToken
- Quiz, Question, Answer, QuizAttempt
- Challenge, Friend, Notification
- All other public tables (33 total)

**Risk:**
- Unauthorized data access if database credentials are compromised
- Violation of data privacy regulations (GDPR, CCPA)
- Potential data breaches

**Remediation:**
```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all 33 tables)

-- Create RLS policies for each table based on access patterns
-- Example for User table:
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid() = id);

-- Example for Quiz table (public read, admin write):
CREATE POLICY "Anyone can view published quizzes"
  ON "Quiz" FOR SELECT
  USING (status = 'PUBLISHED' AND "isPublished" = true);

CREATE POLICY "Admins can manage quizzes"
  ON "Quiz" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
```

**Best Practices:**
- Index foreign keys used in RLS policies (see performance section)
- Use `SELECT` wrapper for RLS functions to allow query planner caching
- Consider security definer functions for complex authorization logic

**Reference:** https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public

---

### 2. VerificationToken Table Missing Primary Key
**Priority:** CRITICAL | **Category:** Schema Integrity | **Impact:** Medium

**Issue:**
The `VerificationToken` table has no primary key, which can cause:
- Inefficient operations at scale
- Potential data integrity issues
- Performance degradation

**Remediation:**
```sql
-- Add a primary key (composite or new ID column)
ALTER TABLE "VerificationToken"
  ADD COLUMN id SERIAL PRIMARY KEY;

-- OR if tokens should be unique per identifier:
ALTER TABLE "VerificationToken"
  ADD PRIMARY KEY (identifier, token);
```

---

## 🟠 HIGH PRIORITY ISSUES

### 3. Missing Indexes on Foreign Keys
**Priority:** HIGH | **Category:** Performance | **Impact:** Medium-High

**Issue:**
Foreign key columns without indexes can cause slow DELETE and UPDATE operations on referenced tables, as PostgreSQL must scan the entire child table to check constraints.

**Affected Foreign Keys:**
1. `QuestionReport.userId` - Missing index
2. `UserAnswer.answerId` - Missing index  
3. `UserSearchQuery.searchQueryId` - Missing index

**Remediation:**
```sql
-- Add indexes for unindexed foreign keys
CREATE INDEX "QuestionReport_userId_idx" 
  ON "QuestionReport" ("userId");

CREATE INDEX "UserAnswer_answerId_idx" 
  ON "UserAnswer" ("answerId");

CREATE INDEX "UserSearchQuery_searchQueryId_idx" 
  ON "UserSearchQuery" ("searchQueryId");
```

**Impact:**
- Faster cascading deletes/updates
- Improved join performance
- Better query plan optimization

**Reference:** https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

---

### 4. Complex Query Patterns Without Optimization
**Priority:** HIGH | **Category:** Performance | **Impact:** High

**Issues Identified:**

#### 4.1 Deep Nested Includes in Prisma Queries
**Location:** `lib/services/public-quiz.service.ts`, `lib/services/topic.service.ts`

**Problem:**
```typescript
// Current pattern - loads all nested data
prisma.topic.findMany({
  include: {
    children: {
      include: {
        children: {
          include: {
            _count: { select: { questions: true } }
          }
        },
        _count: { select: { questions: true } }
      }
    }
  }
})
```

**Impact:**
- Over-fetching data
- Slow query execution
- High memory usage

**Remediation:**
- Use `select` instead of `include` to fetch only needed fields
- Implement pagination for nested results
- Consider separate queries with batching

```typescript
// Optimized pattern
prisma.topic.findMany({
  select: {
    id: true,
    name: true,
    slug: true,
    children: {
      select: {
        id: true,
        name: true,
        _count: { select: { questions: true } }
      },
      take: 10 // Limit nested results
    }
  }
})
```

#### 4.2 Topic Hierarchy Queries
**Location:** `lib/services/topic.service.ts`

**Issue:**
The `getDailyRecurringQuizzes` function performs N+1 queries when calculating streaks:
```typescript
Promise.all(
  quizIds.map(async (quizId) => {
    const attempts = await prisma.quizAttempt.findMany({...});
    // ... streak calculation
  })
)
```

**Remediation:**
- Batch all streak calculations in a single query
- Use raw SQL for complex aggregations if needed
- Consider materialized views for streak calculations

```typescript
// Batch query approach
const allAttempts = await prisma.quizAttempt.findMany({
  where: {
    userId,
    quizId: { in: quizIds },
    completedAt: { gte: thirtyDaysAgo }
  },
  select: {
    quizId: true,
    completedAt: true
  },
  orderBy: { completedAt: 'desc' }
});

// Process in-memory for streaks
const streaksByQuiz = calculateStreaksInMemory(allAttempts);
```

#### 4.3 Text Search Without Full-Text Indexes
**Location:** `lib/services/topic.service.ts` (searchTopics function)

**Issue:**
```typescript
where: {
  OR: [
    { name: { contains: trimmedQuery, mode: "insensitive" } },
    { slug: { contains: trimmedQuery, mode: "insensitive" } },
    { description: { contains: trimmedQuery, mode: "insensitive" } }
  ]
}
```

**Impact:**
- Sequential scans on large tables
- Slow search performance
- No relevance ranking

**Remediation:**
```sql
-- Add full-text search columns and indexes
ALTER TABLE "Topic" 
  ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', 
      COALESCE(name, '') || ' ' || 
      COALESCE(description, '') || ' ' ||
      COALESCE(slug, '')
    )
  ) STORED;

CREATE INDEX "Topic_fts_idx" ON "Topic" USING gin ("fts");

-- Update query to use full-text search
-- In Prisma, use raw query for full-text search:
prisma.$queryRaw`
  SELECT id, name, slug, description, level,
    ts_rank(fts, plainto_tsquery('english', ${query})) as rank
  FROM "Topic"
  WHERE fts @@ plainto_tsquery('english', ${query})
  ORDER BY rank DESC
  LIMIT ${limit}
`
```

---

### 5. Missing Composite Indexes for Common Query Patterns
**Priority:** HIGH | **Category:** Performance | **Impact:** Medium-High

**Identified Patterns:**

#### 5.1 Quiz Filtering Queries
**Common Query Pattern:**
```typescript
// From public-quiz.service.ts
where: {
  isPublished: true,
  status: "PUBLISHED",
  sport: { not: null },
  // ... other filters
}
```

**Missing Index:**
```sql
-- Composite index for common filter combinations
CREATE INDEX "Quiz_published_status_sport_idx" 
  ON "Quiz" ("isPublished", status, sport)
  WHERE "isPublished" = true AND status = 'PUBLISHED';
```

#### 5.2 Quiz Attempt Date Range Queries
**Pattern:**
```typescript
// Frequent pattern for daily quiz checking
where: {
  userId,
  quizId: { in: quizIds },
  completedAt: { gte: today, lt: tomorrow }
}
```

**Missing Index:**
```sql
-- Composite index for user quiz attempts by date
CREATE INDEX "QuizAttempt_userId_quizId_completedAt_idx"
  ON "QuizAttempt" ("userId", "quizId", "completedAt")
  WHERE "completedAt" IS NOT NULL;
```

#### 5.3 Notification Queries
**Pattern:**
```typescript
// Common: get unread notifications for user
where: {
  userId,
  read: false
}
ORDER BY createdAt DESC
```

**Missing Index:**
```sql
-- Composite index for unread notifications
CREATE INDEX "Notification_userId_read_createdAt_idx"
  ON "Notification" ("userId", read, "createdAt" DESC)
  WHERE read = false;
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. Unused Indexes (Potential Cleanup)
**Priority:** MEDIUM | **Category:** Performance | **Impact:** Low-Medium

**Issue:**
20 indexes have never been used, indicating:
- Over-indexing (wastes storage and slows writes)
- Queries not using optimal indexes
- Indexes created but queries never executed

**Unused Indexes:**
1. `QuizCompletionBonusAward_quizId_idx`
2. `QuizCompletionBonusAward_userId_idx`
3. `UserLevel_level_idx`
4. `UserTierHistory_tierId_idx`
5. `Quiz_sport_idx`
6. `Quiz_difficulty_idx`
7. `QuizTagRelation_quizId_idx`
8. `QuizTagRelation_tagId_idx`
9. `QuizTopicConfig_quizId_idx`
10. `Question_type_idx`
11. `UserTopicStats_userId_idx`
12. `Friend_userId_idx`
13. `Challenge_quizId_idx`
14. `UserBadge_userId_idx`
15. `Notification_read_idx`
16. `QuizReview_rating_idx`
17. `QuestionReport_status_idx`
18. `Media_fileType_idx`
19. `AdminBackgroundTask_type_idx`
20. `AdminBackgroundTask_status_idx`
21. `AdminBackgroundTask_createdAt_idx`
22. `AppSettings_category_idx`
23. `UserSearchQuery_userId_lastSearchedAt_idx`

**Action Items:**
1. **Monitor before removing:** Check if indexes are unused due to low query volume
2. **Verify query patterns:** Ensure queries should use these indexes
3. **Remove if confirmed unused:** Free up storage and improve write performance

**Remediation:**
```sql
-- Monitor index usage first (run for 1-2 weeks)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- After monitoring, drop confirmed unused indexes
DROP INDEX IF EXISTS "Quiz_sport_idx";
-- ... (only after confirming they're truly unused)
```

**Note:** Some indexes may be unused because:
- Tables have low data volume
- Queries use different filters
- Composite indexes are being used instead

---

### 7. Missing Indexes for ORDER BY Clauses
**Priority:** MEDIUM | **Category:** Performance | **Impact:** Medium

**Issue:**
Queries with `ORDER BY` that don't match index order can cause:
- Filesort operations (expensive)
- Slower pagination
- Performance degradation at scale

**Patterns to Optimize:**

#### 7.1 Quiz List Sorting
```typescript
// Common sort patterns
orderBy: {
  createdAt: "desc" // Popular quizzes
}
orderBy: {
  averageRating: "desc" // Top rated
}
```

**Remediation:**
```sql
-- Index for created date sorting (with partial for published only)
CREATE INDEX "Quiz_isPublished_createdAt_idx"
  ON "Quiz" ("isPublished", "createdAt" DESC)
  WHERE "isPublished" = true;

-- Index for rating sorting
CREATE INDEX "Quiz_published_rating_idx"
  ON "Quiz" ("isPublished", "averageRating" DESC, "totalReviews" DESC)
  WHERE "isPublished" = true AND status = 'PUBLISHED';
```

#### 7.2 Leaderboard Queries
**Pattern:**
```typescript
// Already has composite index, but verify it matches query pattern
orderBy: {
  bestPoints: "desc",
  averageResponseTime: "asc"
}
```

**Current Index:**
```sql
-- Already exists: QuizLeaderboard_quizId_bestPoints_averageResponseTime_idx
-- Verify it matches actual query patterns
```

---

### 8. No Query Result Caching Strategy
**Priority:** MEDIUM | **Category:** Performance | **Impact:** Medium

**Issue:**
Frequently accessed, rarely-changing data is queried repeatedly:
- Topic hierarchies (already has in-memory cache)
- Quiz filter options (sports, tags, topics)
- Badge definitions
- Level/Tier configurations

**Remediation:**
1. **Application-level caching:**
   - Implement Redis or similar for frequently accessed data
   - Cache TTL based on data change frequency
   - Invalidate on mutations

2. **Database-level materialized views:**
   ```sql
   -- Example: Materialized view for quiz filter options
   CREATE MATERIALIZED VIEW quiz_filter_options AS
   SELECT DISTINCT sport
   FROM "Quiz"
   WHERE "isPublished" = true AND status = 'PUBLISHED' AND sport IS NOT NULL;
   
   CREATE INDEX ON quiz_filter_options (sport);
   
   -- Refresh periodically or on quiz updates
   REFRESH MATERIALIZED VIEW CONCURRENTLY quiz_filter_options;
   ```

3. **Query result caching:**
   - Use Prisma query result caching
   - Implement HTTP caching headers for API responses
   - Consider CDN caching for public data

---

## 🟢 LOW PRIORITY ISSUES

### 9. Missing BRIN Indexes for Time-Series Data
**Priority:** LOW | **Category:** Performance | **Impact:** Low (but improves at scale)

**Issue:**
Tables with time-series patterns (createdAt, completedAt) use B-tree indexes which are larger and slower for range queries on large datasets.

**Candidates for BRIN Indexes:**
- `QuizAttempt.completedAt` (grows over time)
- `Notification.createdAt` (high write volume)
- `UserAnswer.createdAt` (rapid growth)
- `QuizReview.createdAt`

**Remediation:**
```sql
-- BRIN indexes are smaller and faster for time-series data
CREATE INDEX "QuizAttempt_completedAt_brin_idx"
  ON "QuizAttempt" USING brin ("completedAt")
  WHERE "completedAt" IS NOT NULL;

CREATE INDEX "Notification_createdAt_brin_idx"
  ON "Notification" USING brin ("createdAt");
```

**When to Use BRIN:**
- Columns with natural ordering (timestamps, auto-increment IDs)
- Large tables (>1M rows)
- Range queries are common
- Data is append-heavy (few updates)

---

### 10. Potential for Query Batching Optimization
**Priority:** LOW | **Category:** Performance | **Impact:** Low-Medium

**Issue:**
Some service functions execute multiple sequential queries that could be batched.

**Example:** `getPublicQuizFilterOptions()` executes 3 parallel queries (good), but some other functions don't.

**Remediation:**
- Review all service functions for sequential queries
- Use `Promise.all()` for independent queries
- Consider Prisma's `$transaction()` for related queries that need consistency

---

### 11. Missing ANALYZE on Large Tables
**Priority:** LOW | **Category:** Performance | **Impact:** Low (PostgreSQL auto-analyzes, but manual helps)

**Issue:**
Statistics may be stale for query planner optimization.

**Remediation:**
```sql
-- Run ANALYZE after bulk data imports or schema changes
ANALYZE "Quiz";
ANALYZE "Question";
ANALYZE "QuizAttempt";
ANALYZE "UserAnswer";
```

**Best Practice:**
- PostgreSQL auto-analyzes, but manual ANALYZE helps after:
  - Large data imports
  - Significant data deletions
  - Schema changes affecting statistics

---

## Query Optimization Recommendations

### 12. Use EXPLAIN ANALYZE for Slow Queries
**Priority:** ONGOING | **Category:** Performance | **Impact:** Variable

**Action:**
1. Identify slow queries using `pg_stat_statements`
2. Run `EXPLAIN ANALYZE` on problematic queries
3. Review query plans for:
   - Sequential scans on large tables
   - Missing index usage
   - Expensive operations (sorts, joins)

**Example:**
```sql
-- Find slow queries
SELECT 
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time,
  query
FROM pg_stat_statements
WHERE 
  calls > 50
  AND mean_exec_time > 10  -- queries taking >10ms on average
  AND query NOT LIKE '%pg_stat%'  -- exclude system queries
ORDER BY total_exec_time DESC
LIMIT 20;

-- Analyze specific query
EXPLAIN ANALYZE
SELECT * FROM "Quiz"
WHERE "isPublished" = true 
  AND status = 'PUBLISHED'
ORDER BY "createdAt" DESC
LIMIT 12;
```

---

### 13. Implement Connection Pooling Best Practices
**Priority:** ONGOING | **Category:** Performance | **Impact:** Medium

**Current State:**
- Prisma client uses connection pooling (good)
- Connection timeout configured

**Recommendations:**
1. Monitor connection pool usage
2. Adjust pool size based on load
3. Consider PgBouncer for additional pooling if needed
4. Use read replicas for read-heavy workloads

---

## Index Strategy Summary

### Indexes to Add (High Priority)
1. Foreign key indexes (3)
2. Composite indexes for common filters (3-5)
3. Full-text search indexes (1-2)

### Indexes to Review (Medium Priority)
1. Monitor unused indexes for 1-2 weeks
2. Remove confirmed unused indexes
3. Consider partial indexes for filtered queries

### Indexes to Add (Low Priority)
1. BRIN indexes for time-series columns (4)
2. Ordered indexes for common sort patterns (2-3)

---

## Security Hardening Checklist

### Immediate Actions Required:
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for each table
- [ ] Add primary key to VerificationToken
- [ ] Test RLS policies with different user roles
- [ ] Document RLS policy rationale

### Testing:
- [ ] Verify authenticated users can only access their data
- [ ] Verify public read access works for published content
- [ ] Verify admin users have appropriate permissions
- [ ] Test RLS performance impact

---

## Performance Optimization Checklist

### High Priority:
- [ ] Add missing foreign key indexes
- [ ] Optimize complex nested queries
- [ ] Implement full-text search indexes
- [ ] Add composite indexes for common query patterns
- [ ] Review and optimize N+1 query patterns

### Medium Priority:
- [ ] Monitor unused indexes for removal
- [ ] Add indexes for ORDER BY clauses
- [ ] Implement query result caching
- [ ] Set up query performance monitoring

### Low Priority:
- [ ] Add BRIN indexes for time-series data
- [ ] Optimize query batching
- [ ] Review ANALYZE schedules

---

## Monitoring & Maintenance

### Recommended Monitoring:
1. **Query Performance:**
   - Enable `pg_stat_statements` extension
   - Monitor slow query log
   - Set up alerts for queries >1s

2. **Index Usage:**
   - Weekly review of unused indexes
   - Monitor index size growth
   - Check index bloat

3. **Connection Pooling:**
   - Monitor connection pool usage
   - Track connection wait times
   - Alert on pool exhaustion

4. **RLS Performance:**
   - Monitor query performance after enabling RLS
   - Check for RLS-related slow queries
   - Optimize RLS policies if needed

### Maintenance Tasks:
- Weekly: Review unused indexes
- Monthly: ANALYZE large tables
- Quarterly: Review and optimize slow queries
- After bulk imports: ANALYZE affected tables

---

## References

1. **Supabase Documentation:**
   - RLS Best Practices: https://supabase.com/docs/guides/database/postgres/row-level-security
   - Database Linter: https://supabase.com/docs/guides/database/database-linter
   - Query Optimization: https://supabase.com/docs/guides/database/query-optimization

2. **PostgreSQL Documentation:**
   - Index Types: https://www.postgresql.org/docs/current/indexes-types.html
   - EXPLAIN: https://www.postgresql.org/docs/current/sql-explain.html
   - BRIN Indexes: https://www.postgresql.org/docs/current/brin.html

3. **Prisma Documentation:**
   - Query Optimization: https://www.prisma.io/docs/guides/performance-and-optimization
   - Connection Pooling: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management

---

## Implementation Priority

1. **Week 1 (Critical):**
   - Enable RLS on all tables
   - Create RLS policies
   - Add primary key to VerificationToken

2. **Week 2 (High):**
   - Add missing foreign key indexes
   - Optimize complex query patterns
   - Implement full-text search

3. **Week 3-4 (Medium):**
   - Add composite indexes
   - Monitor unused indexes
   - Implement caching strategy

4. **Ongoing (Low):**
   - Add BRIN indexes
   - Query performance monitoring
   - Continuous optimization

---

**Report Generated:** $(date)
**Next Review:** Recommended in 3 months or after significant schema changes

