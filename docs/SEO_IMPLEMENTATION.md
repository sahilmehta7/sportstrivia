# SEO Implementation Guide

## Overview

This document outlines the SEO features implemented in the Sports Trivia platform and provides guidance on maintaining and testing SEO settings.

## Implemented Features

### 1. Robots.txt

**Location:** `app/robots.ts`

Dynamic robots.txt file generated using Next.js 15 App Router conventions.

**Configuration:**
- Allows all major search engines (Google, Bing, etc.)
- Disallows the following paths:
  - `/admin/*` - Admin panel
  - `/api/*` - API endpoints
  - `/auth/*` - Authentication pages
  - `/profile/me` - Private user profile
  - `/notifications/*` - User notifications
- Includes sitemap reference

**Access:** Available at `https://sportstrivia.in/robots.txt`

### 2. Dynamic Sitemap

**Location:** `app/sitemap.ts`

Automatically generates XML sitemap for all public pages.

**Included Pages:**
- **Homepage** - Priority: 1.0, Changefreq: daily
- **All Published Quizzes** - Priority: 0.8, Changefreq: weekly
- **All Topics** - Priority: 0.7, Changefreq: weekly
- **Static Pages** - /quizzes, /topics, /leaderboard, /challenges (Priority: 0.6)

**Features:**
- Fetches data dynamically from Prisma
- Includes last modified dates from database
- Automatic updates when content changes

**Access:** Available at `https://sportstrivia.in/sitemap.xml`

### 3. Meta Tags

#### Root Layout (`app/layout.tsx`)
- Site-wide default meta tags
- Open Graph tags with fallbacks
- Twitter Card configuration
- Robots directives for search engines
- Theme color and viewport settings

#### Individual Pages
- **Homepage** (`app/page.tsx`) - Optimized for landing
- **Quizzes** (`app/quizzes/page.tsx`) - Browse and filter
- **Topics** (`app/topics/page.tsx`) - Category exploration
- **Leaderboard** (`app/leaderboard/page.tsx`) - Rankings
- **Topic Details** (`app/topics/[slug]/page.tsx`) - Dynamic per topic
- **Quiz Details** (`app/quizzes/[slug]/page.tsx`) - Dynamic per quiz

Each page includes:
- Unique title and description
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URLs
- Relevant keywords

### 4. Structured Data (JSON-LD)

Implemented using `next-seo` library with Schema.org markup:

- **OrganizationJsonLd** - Company/platform information (root layout)
- **WebSiteJsonLd** - Site-wide info with search functionality (root layout)
- **ArticleJsonLd** - Educational content markup for quizzes (quiz detail pages)
- **AggregateRatingJsonLd** - Quiz ratings and reviews (quiz detail pages)
- **BreadcrumbJsonLd** - Navigation structure (breadcrumbs component, topic pages)
- **ItemListJsonLd** - List of quizzes/topics (quiz listing pages, topic pages)
- **PersonJsonLd** - User profiles (profile pages)

**Library:** `next-seo` - Pre-built React components for structured data
**Configuration:** `lib/next-seo-config.ts` - Centralized SEO defaults
**Utilities:** `lib/schema-utils.ts` - Helper functions (legacy, being phased out)

### 5. Canonical URLs

**Helper Function:** `getCanonicalUrl()` in `lib/next-seo-config.ts`

Ensures each page has a single canonical URL to prevent duplicate content issues.

**Usage:**
```typescript
import { getCanonicalUrl } from "@/lib/next-seo-config";

const canonicalUrl = getCanonicalUrl("/quizzes/my-quiz");
```

### 6. Open Graph Tags

**Helper Functions:** `generateOpenGraphTags()` and `generateTwitterCardTags()` in `lib/seo-utils.ts`

Generates consistent OG and Twitter Card tags across the platform.

**Features:**
- og:title, og:description, og:image, og:url, og:type
- og:site_name, og:locale
- og:image:width, og:image:height
- twitter:card, twitter:title, twitter:description, twitter:image
- Fallback default images

### 7. Domain Configuration

**Default Domain:** `sportstrivia.in`

**Environment Variable:** `NEXT_PUBLIC_APP_URL`

Can be configured via environment variables for different environments:
- Development: `http://localhost:3200`
- Production: `https://sportstrivia.in`

## Testing & Verification

### 1. Robots.txt Verification

**Test URL:** `https://sportstrivia.in/robots.txt`

**Expected Output:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /profile/me
Disallow: /notifications/

Sitemap: https://sportstrivia.in/sitemap.xml
```

### 2. Sitemap Verification

**Test URL:** `https://sportstrivia.in/sitemap.xml`

**Tools:**
- XML Sitemap Validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Google Search Console: Submit sitemap directly

**Check for:**
- Valid XML format
- Correct URL structure
- Last modified dates
- Priority and changefreq values

### 3. Meta Tags Testing

**Browser DevTools:**
1. Open page in browser
2. Right-click → Inspect
3. Check `<head>` section for meta tags

**Online Tools:**
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **OpenGraph.xyz:** https://www.opengraph.xyz/

### 4. Structured Data Testing

**Tool:** Google Rich Results Test

**Steps:**
1. Visit https://search.google.com/test/rich-results
2. Enter URL or paste HTML
3. Review detected structured data
4. Fix any errors or warnings

### 5. Mobile-Friendly Testing

**Tool:** Google Mobile-Friendly Test

**URL:** https://search.google.com/test/mobile-friendly

### 6. PageSpeed Insights

**Tool:** Google PageSpeed Insights

**URL:** https://pagespeed.web.dev/

Check performance, accessibility, best practices, and SEO scores.

### 7. Search Console Setup

1. Add property in Google Search Console
2. Verify ownership (HTML file or meta tag)
3. Submit sitemap: `https://sportstrivia.in/sitemap.xml`
4. Monitor indexing status and issues

## Adding Metadata to New Pages

### Example: Adding Metadata to a New Page

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title - Sports Trivia",
  description: "Page description (max 160 characters)",
  keywords: ["keyword1", "keyword2", "keyword3"],
  openGraph: {
    title: "Page Title",
    description: "Page description",
    type: "website",
    url: "/your-page-path",
  },
  twitter: {
    card: "summary_large_image", // or "summary"
    title: "Page Title",
    description: "Page description",
  },
  alternates: {
    canonical: "/your-page-path",
  },
};

export default function YourPage() {
  // Your page content
}
```

### For Dynamic Routes

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch data
  const data = await fetchData(slug);
  
  return {
    title: `${data.title} - Sports Trivia`,
    description: data.description,
    // ... rest of metadata
  };
}
```

### Using next-seo Components

The project uses `next-seo` for structured data (JSON-LD). Components can be used in both Server and Client Components.

**Example: Adding Article Schema to a Quiz Page**

```typescript
import { ArticleJsonLd, AggregateRatingJsonLd, BreadcrumbJsonLd } from "next-seo";
import { getCanonicalUrl } from "@/lib/next-seo-config";

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quiz = await fetchQuiz(slug);
  const quizUrl = getCanonicalUrl(`/quizzes/${slug}`);
  
  return (
    <>
      {/* Page content */}
      <ArticleJsonLd
        url={quizUrl}
        title={quiz.title}
        description={quiz.description}
        images={quiz.image ? [quiz.image] : []}
        datePublished={quiz.createdAt.toISOString()}
        dateModified={quiz.updatedAt.toISOString()}
        authorName="Sports Trivia Team"
        publisherName="Sports Trivia"
      />
      {quiz.rating > 0 && (
        <AggregateRatingJsonLd
          ratingValue={quiz.rating}
          reviewCount={quiz.reviewCount}
          bestRating={5}
          worstRating={1}
        />
      )}
      <BreadcrumbJsonLd
        itemListElements={[
          { position: 1, name: "Home", item: getCanonicalUrl("/") },
          { position: 2, name: "Quizzes", item: getCanonicalUrl("/quizzes") },
          { position: 3, name: quiz.title, item: quizUrl },
        ]}
      />
    </>
  );
}
```

**Available next-seo Components:**

- `OrganizationJsonLd` - Organization information
- `WebSiteJsonLd` - Website with search action
- `ArticleJsonLd` - Article/blog post content
- `BreadcrumbJsonLd` - Navigation breadcrumbs
- `ItemListJsonLd` - Lists of items
- `PersonJsonLd` - Person/user profiles
- `AggregateRatingJsonLd` - Ratings and reviews
- `FAQJsonLd` - FAQ pages

## Best Practices

### 1. Title Tags
- Keep under 60 characters
- Include brand name where appropriate
- Use pipe separator: `Page Title | Sports Trivia`

### 2. Descriptions
- Keep under 160 characters
- Include primary keywords naturally
- Write compelling copy that encourages clicks

### 3. Keywords
- Use 5-10 relevant keywords
- Include long-tail keywords
- Don't stuff keywords

### 4. Images
- Use high-quality images (1200x630 for OG images)
- Optimize file sizes
- Add alt text to all images
- Use descriptive filenames

### 5. URLs
- Use clean, descriptive URLs
- Include keywords in slugs
- Keep URLs short
- Use hyphens to separate words

### 6. Content
- Write unique, valuable content
- Use proper heading hierarchy (H1, H2, H3)
- Include internal links
- Keep content fresh and updated

### 7. Performance
- Optimize images
- Minimize JavaScript
- Use lazy loading
- Enable caching
- Compress files

### 8. Mobile Optimization
- Responsive design
- Touch-friendly buttons
- Fast loading times
- Readable text sizes

## Monitoring & Maintenance

### Regular Tasks

1. **Weekly**
   - Check for broken links
   - Review analytics for 404 errors
   - Monitor search console for issues

2. **Monthly**
   - Update sitemap if structure changes
   - Review and update meta descriptions
   - Check performance scores
   - Review new content for SEO

3. **Quarterly**
   - Audit all pages for metadata
   - Update structured data as needed
   - Review keyword performance
   - Check for duplicate content

### Tools for Ongoing Monitoring

- **Google Search Console** - Search performance, indexing issues
- **Google Analytics** - User behavior, traffic sources
- **PageSpeed Insights** - Performance monitoring
- **Ahrefs or SEMrush** - Keyword tracking and backlinks
- **Schema Markup Validator** - Structured data validation

## Troubleshooting

### Issue: Sitemap not updating

**Solution:** Check database queries in `app/sitemap.ts`. Ensure Prisma connection is working.

### Issue: Meta tags not showing

**Solution:** 
1. Check Next.js metadata API usage
2. Ensure metadata export is correct
3. Clear browser cache and hard refresh

### Issue: Robots.txt not accessible

**Solution:** Verify file is in `app/robots.ts` (not `app/robots.txt`)

### Issue: 404s in Search Console

**Solution:** 
1. Check for broken internal links
2. Set up 301 redirects for moved pages
3. Remove old URLs from sitemap

### Issue: Duplicate content warnings

**Solution:**
1. Ensure canonical URLs are set
2. Use rel="canonical" tags
3. Fix duplicate title/meta descriptions

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

## Questions?

For issues or questions about SEO implementation, contact the development team.
