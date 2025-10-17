# Structured Data & Schema.org Implementation

## Overview
Comprehensive schema.org structured data (JSON-LD) implementation across the platform to improve SEO, enable rich snippets in search results, and provide better discoverability.

## Benefits

### SEO Improvements
- 🔍 **Better Search Rankings** - Search engines understand content better
- ⭐ **Rich Snippets** - Star ratings, breadcrumbs, and rich results in SERPs
- 📊 **Knowledge Panels** - Potential to appear in Google Knowledge Graph
- 🎯 **Enhanced CTR** - More attractive search results = higher click-through rates
- 📱 **Voice Search** - Better compatibility with voice assistants

### User Experience
- 🧭 **Breadcrumb Navigation** - In search results
- ⏱️ **Quick Answers** - Time estimates visible in search
- ⭐ **Rating Display** - Star ratings shown in search results
- 📝 **Rich Previews** - Better social media sharing

## Implementation

### Core Utility (`lib/schema-utils.ts`)

Central utility file with schema generators for all content types.

#### Available Functions

1. **`getOrganizationSchema()`**
   - Organization identity
   - Logo and branding
   - Social media links
   - Contact information

2. **`getWebSiteSchema()`**
   - Website identity
   - Site-wide search action
   - Search URL template

3. **`getQuizSchema(quiz)`**
   - Quiz as educational content
   - Difficulty level
   - Duration (ISO 8601 format)
   - Aggregate ratings
   - Subject area

4. **`getQuizHowToSchema(quiz)`**
   - Step-by-step instructions
   - Dynamic steps based on quiz features
   - Time requirements
   - Visual guides

5. **`getTopicSchema(topic, quizCount)`**
   - CollectionPage type
   - Topic hierarchy
   - Number of items
   - Parent relationships

6. **`getBreadcrumbSchema(items)`**
   - BreadcrumbList
   - Navigation hierarchy
   - Position-based ordering

7. **`getPersonSchema(user)`**
   - User profile as Person
   - Name, image, bio
   - Identifier

8. **`getReviewSchema(review, quizTitle)`**
   - Individual review
   - Rating value
   - Author information
   - Review body

9. **`getFAQSchema(faqs)`**
   - FAQ page structure
   - Question/Answer pairs
   - For help/documentation pages

10. **`getItemListSchema(items, listName)`**
    - List of quizzes
    - Position-based ordering
    - Images and descriptions

## Page-by-Page Implementation

### 1. Root Layout (`app/layout.tsx`)

**Schemas Added:**
- ✅ **Organization** - Platform identity
- ✅ **WebSite** - Search functionality

**Impact:**
- Appears once on every page
- Establishes site-wide identity
- Enables site search in Google

**Code:**
```typescript
const organizationSchema = getOrganizationSchema();
const websiteSchema = getWebSiteSchema();

// Added to <body>
<script type="application/ld+json">
  {JSON.stringify(organizationSchema)}
</script>
<script type="application/ld+json">
  {JSON.stringify(websiteSchema)}
</script>
```

### 2. Quiz Detail Page (`app/quizzes/[slug]/page.tsx`)

**Schemas Added:**
- ✅ **Quiz** - Educational content with ratings
- ✅ **HowTo** - Step-by-step instructions
- ✅ **BreadcrumbList** - Navigation path

**Impact:**
- Rich snippets with ratings in search results
- Step-by-step guide display
- Breadcrumb navigation in SERPs
- Enhanced knowledge graph data

**Breadcrumb Path:**
```
Home → Quizzes → [Quiz Title]
```

**Dynamic HowTo Steps:**
- Based on quiz configuration
- Shows time limits if enabled
- Shows penalties if enabled
- Shows bonuses if enabled

### 3. Topic Page (`app/topics/[slug]/page.tsx`)

**Schemas Added:**
- ✅ **CollectionPage** - Topic as collection
- ✅ **BreadcrumbList** - Navigation with parent
- ✅ **ItemList** - List of quizzes in topic

**Impact:**
- Topic pages appear as collections
- Hierarchical navigation visible
- Quiz listings enhanced

**Breadcrumb Path:**
```
Home → [Parent Topic] → [Current Topic]
```

### 4. Profile Page (`app/profile/me/page.tsx`)

**Schemas Added:**
- ✅ **Person** - User profile

**Impact:**
- User profiles recognized as people
- Better social graph understanding
- Potential for profile cards in search

### 5. Quiz Listing Page (`app/quizzes/page.tsx`)

**Schemas Already Present:**
- ✅ **ItemList** - All quizzes

**Enhanced With:**
- Position-based ordering
- Images and descriptions
- Proper URLs

### 6. Breadcrumbs Component (`components/shared/Breadcrumbs.tsx`)

**Reusable Component:**
- Visual breadcrumbs with links
- Automatic schema generation
- Home icon support
- Customizable styling

**Usage:**
```typescript
<Breadcrumbs
  items={[
    { name: "Quizzes", url: "/quizzes" },
    { name: "NBA Quiz" }
  ]}
/>
```

## Schema Types Reference

### Quiz Schema Fields
```json
{
  "@type": "Quiz",
  "name": "Quiz Title",
  "description": "Quiz description",
  "url": "https://...",
  "image": "cover-image-url",
  "educationalLevel": "MEDIUM",
  "timeRequired": "PT10M",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": 10
  }
}
```

### HowTo Schema Fields
```json
{
  "@type": "HowTo",
  "name": "How to Play...",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Step name",
      "text": "Step description",
      "position": 1
    }
  ]
}
```

### BreadcrumbList Schema
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://..."
    }
  ]
}
```

## Testing

### Google Rich Results Test
1. Visit: https://search.google.com/test/rich-results
2. Enter your page URL
3. Verify structured data is detected
4. Check for warnings/errors

### Schema Validator
1. Visit: https://validator.schema.org/
2. Paste page HTML or URL
3. Verify all schemas are valid
4. Check relationships

### Search Console
1. Google Search Console → Enhancements
2. Monitor rich result performance
3. Check for structured data errors
4. Track impressions/clicks

## Expected Rich Results

### Quiz Pages
- ✅ Breadcrumb navigation
- ✅ Star ratings (⭐⭐⭐⭐⭐ 4.5 - 10 reviews)
- ✅ "HowTo" expandable section
- ✅ Time estimate (⏱️ 10 min)
- ✅ Difficulty level

### Topic Pages
- ✅ Breadcrumbs with hierarchy
- ✅ Collection indication
- ✅ Item count

### Search Results
```
Sports Trivia Platform
https://sportstrivia.com › quizzes › nba-quiz
Home › Quizzes › NBA History Quiz
⭐⭐⭐⭐⭐ 4.8 - 25 reviews
Test your NBA knowledge with this challenging quiz.
Difficulty: Hard · Duration: 15 min
```

## Best Practices

### General
- ✅ Use specific types (Quiz, not just Article)
- ✅ Include images where available
- ✅ Add aggregate ratings when present
- ✅ Use ISO 8601 for dates/times
- ✅ Provide unique @id for each item
- ✅ Link related entities

### Validation
- ✅ All required properties included
- ✅ URLs are absolute (not relative)
- ✅ Images use full URLs
- ✅ Dates in proper format
- ✅ No duplicate schemas on same page

### Performance
- ✅ Generated server-side (no client load)
- ✅ Minimal overhead (just JSON)
- ✅ Cached with page content
- ✅ No external dependencies

## Monitoring

### Key Metrics to Track
1. **Rich Result Impressions** - How often rich results show
2. **CTR Improvement** - Click-through rate increase
3. **Schema Errors** - Monitor in Search Console
4. **Coverage** - Percentage of pages with schema
5. **Validation Status** - All schemas valid

### Tools
- Google Search Console
- Bing Webmaster Tools
- Schema.org Validator
- Rich Results Test
- Google Structured Data Testing Tool (legacy)

## Future Enhancements

### Additional Schema Types

#### Event Schema
- For scheduled/timed quizzes
- Live quiz events
- Tournament dates

#### Course Schema
- Multi-quiz learning paths
- Progressive difficulty
- Prerequisites

#### VideoObject Schema
- Quiz tutorial videos
- Explanation videos
- Preview content

#### Review Aggregation
- Individual review schemas
- Review snippets in search
- Verified reviews

### Advanced Features

#### FAQ Schema
- Add to help/support pages
- Common quiz questions
- Platform usage guides

#### SiteNavigationElement
- Main menu structure
- Category organization
- Search shortcuts

#### Speakable
- Content optimized for voice assistants
- Quiz questions for smart speakers
- Voice-friendly descriptions

## Validation Checklist

- [ ] All schemas have `@context` and `@type`
- [ ] URLs are absolute, not relative
- [ ] Images use full URLs with protocol
- [ ] Dates in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
- [ ] Required properties present for each type
- [ ] No orphaned or incomplete schemas
- [ ] Breadcrumbs match actual navigation
- [ ] Ratings only added when reviews exist
- [ ] Person identifiers are unique
- [ ] ItemList positions are sequential

## Code Examples

### Adding Schema to New Page

```typescript
// 1. Import utilities
import { getBreadcrumbSchema, getQuizSchema } from "@/lib/schema-utils";

// 2. Generate schema data
const breadcrumbs = getBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Page" }
]);

// 3. Add to page return
return (
  <main>
    {/* Your content */}
    
    {/* Structured Data */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
    />
  </main>
);
```

### Using Breadcrumbs Component

```typescript
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

<Breadcrumbs
  items={[
    { name: "Quizzes", url: "/quizzes" },
    { name: "Basketball", url: "/topics/basketball" },
    { name: "NBA Quiz" }
  ]}
/>
```

## Resources

- [Schema.org](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Specification](https://json-ld.org/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

## Migration Notes

- No breaking changes
- Purely additive feature
- Works with existing pages
- No database changes needed
- Zero performance impact
- Backward compatible

## Summary

All major pages now have comprehensive structured data:
- ✅ Root Layout - Organization + WebSite
- ✅ Quiz Detail - Quiz + HowTo + Breadcrumbs
- ✅ Topic Pages - CollectionPage + Breadcrumbs + ItemList
- ✅ Profile Pages - Person
- ✅ Quiz Listings - ItemList (already existed)
- ✅ Breadcrumbs Component - Reusable with auto-schema

This implementation follows Google's structured data guidelines and should result in rich search results within 1-2 weeks of crawling.

