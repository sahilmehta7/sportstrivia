# Performance Improvement Plan

**Generated:** November 25, 2025  
**Based on:** Lighthouse audits of production site (https://www.sportstrivia.in/)  
**Pages Audited:** 9 public pages

## Executive Summary

The Lighthouse audit reveals a strong performance foundation with excellent scores in most categories. The site achieves an average Performance score of 97, Best Practices of 99, Accessibility of 91, and SEO of 80. However, there are specific opportunities for improvement that can further enhance user experience and search engine visibility.

### Overall Scores

| Category | Average Score | Status |
|----------|--------------|--------|
| Performance | 97 | Excellent |
| Accessibility | 91 | Good |
| Best Practices | 99 | Excellent |
| SEO | 80 | Good |

## Top Priority Issues

### 1. Accessibility: Links Without Discernible Names (Critical)
**Impact:** High | **Affected Pages:** 9/9 (100%)

All pages have links that lack accessible names, making navigation difficult for screen reader users.

**Recommendation:**
- Add descriptive text to all links
- Ensure image links have proper `alt` attributes
- Use `aria-label` for icon-only buttons
- Review and fix in: `components/shared/MainNavigation.tsx`, all page components

**Expected Impact:** Improve Accessibility score from 91 to 95+

### 2. Performance: Speed Index on Topics Page (High Priority)
**Impact:** High | **Affected Pages:** 3/9 (topics, quizzes, leaderboard)

The topics page has a Speed Index score of 0.81, indicating slower visual content population. Potential savings of 1,600ms on topics page.

**Recommendation:**
- Optimize initial render by reducing server-side data fetching
- Implement progressive loading for topic cards
- Consider using React Server Components more effectively
- Add skeleton loaders for better perceived performance

**Files to Review:**
- `app/topics/page.tsx`
- `components/topics/TopicsContent.tsx`

**Expected Impact:** Improve Performance score on topics page from 80 to 90+

### 3. SEO: Missing Meta Descriptions (High Priority)
**Impact:** High | **Affected Pages:** 4/9 (leaderboard, quizzes, search, topics)

Several pages lack meta descriptions, which are important for search engine results.

**Recommendation:**
- Add unique meta descriptions to all pages
- Ensure descriptions are 120-160 characters
- Include relevant keywords naturally

**Files to Update:**
- `app/leaderboard/page.tsx`
- `app/quizzes/page.tsx` (already has metadata, verify)
- `app/search/page.tsx`
- `app/topics/page.tsx`

**Expected Impact:** Improve SEO score from 80 to 90+

### 4. Performance: Multiple Page Redirects (Medium Priority)
**Impact:** Medium | **Affected Pages:** 4/9 (challenges, friends, notifications, random-quiz)

Redirects add 230-240ms latency to page loads.

**Recommendation:**
- Review authentication redirects in middleware
- Ensure direct routing to authenticated pages
- Consider using Next.js redirects at build time where possible

**Files to Review:**
- `middleware.ts`
- `app/auth/signin/page.tsx`

**Expected Impact:** Save 230-240ms per page load

### 5. Accessibility: Color Contrast Issues (Medium Priority)
**Impact:** Medium | **Affected Pages:** 7/9

Some text elements don't meet WCAG contrast requirements.

**Recommendation:**
- Audit all color combinations using a contrast checker
- Update Tailwind color classes to meet WCAG AA standards (4.5:1 for normal text)
- Focus on: buttons, links, form labels, and body text

**Files to Review:**
- `app/globals.css`
- `tailwind.config.ts`
- All component files using custom colors

**Expected Impact:** Improve Accessibility score from 91 to 94+

### 6. Performance: Unused CSS (Medium Priority)
**Impact:** Medium | **Affected Pages:** 9/9 (100%)

Average of 18KB of unused CSS per page.

**Recommendation:**
- Use PurgeCSS or similar tool to remove unused Tailwind classes
- Review and remove unused CSS modules
- Consider CSS-in-JS for component-specific styles
- Enable Next.js CSS optimization

**Implementation:**
```typescript
// next.config.ts
const nextConfig = {
  // ... existing config
  experimental: {
    optimizeCss: true,
  },
};
```

**Expected Impact:** Reduce page weight by ~18KB per page

### 7. Performance: Legacy JavaScript (Low Priority)
**Impact:** Low | **Affected Pages:** 9/9 (100%)

Average of 11KB of legacy JavaScript (polyfills/transpiled code) that may not be needed for modern browsers.

**Recommendation:**
- Review browser support requirements
- Update build configuration to target modern browsers
- Use `browserslist` to define supported browsers
- Consider removing unnecessary polyfills

**Files to Review:**
- `package.json` (browserslist configuration)
- `tsconfig.json` (target/module settings)
- Build configuration

**Expected Impact:** Reduce JavaScript bundle size by ~11KB

### 8. Performance: Layout Shifts on Topics Page (High Priority)
**Impact:** High | **Affected Pages:** 1/9 (topics)

The topics page has a Cumulative Layout Shift (CLS) score of 0.28, which is above the "good" threshold of 0.1.

**Recommendation:**
- Add explicit width/height to images
- Reserve space for dynamically loaded content
- Avoid inserting content above existing content
- Use CSS aspect-ratio for responsive images

**Files to Review:**
- `components/topics/TopicsContent.tsx`
- Image components used in topic cards

**Expected Impact:** Improve CLS score to <0.1, improving Performance score

### 9. SEO: Pages Blocked from Indexing (High Priority)
**Impact:** High | **Affected Pages:** 4/9 (challenges, friends, notifications, random-quiz)

Some pages are blocked from search engine indexing, likely due to authentication requirements.

**Recommendation:**
- Review robots.txt configuration
- Ensure authenticated pages have proper meta robots tags
- Consider making some content publicly accessible for SEO
- Add proper canonical URLs

**Files to Review:**
- `app/robots.ts`
- Page metadata for authenticated routes

**Expected Impact:** Improve SEO score and search visibility

### 10. Best Practices: Console Errors (Medium Priority)
**Impact:** Medium | **Affected Pages:** 3/9 (home, leaderboard, quizzes)

Browser console errors indicate unresolved problems.

**Recommendation:**
- Review browser console for specific errors
- Fix JavaScript errors in production
- Remove debug console.log statements
- Handle API errors gracefully

**Expected Impact:** Improve Best Practices score from 99 to 100

## Performance Opportunities

### Top Opportunities by Potential Savings

1. **Speed Index Optimization** (Topics page)
   - Potential Savings: 1,600ms
   - Priority: High
   - Implementation: Optimize initial render, progressive loading

2. **Eliminate Redirects**
   - Potential Savings: 230-240ms per page
   - Priority: Medium
   - Implementation: Review authentication flow

3. **Document Request Latency**
   - Potential Savings: 60-580ms
   - Priority: Medium
   - Implementation: Optimize server response, enable compression

4. **Reduce Unused CSS**
   - Potential Savings: 18KB per page
   - Priority: Medium
   - Implementation: CSS optimization, PurgeCSS

5. **Reduce Legacy JavaScript**
   - Potential Savings: 11KB per page
   - Priority: Low
   - Implementation: Update build targets

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks)
1. Add meta descriptions to all pages
2. Fix link accessibility issues (add aria-labels)
3. Fix color contrast issues
4. Remove console errors

**Expected Impact:**
- SEO: 80 → 90+
- Accessibility: 91 → 94+
- Best Practices: 99 → 100

### Phase 2: Performance Optimizations (2-4 weeks)
1. Optimize topics page (Speed Index, CLS)
2. Eliminate unnecessary redirects
3. Reduce unused CSS
4. Optimize document request latency

**Expected Impact:**
- Performance: 97 → 98-99
- Topics page Performance: 80 → 90+

### Phase 3: Advanced Optimizations (4-6 weeks)
1. Reduce legacy JavaScript
2. Implement advanced caching strategies
3. Further optimize render-blocking resources
4. Improve network dependency tree

**Expected Impact:**
- Further bundle size reduction
- Improved Time to Interactive (TTI)

## Specific Code Recommendations

### 1. Add Meta Descriptions

```typescript
// app/leaderboard/page.tsx
export const metadata: Metadata = {
  title: "Leaderboard",
  description: "View global and topic-specific leaderboards. Compete with players worldwide and track your ranking in sports trivia.",
  // ... rest of metadata
};
```

### 2. Fix Link Accessibility

```typescript
// Example: Add aria-label to icon-only links
<Link href="/quizzes" aria-label="Browse quizzes">
  <Icon />
</Link>
```

### 3. Optimize Topics Page Loading

```typescript
// app/topics/page.tsx
// Consider splitting data fetching
const [featuredTopics, allTopics] = await Promise.all([
  getFeaturedTopics(6),
  getRootTopics(),
]);

// Add Suspense boundaries for progressive loading
```

### 4. Fix Layout Shifts

```typescript
// Add explicit dimensions to images
<Image
  src={imageUrl}
  width={400}
  height={300}
  alt={description}
  className="aspect-video"
/>
```

### 5. Enable CSS Optimization

```typescript
// next.config.ts
const nextConfig = {
  // ... existing config
  experimental: {
    optimizeCss: true,
  },
};
```

## Monitoring and Validation

### Metrics to Track

1. **Performance Metrics**
   - Largest Contentful Paint (LCP): Target < 2.5s
   - First Input Delay (FID): Target < 100ms
   - Cumulative Layout Shift (CLS): Target < 0.1
   - Speed Index: Target < 3.4s

2. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader compatibility
   - Keyboard navigation

3. **SEO**
   - Search engine indexing status
   - Meta description coverage
   - Structured data validation

### Re-audit Schedule

- After Phase 1: 1 week
- After Phase 2: 2 weeks
- After Phase 3: 1 month
- Ongoing: Monthly audits

## Expected Overall Impact

After implementing all recommendations:

| Category | Current | Target | Improvement |
|----------|---------|--------|-------------|
| Performance | 97 | 99 | +2 points |
| Accessibility | 91 | 96 | +5 points |
| Best Practices | 99 | 100 | +1 point |
| SEO | 80 | 95 | +15 points |

**Overall Lighthouse Score:** Current ~92 → Target ~97

## Notes

- The site already performs exceptionally well in most areas
- Focus should be on accessibility and SEO improvements for maximum impact
- Performance optimizations will provide incremental improvements
- All recommendations are based on Lighthouse v13.0.1 audit results
- Individual page reports are available in `lighthouse-reports/production/`

## References

- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)

