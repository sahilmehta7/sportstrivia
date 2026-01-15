/**
 * Application Constants
 * 
 * This file contains commonly used literal values extracted from the codebase.
 * Using named constants instead of magic numbers improves code readability
 * and makes updates easier.
 */

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

// ============================================================================
// FILE SIZE CONSTANTS
// ============================================================================

export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = 1024 * BYTES_PER_KB;
export const BYTES_PER_GB = 1024 * BYTES_PER_MB;

// ============================================================================
// DIFFICULTY MULTIPLIERS
// ============================================================================

export const DIFFICULTY_MULTIPLIER = {
    EASY: 0.75,
    MEDIUM: 1.0,
    HARD: 1.5,
} as const;

// ============================================================================
// LEADERBOARD PERIODS
// ============================================================================

export const LEADERBOARD_PERIOD = {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    ALL_TIME: "all-time",
} as const;

export type LeaderboardPeriodType = typeof LEADERBOARD_PERIOD[keyof typeof LEADERBOARD_PERIOD];

// ============================================================================
// QUIZ CONSTANTS
// ============================================================================

export const QUIZ = {
    DEFAULT_PASSING_SCORE: 70,
    DEFAULT_TIME_PER_QUESTION: 30, // seconds
    MIN_QUESTIONS: 1,
    MAX_QUESTIONS: 100,
    MIN_ANSWERS: 2,
    MAX_ANSWERS: 6,
    DEFAULT_PENALTY_PERCENTAGE: 25,
} as const;

// ============================================================================
// BADGE THRESHOLDS
// ============================================================================

export const BADGE_THRESHOLDS = {
    FIRST_QUIZ: 1,
    QUIZ_MASTER: 50,
    CENTURY: 100,
    CHALLENGER_WINS: 5,
    STREAK_STARTER: 3,
    WEEK_WARRIOR: 7,
    PERFECTIONIST: 1, // 100% score
    SPEED_DEMON_SECONDS: 5, // answer under 5 seconds
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    CUID: /^c[^\s-]{24}$/,
} as const;

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NOTIFICATION_TYPE = {
    BADGE_EARNED: "BADGE_EARNED",
    LEVEL_UP: "LEVEL_UP",
    TIER_UP: "TIER_UP",
    FRIEND_REQUEST: "FRIEND_REQUEST",
    FRIEND_ACCEPTED: "FRIEND_ACCEPTED",
    CHALLENGE_RECEIVED: "CHALLENGE_RECEIVED",
    CHALLENGE_ACCEPTED: "CHALLENGE_ACCEPTED",
    CHALLENGE_COMPLETED: "CHALLENGE_COMPLETED",
    QUIZ_REVIEW: "QUIZ_REVIEW",
    NEW_QUIZ: "NEW_QUIZ",
    STREAK_MILESTONE: "STREAK_MILESTONE",
    DAILY_REMINDER: "DAILY_REMINDER",
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODE = {
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    BAD_REQUEST: "BAD_REQUEST",
    CONFLICT: "CONFLICT",
    ATTEMPT_LIMIT_REACHED: "ATTEMPT_LIMIT_REACHED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;
