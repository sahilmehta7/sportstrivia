# Next Steps - Database Optimization Roadmap

**Status:** Critical and High Priority issues completed ✅  
**Date:** 2024-11-02

---

## Immediate Actions (This Week)

### 1. ✅ Generate Prisma Client - COMPLETED
After schema changes, regenerate Prisma client:
```bash
npx prisma generate
```

### 2. ✅ Database Monitoring Scripts - COMPLETED
Created comprehensive monitoring tools:
- `npm run db:health` - Overall database health check
- `npm run db:indexes` - Index usage statistics
- `npm run db:indexes:unused` - Unused indexes report
- `npm run db:queries` - Query performance analysis
- `npm run db:queries:slow` - Slow queries only
- `npm run db:queries:frequent` - Most frequent queries
- `npm run db:test` - Test optimizations

**Current Status:**
- ✅ pg_stat_statements extension enabled
- ✅ 132 indexes total (46 unused - 664 kB wasted space)
- ✅ RLS enabled on 33/34 tables
- ✅ Average query execution time: 6.16ms
- ✅ Max query execution time: 5.49s (needs investigation)

### 3. Test Application Functionality
Verify that all features still work correctly with the new optimizations:

**Test Areas:**
- ✅ Quiz listing and filtering (verify new indexes work)
- ✅ Topic search (verify full-text search works correctly)
- ✅ Daily quiz streaks (verify N+1 fix works)
- ✅ User quiz attempts (verify date range queries)
- ✅ Notifications (verify unread notification queries)
- ✅ Admin operations (verify Prisma can still write via service role)

**Test Commands:**
```bash
# Run existing tests
npm test

# Manual testing
npm run dev
# Test key user flows in browser
```

### 3. Deploy to Production
Once testing is complete:
1. Review migration scripts (already applied via Supabase)
2. Ensure Prisma schema is synced in version control
3. Deploy application code changes
4. Monitor for any issues in first 24-48 hours

---

## Short-Term Actions (Next 2 Weeks)

### 1. Monitor Index Usage
Track which indexes are actually being used in production:

**Query to Run Weekly:**
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0  -- Unused indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Action:** After 2 weeks, identify truly unused indexes and consider removal to free up space.

### 2. Monitor Query Performance
Set up query performance monitoring:

**Enable pg_stat_statements Extension:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**Monitor Slow Queries:**
```sql
SELECT 
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time,
  query
FROM pg_stat_statements
WHERE 
  calls > 50
  AND mean_exec_time > 10  -- queries >10ms average
  AND query NOT LIKE '%pg_stat%'
ORDER BY total_exec_time DESC
LIMIT 20;
```

### 3. Verify RLS Performance
If you plan to use Supabase client directly (not just Prisma):
- Test RLS policies with actual user sessions
- Monitor RLS policy evaluation overhead
- Add indexes on columns used in RLS policies if needed

---

## Medium Priority Actions (Next Month)

### 1. Review and Clean Up Unused Indexes
After monitoring index usage for 2 weeks:

**Before Removing:**
- Verify index is truly unused (no scans)
- Check if index might be needed for future features
- Consider if index is small enough to keep "just in case"

**Indexes to Review:**
- 20+ potentially unused indexes identified in optimization report
- See `docs/DATABASE_OPTIMIZATION_REPORT.md` section 6 for full list

**If Removing:**
```sql
-- Example: Remove unused index (only after confirming it's unused)
DROP INDEX IF EXISTS "Quiz_sport_idx";
```

### 2. Consider Additional Optimizations

#### A. BRIN Indexes for Time-Series Data
For tables that grow rapidly over time:
- `QuizAttempt.completedAt` (if table grows beyond 1M rows)
- `Notification.createdAt` (if high write volume)
- `UserAnswer.createdAt` (if rapid growth)

**When to Add:**
- Monitor table sizes monthly
- Add BRIN indexes when tables exceed 500K-1M rows
- BRIN indexes are smaller and faster for time-series data

#### B. Materialized Views for Aggregated Data
For frequently accessed aggregated queries:
- Quiz filter options (sports, tags, topics)
- Leaderboard aggregations
- User statistics summaries

**Example:**
```sql
CREATE MATERIALIZED VIEW quiz_filter_options AS
SELECT DISTINCT sport
FROM "Quiz"
WHERE "isPublished" = true AND status = 'PUBLISHED' AND sport IS NOT NULL;

CREATE INDEX ON quiz_filter_options (sport);
```

Refresh periodically or on quiz updates.

### 3. Implement Query Result Caching
For frequently accessed, rarely-changing data:
- Topic hierarchies (already has in-memory cache - good!)
- Quiz filter options
- Badge definitions
- Level/Tier configurations

**Options:**
- Redis for application-level caching
- HTTP caching headers for API responses
- CDN caching for public data

---

## Long-Term Actions (Ongoing)

### 1. Regular Database Maintenance

**Weekly:**
- Review unused indexes
- Check index bloat

**Monthly:**
- Run ANALYZE on large tables:
  ```sql
  ANALYZE "Quiz";
  ANALYZE "QuizAttempt";
  ANALYZE "Question";
  ```
- Review slow query logs
- Check index usage statistics

**Quarterly:**
- Full database performance review
- Optimize slow queries
- Review and adjust indexes based on actual usage patterns

### 2. Performance Monitoring Setup

**Recommended Tools:**
- Supabase Dashboard - Built-in performance metrics
- pg_stat_statements - Query-level statistics
- Application-level monitoring (e.g., Datadog, New Relic)
- Custom dashboards for key metrics

**Key Metrics to Track:**
- Average query execution time
- P95/P99 query latency
- Index usage rates
- Cache hit rates
- Connection pool utilization

### 3. Continuous Optimization

**As Data Grows:**
- Monitor table sizes and growth rates
- Add indexes when queries start slowing down
- Consider partitioning for very large tables (1M+ rows)
- Review and optimize queries based on actual usage

**After Feature Additions:**
- Analyze new query patterns
- Add indexes for new common queries
- Optimize new code for performance

---

## Testing Checklist

Before considering this complete, verify:

### Functionality Tests
- [ ] Quiz listing with filters works correctly
- [ ] Topic search returns relevant results
- [ ] Daily quiz streaks calculate correctly
- [ ] User quiz attempts load properly
- [ ] Notifications appear correctly
- [ ] Admin operations work (Prisma service role access)
- [ ] User authentication still works
- [ ] All API endpoints function normally

### Performance Tests
- [ ] Topic search is faster than before
- [ ] Daily quiz loading doesn't show N+1 issues
- [ ] Query execution times are acceptable
- [ ] No errors in application logs

### Security Verification
- [ ] RLS policies don't break existing functionality
- [ ] Service role can still access data (Prisma)
- [ ] Direct database access is restricted (if tested)

---

## Rollback Plan (If Needed)

If issues arise:

1. **Rollback Migrations (if critical):**
   ```sql
   -- Disable RLS (emergency only)
   ALTER TABLE "TableName" DISABLE ROW LEVEL SECURITY;
   ```

2. **Revert Code Changes:**
   ```bash
   git revert <commit-hash>
   # Revert to previous query patterns if needed
   ```

3. **Drop New Indexes (if causing issues):**
   ```sql
   DROP INDEX IF EXISTS "IndexName";
   ```

**Note:** Most changes are additive (indexes, RLS policies), so rollback is straightforward.

---

## Success Criteria

Consider the optimization complete when:

1. ✅ All critical and high-priority issues resolved
2. ✅ Application tested and working correctly
3. ✅ Migrations deployed to production
4. ✅ No performance regressions observed
5. ✅ Index usage monitoring in place
6. ✅ Team trained on new optimizations

---

## Resources

- **Optimization Report:** `docs/DATABASE_OPTIMIZATION_REPORT.md`
- **Verification Report:** `docs/MIGRATION_VERIFICATION_REPORT.md`
- **Supabase Docs:** https://supabase.com/docs/guides/database
- **PostgreSQL Index Docs:** https://www.postgresql.org/docs/current/indexes.html

---

## Questions to Answer Later

1. **RLS Policies:** If using Supabase client directly, do RLS policies need adjustment?
2. **Index Usage:** After 2 weeks, which indexes are actually being used?
3. **Query Performance:** Are there any queries still taking >100ms?
4. **Data Growth:** At what rate are tables growing? When will we need partitioning?
5. **Caching Strategy:** Should we implement Redis for frequently accessed data?

---

**Last Updated:** 2024-11-02  
**Next Review:** After 2 weeks of production usage

