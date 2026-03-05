# PWA Builder Consolidated Audit Report

Date: 2026-03-05  
Target: `https://www.sportstrivia.in/`  
Source: PWA Builder report card screenshots provided by stakeholder

## Executive Summary

PWA Builder reported multiple manifest and installability issues (icons, screenshots, service worker, and missing manifest `id`).

Codebase review confirms **8 direct manifest/content issues** and **1 deployment/runtime issue likely related to service worker registration/build behavior in production**.

## Findings Mapped to Code

| PWA Builder finding | Status | Evidence in codebase | Root cause |
|---|---|---|---|
| Add a 192x192 PNG icon to your manifest | Confirmed | `app/manifest.ts` only declares `/icon.svg` (`sizes: any`) and `/logo-dark.png` (`sizes: any`) | No explicit `192x192` PNG icon entry |
| Add a 512x512 PNG icon to your manifest | Confirmed | `app/manifest.ts` icons list has no `512x512` entry | No explicit `512x512` PNG icon entry |
| Fix the icon sizes in your web app manifest | Confirmed | `app/manifest.ts` uses `sizes: 'any'` for both icons | PWA Builder expects concrete bitmap sizes for install icons |
| Fix the icon types in your web manifest | Confirmed | `app/manifest.ts` declares `/logo-dark.png` as `image/png`, but `file public/logo-dark.png` shows JPEG content | Declared MIME does not match actual file type |
| Fix the links to your screenshots | Confirmed | `app/manifest.ts` references `/og-image.jpg`; file not found under `public/` | Screenshot path is broken |
| Ensure screenshot type declarations match actual file types | Confirmed | `app/manifest.ts` declares `image/jpeg` for `/og-image.jpg`; file missing | Missing file prevents type validation |
| Ensure screenshot size declarations match actual image dimensions | Confirmed | `app/manifest.ts` declares `1200x630` for `/og-image.jpg`; file missing | Missing file prevents size validation |
| Help browsers and OSes identify your app by adding an id to your manifest | Confirmed | No `id` field in `app/manifest.ts` | Manifest lacks stable app identity |
| Make your app faster and more reliable by adding a service worker | Likely production/runtime issue | `public/sw.js` exists (generated), but app source only explicitly registers `/sw-push.js` in `components/notifications/PushSubscriptionCard.tsx` | `sw.js` may not be registered/active in production context used by PWA Builder (or build/deploy pipeline not emitting PWA registration script consistently) |

## Supporting Evidence (Files)

- Manifest definition: `app/manifest.ts`
- PWA config/plugin: `next.config.ts`
- Push worker registration (only explicit registration found): `components/notifications/PushSubscriptionCard.tsx`
- Generated service worker present in repo: `public/sw.js`
- Icon assets and file-type mismatch:
  - `public/logo-dark.png` (extension `.png`, actual JPEG payload)
  - `public/logo.png` (extension `.png`, actual JPEG payload)

## Prioritized Remediation Plan

### P0 (fix immediately)

1. Add valid install icons to manifest:
   - `192x192` PNG
   - `512x512` PNG
   - Optional `purpose: "maskable"` variant for Android launchers
2. Correct icon MIME/type declarations to match real files.
3. Add `id` to manifest (e.g. `id: "/"` or canonical app ID).
4. Fix screenshot entries:
   - Add real screenshot files under `public/`.
   - Ensure `src`, `type`, and `sizes` exactly match real files.

### P1 (verify production installability)

5. Validate service worker in production:
   - Confirm `https://www.sportstrivia.in/sw.js` returns `200`.
   - Confirm `navigator.serviceWorker.controller` is populated after load.
   - Confirm a registration path for the PWA worker is active on audited pages.
6. Confirm production build path uses configuration compatible with `@ducanh2912/next-pwa` (especially with Next 16 + build/runtime choice).

## Suggested Acceptance Criteria

- PWA Builder no longer reports manifest icon/type/size/screenshot/id issues.
- Browser Application panel shows:
  - Valid manifest with `id`
  - Valid icon set (`192x192`, `512x512`)
  - Screenshot assets resolved successfully
- Service worker is active and controlling scope on `https://www.sportstrivia.in/`.

## Notes

- Current icon files are 1024x1024 but encoded as JPEG while named `.png`; this is likely causing multiple audit failures.
- The current screenshot reference (`/og-image.jpg`) appears to be missing from repository `public/` assets.
