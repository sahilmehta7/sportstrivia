# Google Play Release Asset Review Checklist

Last updated: 2026-03-06
Version: v1.1

## 1) Completeness
- [ ] Metadata file present and approved (`metadata.en-US.md`)
- [ ] Feature graphic present (`assets/play-store/feature-graphic/feature-graphic-1024x500.png`)
- [ ] App icon present (`assets/play-store/icon/app-icon-512x512.png`)
- [ ] Phone screenshot set present (`assets/play-store/screenshots/phone/`)
- [ ] Raw screenshot set present (`assets/play-store/screenshots/phone/raw/`)
- [ ] Naming convention matches manifest

## 2) Visual Quality
- [ ] Consistent framing and spacing across screenshots
- [ ] No clipped headline/primary text
- [ ] Focal element is obvious within 2 seconds for each shot
- [ ] Screenshots represent actual in-app UI (no fabricated flows)
- [ ] Brand style is consistent (color, type, tone)
- [ ] Overlay text is readable on small displays

## 3) Policy & Copy QA
- [ ] Metadata fits character limits
- [ ] No prohibited or unverifiable claims
- [ ] Privacy/trust claims align with implemented behavior
- [ ] No misleading or non-functional UI in screenshots

## 4) Technical Validation
- [ ] `npm run play:assets:qa` passes
- [ ] `npm run play:assets:validate` passes
- [ ] Capture report generated (`docs/release/play-store/screenshot-capture-report.json`)
- [ ] All required image formats/dimensions are valid

## 5) Production Capture Runtime
- [ ] Final capture run used production runtime (`npm run play:assets:capture:prod`)
- [ ] Authenticated seeded user flow works in production capture
- [ ] No dev-only overlays/tooling artifacts appear in final screenshots

## 6) Iteration Log
- [ ] Pass 1 completed
- [ ] Pass 2 completed (if needed)
- [ ] Pass 3 completed (if needed)
- [ ] Final pass marked "submission-ready"

## 7) Sign-off

| Role | Name | Date | Status | Notes |
|------|------|------|--------|-------|
| Product |  |  | ⬜ Pending |  |
| Design |  |  | ⬜ Pending |  |
| QA |  |  | ⬜ Pending |  |
| Release |  |  | ⬜ Pending |  |

## 8) Post-Release Tracking Setup
- [ ] Listing conversion baseline captured
- [ ] Install rate by impression tracked
- [ ] A/B test backlog created for icon/screenshot variants
