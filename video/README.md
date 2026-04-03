# YouTube Quiz Video Pipeline

## Commands

- `npm run video:preview`
- `npm run video:metadata -- --quizSlug=<slug>`
- `npm run video:render -- --quizSlug=<slug> --out=./out/<slug>.mp4`
- `npm run video:quick -- --quizSlug=<slug>`
- `npm run video:tts -- --quizSlug=<slug>`

## Input contract

Exactly one source is required:

- `--quizSlug=<slug>` or `--quizId=<id>`

Optional:

- `--questionLimit=<n>`
- `--questionTimeLimitSeconds=<n>` (optional override for all selected questions)
- `--videoFormat=landscape|shorts` (default: `landscape`)
- `--themeVariant=dark|flare|ice` (default: `dark`, shorts-only)
- `--fps=<n>` (default: 30)
- `--showAnswerReveal=<true|false>` (default: true)
- `--seed=<value>` (optional; if omitted, uses deterministic daily seed)
- `--out=<path>` (render only)

## Notes

- Output format can be `landscape` (`1920x1080`) or `shorts` (`1080x1920`).
- Questions are loaded from Prisma with options and correct answer index for reveal.
- Question timer duration follows each question's `timeLimitSeconds` (with quiz/default fallback when needed).
- Logo is fixed at top-right (`public/logo.png`).
- `shorts` uses a dedicated cinematic motion package with theme variants:
  - `dark` (Obsidian Arena)
  - `flare` (Stadium Flare)
  - `ice` (Ice Broadcast)
- Landscape keeps the existing design system.

## Quick Usage

Important npm syntax:
- Always pass script flags after `--`.
- Use `--flag=value` form (not `--flag value`).

Examples:
- `npm run video:quick -- --quizSlug=legends-of-the-ipl-quiz`
- `npm run video:quick -- --quizSlug=legends-of-the-ipl-quiz --questionLimit=8 --showAnswerReveal=false --seed=episode-01`
- `npm run video:quick -- --quizSlug=legends-of-the-ipl-quiz --videoFormat=shorts --questionTimeLimitSeconds=12`
- `npm run video:quick -- --quizSlug=legends-of-the-ipl-quiz --videoFormat=shorts --themeVariant=flare`
- `npm run video:render -- --quizSlug=legends-of-the-ipl-quiz --out=./out/legends.mp4`
- `npm run video:metadata -- --quizSlug=legends-of-the-ipl-quiz --seed=episode-01`

## Quick Start (Fastest Path)

1. Render using a quiz slug with auto-save path and timestamped filename:
   - `npm run video:quick -- --quizSlug=<slug>`
2. Limit questions (for faster drafts):
   - `npm run video:quick -- --quizSlug=<slug> --questionLimit=8`
3. Disable answer reveal:
   - `npm run video:quick -- --quizSlug=<slug> --showAnswerReveal=false`
4. Save to a custom folder:
   - `npm run video:quick -- --quizSlug=<slug> --outputDir=./out/youtube`
5. Set a custom filename:
   - `npm run video:quick -- --quizSlug=<slug> --fileName=barcelona-episode-01.mp4`
6. Render a shorts variant theme:
   - `npm run video:quick -- --quizSlug=<slug> --videoFormat=shorts --themeVariant=flare`

Default quick output folder:
- `./out/videos/YYYY-MM-DD/`

Default render output folder (if `--out` is not provided):
- `./out/<quiz-slug>-youtube-<landscape|shorts>.mp4`

## Batch Reels Rendering

Render the April 2026 social reel plan:

1. Dry run:
   - `npm run video:reels -- --plan=april-2026 --dryRun=true`
2. Render all entries:
   - `npm run video:reels -- --plan=april-2026`
3. Render a subset:
   - `npm run video:reels -- --plan=april-2026 --limit=3`
4. Use a custom output folder:
   - `npm run video:reels -- --plan=april-2026 --outputDir=./out/reels/custom`

## Answer Reveal Behavior

- Options are visible while the countdown runs.
- If `--showAnswerReveal=true`, when timer expires the correct option is highlighted and labeled.
- If `--showAnswerReveal=false`, no answer highlight/label is shown before the next question.

## Optional TTS Voiceover

Generate question voiceovers:

- `npm run video:tts -- --quizSlug=<slug> [--seed=my-seed]`

Defaults:
- model: `gpt-4o-mini-tts`
- voice: `cedar`
- speed: `1.02` (clamped to `0.98`-`1.08` to keep delivery natural)
- style: strong quizmaster instructions (live host tone with controlled dramatic lift and question-ending inflection)

This creates files in:

- `public/video/voiceovers/<quiz-slug>/q-01.mp3`, `q-02.mp3`, etc.
- `public/video/voiceovers/**` is gitignored by default.

If files exist, the video auto-plays them per question. If missing, video renders without voiceover.

## Seeded Selection (TTS + Render Consistency)

- Question selection is seed-based.
- If `--seed` is provided, both `video:tts` and `video:render` will use the same question set/order.
- If `--seed` is omitted, a deterministic daily seed is used:
  - `daily:<quiz-slug-or-id>:<IST-YYYY-MM-DD>`
- For cross-day reproducibility, always pass an explicit `--seed`.

## Troubleshooting

1. `DATABASE_URL or DIRECT_URL environment variable is not defined`
- Video commands load quiz data from Prisma.
- Add `DATABASE_URL` or `DIRECT_URL` in `.env`/`.env.local`.

2. `npm warn Unknown cli config "--quizSlug"`
- This happens when running without the npm delimiter.
- Use: `npm run video:quick -- --quizSlug=<slug>`.

3. `sh: remotion: command not found`
- Use `npm run video:preview` (already uses `npx remotion ...`).
- If dependencies are missing, run `npm install`.
