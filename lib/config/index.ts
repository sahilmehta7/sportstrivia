/**
 * Centralized Configuration
 * 
 * This file exports all configuration constants used throughout the application.
 * Centralizing these values makes them easier to find, modify, and maintain.
 */

// Re-export existing config modules
export * from "./gamification";
export { computeQuestionScore } from "../scoring/computeQuestionScore";
export { computeQuizScale } from "../scoring/computeQuizScale";

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

// ============================================================================
// CACHE DURATIONS (in milliseconds)
// ============================================================================

export const CACHE_TTL = {
    /** Topic hierarchy cache - topics change infrequently */
    TOPICS: 30 * 60 * 1000, // 30 minutes

    /** Featured quizzes on home page */
    FEATURED_QUIZZES: 5 * 60 * 1000, // 5 minutes

    /** Leaderboard data - refreshed frequently */
    LEADERBOARD: 1 * 60 * 1000, // 1 minute

    /** User profile stats */
    USER_STATS: 5 * 60 * 1000, // 5 minutes
} as const;

// ============================================================================
// RATE LIMITS
// ============================================================================

export const RATE_LIMITS = {
    /** General API rate limit per IP per minute */
    API: { requests: 200, windowMs: 60000 },

    /** Admin endpoints rate limit */
    ADMIN: { requests: 100, windowMs: 60000 },

    /** Authentication endpoints rate limit */
    AUTH: { requests: 20, windowMs: 60000 },

    /** Search endpoints rate limit */
    SEARCH: { requests: 30, windowMs: 60000 },

    /** Search suggestions rate limit (higher for autocomplete) */
    SEARCH_SUGGESTIONS: { requests: 60, windowMs: 60000 },
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
    /** Enable gamification (levels, badges, etc.) */
    GAMIFICATION_ENABLED: process.env.NEXT_PUBLIC_GAMIFICATION_ENABLED !== "false",

    /** Enable push notifications */
    PUSH_NOTIFICATIONS_ENABLED: !!process.env.VAPID_PUBLIC_KEY,

    /** Enable email digest notifications */
    EMAIL_DIGESTS_ENABLED: !!process.env.RESEND_API_KEY,

    /** Enable AI quiz generation */
    AI_QUIZ_ENABLED: !!process.env.OPENROUTER_API_KEY,
} as const;

// ============================================================================
// LIMITS
// ============================================================================

export const LIMITS = {
    /** Maximum challenge expiry in hours */
    MAX_CHALLENGE_EXPIRY_HOURS: 168, // 7 days

    /** Maximum number of friends per user */
    MAX_FRIENDS: 500,

    /** Maximum notifications shown in list */
    MAX_NOTIFICATIONS_SHOWN: 100,

    /** Days after which old notifications are cleaned up */
    OLD_NOTIFICATION_DAYS: 30,

    /** Maximum questions per quiz */
    MAX_QUESTIONS_PER_QUIZ: 100,

    /** Maximum answers per question */
    MAX_ANSWERS_PER_QUESTION: 6,

    /** Maximum image upload size in bytes */
    MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
} as const;

// ============================================================================
// QUERY LIMITS (for database queries)
// ============================================================================

export const QUERY_LIMITS = {
    /** Friends dashboard list */
    FRIENDS_DASHBOARD: 100,

    /** Challenges dashboard list */
    CHALLENGES_DASHBOARD: 50,

    /** Recent attempts in profile */
    RECENT_ATTEMPTS: 10,

    /** Default leaderboard entries */
    LEADERBOARD_DEFAULT: 100,

    /** Maximum leaderboard entries */
    LEADERBOARD_MAX: 500,

    /** Topic search results */
    TOPIC_SEARCH_MAX: 50,

    /** Daily quizzes shown */
    DAILY_QUIZZES: 12,

    /** Featured quizzes on home page */
    FEATURED_QUIZZES: 6,

    /** Top topics on home page */
    TOP_TOPICS: 6,
} as const;

// ============================================================================
// TIME PERIODS (in milliseconds unless noted)
// ============================================================================

export const TIME_PERIODS = {
    /** Days to look back for streak calculation */
    STREAK_LOOKBACK_DAYS: 30,

    /** Days after which notifications are cleaned up */
    NOTIFICATION_CLEANUP_DAYS: 30,

    /** Cooldown between level-up notifications (ms) */
    LEVEL_NOTIFICATION_COOLDOWN_MS: 60 * 60 * 1000, // 1 hour

    /** Session expiry for quiz attempts (ms) */
    QUIZ_SESSION_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ============================================================================
// SCORING
// ============================================================================

export const SCORING = {
    /** Default completion bonus per question */
    DEFAULT_COMPLETION_BONUS_PER_QUESTION: 100,

    /** Minimum time limit in seconds for bonus calculations */
    MIN_TIME_LIMIT_SECONDS: 5,

    /** Base points for correct answer */
    BASE_CORRECT_POINTS: 100,

    /** Streak bonus multiplier */
    STREAK_BONUS_MULTIPLIER: 10,

    /** Maximum streak bonus */
    MAX_STREAK_BONUS: 50,
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI = {
    /** Items per page in tables */
    TABLE_PAGE_SIZE: 20,

    /** Debounce delay for search inputs (ms) */
    SEARCH_DEBOUNCE_MS: 300,

    /** Toast notification duration (ms) */
    TOAST_DURATION_MS: 5000,

    /** Animation duration (ms) */
    ANIMATION_DURATION_MS: 200,
} as const;
