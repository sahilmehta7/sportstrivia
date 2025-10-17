# Quiz Attempt Limits

Players can now be limited to a defined number of attempts per quiz. This update introduces new data fields, admin controls, and user-facing messaging to make quota enforcement explicit and actionable.

---

## Data Model & Migration

| Field | Type | Notes |
| --- | --- | --- |
| `Quiz.maxAttemptsPerUser` | `Int?` | When `null`, attempts are unlimited. |
| `Quiz.attemptResetPeriod` | `AttemptResetPeriod` enum | `NEVER`, `DAILY`, `WEEKLY`, `MONTHLY`. Defaults to `NEVER`. |

> **Migration command**  
> `npx prisma db push`

After running the migration, regenerate Prisma types with `npx prisma generate` (the command is already executed as part of the deploy workflow).

---

## Admin Experience

- **Attempt Limits card** on create/edit quiz forms:
  - Toggle to enable/disable limits.
  - Numeric input for maximum attempts when enabled.
  - Reset cadence dropdown that is automatically coerced to `NEVER` unless the quiz is recurring.
  - Status badges summarising the current rule and reset cadence.
- **Quiz listing** now shows an “Attempt Cap” column with per-period summary (e.g., `3 attempts / daily`) or “Unlimited” when not configured.

### Validation Rules

- The toggle must be on to submit a positive value.
- `maxAttemptsPerUser` must be ≥ 1 when enabled.
- Reset cadence is forced to `NEVER` when:
  - The limit toggle is off, or
  - The quiz `recurringType` is `NONE`.

---

## API Behaviour

- `/api/attempts` now:
  - Checks limits through a shared helper before creating attempts.
  - Returns `{ attemptLimit: { max, remaining, period, resetAt } }` metadata with every successful start.
- When the limit is exceeded the route throws an `AttemptLimitError` that surfaces:
  ```json
  {
    "error": "Attempt limit reached",
    "code": "ATTEMPT_LIMIT_REACHED",
    "limit": 3,
    "period": "DAILY",
    "resetAt": "2024-05-01T00:00:00.000Z"
  }
  ```

See `__tests__/api/attempts.limit.test.ts` for a payload assertion.

---

## Player Experience

- **Quiz detail page**
  - Start button reads “Attempts Locked” when the user has exhausted their quota.
  - New reusable `AttemptLimitBanner` summarises the rule, remaining attempts, and reset countdown. Anonymous users are prompted to sign in to track usage.
- **Play flow**
  - Banner is displayed throughout the attempt and on the results screen.
  - If a user is already locked when entering `/play`, the banner appears with a friendly message and the primary actions redirect back to quiz browsing.

---

## Testing & QA Checklist

1. Ensure the migration has been executed against the target database: `npx prisma db push`.
2. Run targeted tests:
   ```bash
   npm test -- attempt-limit.service attempts.limit
   ```
3. Manual sanity checks:
   - Start attempts until the limit is met and confirm lockout messaging + countdown.
   - Verify practice mode and challenge flows respect the guard.
   - Switch recurring schedule to confirm dropdown behaviour.

---

## Rollout Notes

- No feature flags are required; the UI is live once deployed.
- Existing quizzes remain unlimited until an admin configures a cap.
- Monitor logs for `ATTEMPT_LIMIT_REACHED` responses to tune copy or defaults if necessary.

