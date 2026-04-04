# Web Performance Optimization — Results

## Changes Applied

### Phase 1: Configuration Fixes

| # | Change | File(s) | Impact |
|---|--------|---------|--------|
| 1 | Enabled Next.js image optimization (removed `unoptimized: true`, added AVIF/WebP formats) | `next.config.ts` | All `<Image>` components now serve optimized, resized, format-converted images |
| 2 | Replaced critters stub with real `critters@0.0.23` package | `package.json`, deleted `vendor/critters/` | Critical CSS inlining now actually works |
| 3 | Added `"sideEffects": false` to package.json | `package.json` | Webpack can now tree-shake unused local exports |

### Phase 2: Asset Optimization

| # | Change | File(s) | Impact |
|---|--------|---------|--------|
| 4 | Created image optimization script + converted 5 images to WebP | `scripts/optimize-static-images.ts`, `public/badges/*.webp`, `public/screenshot-*.webp`, `public/video/grain.webp` | 5 images: 3.6MB → 145KB (96% avg reduction) |
| 5 | Updated all image references to use new WebP files | `app/manifest.ts`, `prisma/seed.ts`, `video/components/QuestionScene.tsx` | Code references point to optimized assets |
| 6 | Created SVG logos and updated all references | `public/logo.svg`, `public/logo-dark.svg`, `app/layout.tsx`, `components/shared/MainNavigation.tsx`, `components/features/onboarding/PreOnboardingFlow.tsx`, `lib/next-seo-config.ts`, `lib/schema-utils.ts`, `video/shorts/ShortsCornerLogo.tsx`, `video/landscape/BrandBug.tsx`, `video/components/CornerLogo.tsx` | Logos: 400KB + 205KB → ~1KB each (99.5% reduction) |
| 7 | Optimized favicon | `public/favicon.ico` | 270KB → 4.2KB (98.4% reduction) |

### Phase 3: Bundle Optimization

| # | Change | File(s) | Impact |
|---|--------|---------|--------|
| 8 | Added `@next/bundle-analyzer` + `analyze` script | `next.config.ts`, `package.json` | Enables `npm run analyze` for ongoing bundle monitoring |
| 9 | Moved Remotion packages to devDependencies | `package.json` | Remotion (69MB) no longer in production bundle |
| 10 | Moved xlsx to devDependencies | `package.json` | xlsx (7.2MB) no longer in production bundle (only used in scripts) |

### Phase 4: Code Splitting & Caching

| # | Change | File(s) | Impact |
|---|--------|---------|--------|
| 11 | Added dynamic import for admin backups page | `app/admin/backups/page.tsx` | BackupsClient code-split from admin page bundle |
| 12 | Fixed leaderboard cache conflict | `app/leaderboard/page.tsx` | Changed `cache: "no-store"` to `next: { revalidate: 300 }` to match page-level revalidate |

## Image Optimization Results

| Image | Before | After | Reduction |
|-------|--------|-------|-----------|
| `basketball-star.png` → `.webp` | 622KB | 5KB | 99.2% |
| `challenger.png` → `.webp` | 594KB | 4KB | 99.4% |
| `screenshot-mobile.png` → `.webp` | 1,593KB | 57KB | 96.4% |
| `screenshot-desktop.png` → `.webp` | 1,434KB | 56KB | 96.1% |
| `grain.png` → `.webp` | 386KB | 23KB | 94.1% |
| `logo.png` → `.svg` | 399KB | ~1KB | 99.7% |
| `logo-dark.png` → `.svg` | 205KB | ~1KB | 99.5% |
| `favicon.ico` (optimized) | 270KB | 4.2KB | 98.4% |
| **Total** | **~3.6MB** | **~152KB** | **~96%** |

## Dependency Changes

| Package | Before | After | Reason |
|---------|--------|-------|--------|
| `critters` | `file:vendor/critters` (stub) | `^0.0.23` (real) | Enable actual CSS optimization |
| `@remotion/*` (4 packages) | dependencies | devDependencies | Only used for video rendering scripts |
| `remotion` | dependencies | devDependencies | Only used for video rendering scripts |
| `xlsx` | dependencies | devDependencies | Only used in `scripts/export-long-questions.ts` |
| `@next/bundle-analyzer` | — | devDependencies (new) | Bundle size monitoring |

## Remaining Recommendations (Not Applied)

These were identified but not implemented due to complexity or risk:

1. **Service Worker runtime caching** — Would add explicit Supabase/API caching strategies to Workbox config
2. **revalidateTag for fine-grained cache invalidation** — Currently uses `revalidatePath` only
3. **Lighthouse audit comparison** — Should be run after deployment to measure real-world impact
4. **Additional dynamic imports** — Some admin pages could benefit from code splitting but require careful testing
5. **WAV → compressed audio** — SFX files could be converted to OGG/MP3 (minor impact)

## How to Verify

```bash
# Run bundle analysis (opens browser with visualization)
npm run analyze

# Run Lighthouse audit
npm run lighthouse:audit

# Build and check output
npm run build

# Optimize any new images
npm run optimize:images
```
