# Google Play Asset Spec Checklist

Last updated: 2026-03-05
Owner: Release engineering

## Source of Truth
- Play Console Help: Graphic assets, screenshots, and videos
  - https://support.google.com/googleplay/android-developer/answer/1078870
- Play Console Help: Create your app listing
  - https://support.google.com/googleplay/android-developer/answer/9859152

> Run a spec drift check before final upload in case Google updates requirements.

## Listing Metadata Limits
- [ ] App name/title <= 30 characters
- [ ] Short description <= 80 characters
- [ ] Full description <= 4000 characters

## App Icon (Required)
- [ ] Exactly 512 x 512 px
- [ ] PNG format
- [ ] 32-bit with alpha
- [ ] Max file size <= 1024 KB
- [ ] No disallowed text/claims

## Feature Graphic (Required)
- [ ] Exactly 1024 x 500 px
- [ ] JPG or 24-bit PNG (no alpha)
- [ ] No key text/elements near edges (safe center composition)
- [ ] No policy-risk wording or unsupported claims

## Phone Screenshots (Required)
- [ ] At least 2 screenshots (recommended: 6-8)
- [ ] 16:9 or 9:16 aspect ratio supported
- [ ] Each side length between 320 px and 3840 px
- [ ] At least one side >= 1080 px
- [ ] JPG or 24-bit PNG (no alpha)
- [ ] Visual sequence follows conversion narrative

## Optional Tablet Screenshots
- [ ] Prepared only if tablet listing strategy is in scope
- [ ] Meet same format and dimension bounds where applicable

## Content/Policy Safety Checks
- [ ] No misleading ranking/superlative claims without evidence
- [ ] No prohibited content in images
- [ ] Text overlays remain legible and truthful
- [ ] Privacy/account controls claims match in-app behavior

## Final Spec Drift Check (Mandatory)
1. [ ] Re-open both source links above on upload day.
2. [ ] Confirm limits/formats unchanged.
3. [ ] Re-run local validator (`node scripts/play-store/validate-assets.mjs`).
4. [ ] Only then upload into Play Console draft listing.
