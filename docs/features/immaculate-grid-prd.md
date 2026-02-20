# PRD: Immaculate Grid Quiz Mode (3×3) + Fuzzy Fill-in Answers + Rarity Scoring

Product: `sportstrivia-2` (Next.js App Router + Prisma/Postgres + shadcn/ui)\
Theme: **Minimalist Athletic Pro** (high-contrast, sharp corners, navy + winner’s gold accents; see `app/globals.css` + `lib/showcase-theme.ts`)

---

## 1) Goal

Add a new quiz format inspired by “Immaculate Grid”:

- Users see a **3×3 grid** with **column labels** (X axis) and **row labels** (Y axis).
- Each cell requires typing a **player name** that matches the cell’s constraint.
- Answers are validated against an **admin-defined accepted list** (no external roster/career logic).
- Score includes **rarity bonus**: rarer correct answers yield more points.

Also establish a foundation to add other typed-answer quizzes later (e.g., “players who won both Wimbledon and French Open”).

---

## 2) Non-goals (MVP)

- No autocomplete, suggestions, or dropdown hints.
- No external sports datasets, no “played for both” inference; accepted answers are authoritative.
- No user-generated answer acceptance, moderation, or crowdsourcing flow in MVP.
- No real-time multiplayer or live shared grids.

---

## 3) Personas & Use Cases

### Player (consumer)

- Plays grid quizzes for major matchups/derbies or evergreen challenges.
- Wants instant feedback per cell, visible progress, and a satisfying results summary.

### Admin (content creator)

- Creates grid quizzes quickly for events (IPL matches, derbies) or evergreen.
- Defines axis labels and accepted answers per cell (including variants).
- Optionally configures: time window, base points, rarity weight, fuzzy threshold.

---

## 4) Success Metrics

- Grid quiz completion rate (start → finish).
- Median time-to-first-correct cell.
- Distribution of rarity scores (should not be dominated by a few answers).
- Replay rate (attempts per user per grid quiz, within configured limits).

---

## 5) Core Product Decisions (locked)

- **Fuzzy matching enabled** (tunable threshold), but **no suggestions/autocomplete**.
- Valid answers = **admin-defined accepted options only**.
- Grid quizzes can be evergreen, time-windowed, or single-day (via existing quiz scheduling fields).

---

## 6) UX/UI Requirements (Minimal Athletic Pro)

### 6.1 Visual Design System (must match existing theme)

Use existing tokens/classes:

- Sharp corners: `--radius` (small), `rounded-sm` / `rounded-md` (avoid overly round).
- Shadows: `shadow-athletic` where “raised” emphasis is needed.
- Palette: `--primary` (deep navy), `--accent` (winner’s gold), clean surfaces.
- Typography: **Barlow Condensed** for headlines (already used in quiz UI), uppercase/condensed athletic vibe; body font is current sans.
- Gradients: only subtle editorial (use `getGradientText("editorial")` where appropriate).
- Motion: 150–300ms transitions; respect `prefers-reduced-motion`.

### 6.2 Player Flow (Grid Play)

Route: `GET /quizzes/[slug]/play` (same entry point as standard quizzes)

**Layout (desktop)**

- Header row:
  - Left: quiz title + “GRID” badge
  - Right: score summary chip + attempts remaining (if enabled)
- Grid container:
  - 4×4 layout visually: top-left corner is blank/branding; 3 column headers + 3 row headers + 9 cells.
  - Headers: bold, uppercase, high contrast, fixed height.
  - Cells: consistent square-ish tiles, strong border, subtle hover highlight.

**Layout (mobile)**

- Sticky header with title + score.
- Grid scrolls horizontally if needed, but prefer a responsive 3×3 that fits:
  - Compact headers
  - Cell tap opens an **input sheet/modal** (best for mobile typing accuracy).
- Must avoid tiny touch targets (<44px).

### 6.3 Cell Interaction Rules

Each cell has states:

- `empty` → user can open input
- `locked_correct` → shows player name + rarity badge + points
- `locked_wrong` → shows “X” / “Incorrect” (no reveal by default) + accepted reveal after completion (see results)
- `disabled` (optional) → if quiz expired or attempt completed

**Cell input UI**

- On click/tap: open an inline input (desktop) or modal sheet (mobile).
- Input has:
  - Label: “ROW TEAM × COL TEAM”
  - Single text field
  - Primary button: “Lock in”
  - Secondary: “Cancel”
- No suggestions, no autocomplete dropdown, no “did you mean”.

**Feedback**

- On submit:
  - If correct: cell flips to success styling (`success` color hint + gold accent for rarity).
  - If wrong: cell flips to error styling (destructive) and locks.
- Show subtle microcopy on wrong: “Not in accepted list.”

### 6.4 Results Screen (Grid)

Route: reuse existing results route structure if possible: `/quizzes/[slug]/results/[attemptId]`

Results must show:

- Final grid with all cell outcomes.
- Per-cell:
  - Your answer (even if wrong)
  - Correct accepted answers list (or “sample accepted answers”) revealed only after completion.
  - Rarity % and bonus points for correct cells
- Summary:
  - Total correct (0–9)
  - Total score
  - “Rarest correct pick” highlight

---

## 7) Game Rules & Scoring

### 7.1 Attempts per cell

Default: **1 guess per cell** (classic immaculate feel).\
Configurable later, but MVP assumes lock-on-submit.

### 7.2 Base Points

Per cell:

- `basePoints` default: 100 (configurable per quiz or per cell later)
- Correct: earns basePoints + rarityBonus
- Wrong: 0 (no negative marking in MVP grid mode)

### 7.3 Rarity Bonus (data-driven, authoritative answers)

Rarity is computed from **aggregate correct submissions** per grid cell question.

Definitions (per `questionId`):

- `totalCorrect` = count of correct submissions (across all users/attempts)
- `answerCorrectCount(answer)` = correct submissions matching that normalized answer

Rarity score for an answer:

- `rarity = 1 - (answerCorrectCount / totalCorrect)`

Smoothing (important early):

- Use Laplace smoothing:
  - `rarity = 1 - ((answerCorrectCount + 1) / (totalCorrect + K))`
  - Choose `K = numberOfAcceptedAnswers` (or a fixed small constant like 10)
- Clamp rarity to `[0, 0.95]` to avoid extreme bonuses.

Bonus points:

- `rarityBonus = round(basePoints * rarityWeight * rarity)`
- `rarityWeight` default: `1.0` (configurable per quiz)
- `cellTotal = basePoints + rarityBonus`

Display rarity as:

- “Rarity: 7%” meaning roughly `answerCorrectCount / totalCorrect` (or “Picked by 7%”)

---

## 8) Fuzzy Matching Spec (no suggestions)

### 8.1 Normalization (apply to both typed input and accepted answers)

- trim
- collapse internal whitespace
- lowercase
- strip punctuation/symbols (`.,'’"-()` etc.)
- optionally remove accents/diacritics (recommended)

### 8.2 Fuzzy similarity

- Use a deterministic string similarity method (e.g., Jaro-Winkler or normalized Levenshtein).
- Hard constraints:
  - Minimum input length: 3 (configurable)
  - Similarity threshold default: 0.90 (configurable per quiz)
- Match policy:
  - Compute similarity against **all accepted answers** for the cell.
  - If max similarity ≥ threshold → accept and bind to the best-matching accepted answer.
  - Otherwise reject.

### 8.3 Security/abuse constraints

- Rate limit submissions per attempt (grid has max 9 submissions anyway).
- Store raw typed input for audit/debugging (even wrong guesses).

---

## 9) Data Model Requirements (Prisma)

### 9.1 Add Quiz play mode + config

Add to `Quiz`:

- `playMode` (enum): `STANDARD`, `GRID_3X3`
- `playConfig` (Json, nullable): stores grid axes + scoring config

Example `playConfig` (MVP):

```json
{
  "grid": {
    "rows": ["Team A", "Team B", "Team C"],
    "cols": ["Team D", "Team E", "Team F"]
  },
  "gridScoring": {
    "basePointsPerCell": 100,
    "rarityWeight": 1.0
  },
  "answerMatching": {
    "fuzzyThreshold": 0.9,
    "minLength": 3
  }
}
```

### 9.2 Persist typed answers

Add to `UserAnswer`:

- `textAnswer` String? (raw user input)
- Keep `answerId` optional; for fill-blank correct matches, set `answerId` to the accepted `Answer.id` that was matched.

### 9.3 Rarity stats storage

Add a new model (suggested):

- `QuestionAnswerStat`
  - `id`
  - `questionId`
  - `normalizedAnswer`
  - `correctCount`
  - indexes: `(questionId, normalizedAnswer)` unique

Optionally also store:

- `QuestionStat` with `totalCorrectCount` per question to avoid recomputation (or compute as sum of `QuestionAnswerStat.correctCount`).

---

## 10) Admin Requirements (“Grid Builder”)

### 10.1 Create/Edit Grid Quiz

Admin UI should support:

- Set quiz metadata: title, slug, description, sport, publish window, featured, etc. (reuse existing quiz editor fields).
- Set `playMode = GRID_3X3`.
- Define:
  - Row labels (3)
  - Column labels (3)
- For each of 9 cells:
  - Enter accepted answers (textarea; one per line or comma-separated)
  - (Optional) enter additional variants/aliases

### 10.2 Question generation behind the scenes

When admin saves:

- Create 9 `Question` records with:
  - `type = FILL_BLANK`
  - `questionText` generated consistently, e.g.:
    - `"Played for: {row} AND {col}"`
- Create `Answer` records for each accepted string with:
  - `isCorrect = true`
  - `answerText = acceptedOption`
- Attach to the quiz via `QuizQuestionPool` with `order = 1..9` (cell ordering must be deterministic).

### 10.3 Preview

Admin can preview grid rendering:

- A “Preview” button renders the grid with dummy attempt state (no scoring persistence).

---

## 11) Player API / Server Actions (implementation guidance)

### 11.1 Attempt creation/loading

Reuse existing attempt creation flow for quizzes.

### 11.2 Submit cell answer (new endpoint)

Add an endpoint or server action dedicated to typed answers to avoid bending the multiple-choice payload.

Suggested:

- `POST /api/attempts/[attemptId]/answers/text`

Payload:

```json
{
  "questionId": "…",
  "textAnswer": "user typed string",
  "timeSpent": 12
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "isCorrect": true,
    "matchedAnswerId": "…",
    "matchedAnswerText": "…",
    "rarity": 0.82,
    "basePoints": 100,
    "rarityBonus": 82,
    "totalPoints": 182
  }
}
```

Rules:

- Reject if attempt completed or if that question already answered in this attempt.
- Validate question belongs to the quiz attempt.

### 11.3 Completing the attempt

- Attempt completes when all 9 cells are locked (or user hits “Finish”).
- On completion, compute totals and write `QuizAttempt.totalPoints`, etc., consistent with existing fields.

---

## 12) Analytics (events)

Track:

- `grid_cell_opened` (quizId, cellIndex)
- `grid_cell_submitted` (correct/incorrect, rarityBucket)
- `grid_completed` (correctCount, totalScore)
- `grid_result_shared` (if share exists)

---

## 13) Accessibility Requirements (must)

- Keyboard navigation across cells (tab order matches grid order).
- Visible focus states on cells and buttons.
- Proper labels for inputs (“Row × Column”).
- Contrast meets WCAG 2.1 AA.
- Respect `prefers-reduced-motion`.

---

## 14) Performance Requirements

- Grid UI must render without heavy reflows.
- Avoid loading all accepted answers client-side for gameplay; validation is server-side.
- Results page can load accepted answers per question after completion.

---

## 15) Edge Cases

- Quiz expired mid-play: allow finishing current attempt or lock (define policy; MVP: allow finish if attempt already started).
- Duplicate accepted answers across cells: allowed.
- Two accepted answers very similar (“Smith” vs “Smyth”): fuzzy threshold must avoid false positives; admin can add explicit variants.
- Early low-volume rarity: smoothing must prevent huge bonuses.

---

## 16) Acceptance Criteria (MVP)

1. Admin can create a grid quiz with axes + accepted answers for all 9 cells.
2. Player can play grid quiz at `/quizzes/[slug]/play` and see a 3×3 grid UI matching Minimal Athletic Pro theme.
3. Player can type answers; fuzzy matching validates against accepted list; no suggestions/autocomplete appear.
4. Each cell locks after submission (correct or wrong).
5. Correct cells award base + rarity bonus; totals appear during play and on results.
6. Rarity is computed from aggregate correct submissions with smoothing; displayed as “Picked by X%” (or equivalent).
7. Typed input is persisted (`UserAnswer.textAnswer`), and correct matches bind to an accepted `Answer` record.
8. Results page shows the completed grid and reveals accepted answers post-completion.

---

## 17) Implementation Notes for the Coding Model

- Prefer reusing shadcn/ui components (`Card`, `Button`, `Dialog/Sheet`, `Input`, `Badge`) and theme helpers in `lib/showcase-theme.ts`.
- Keep grid mode isolated via `Quiz.playMode` branching at the play UI layer (don’t fork the entire quiz system).
- Use deterministic cell ordering via `QuizQuestionPool.order` → map to `[0..8]`.

---

## 18) Future Extensions (post-MVP)

- Other typed quizzes (e.g., “won Wimbledon and French Open”) as `FILL_BLANK` single-question quizzes or short sets.
- Configurable `maxGuessesPerCell`.
- Per-cell manual rarity overrides (admin) for low-volume quizzes.
- Optional “reveal after X tries” variants (not default).

