/**
 * Audit Logging Service
 * 
 * Provides structured logging for security-relevant events.
 * In production, this can be extended to send logs to external services
 * like DataDog, Splunk, or a dedicated audit log database.
 */

export type AuditAction =
    | "USER_LOGIN"
    | "USER_LOGOUT"
    | "USER_REGISTER"
    | "USER_DELETE"
    | "USER_UPDATE"
    | "PASSWORD_RESET"
    | "DATA_EXPORT"
    | "QUIZ_CREATE"
    | "QUIZ_UPDATE"
    | "QUIZ_DELETE"
    | "QUIZ_ATTEMPT_START"
    | "QUIZ_ATTEMPT_COMPLETE"
    | "FRIEND_REQUEST_SEND"
    | "FRIEND_REQUEST_ACCEPT"
    | "FRIEND_REQUEST_DECLINE"
    | "FRIEND_REMOVE"
    | "CHALLENGE_CREATE"
    | "CHALLENGE_ACCEPT"
    | "CHALLENGE_DECLINE"
    | "CHALLENGE_COMPLETE"
    | "ADMIN_ACTION"
    | "SETTINGS_CHANGE"
    | "RATE_LIMIT_EXCEEDED"
    | "AUTH_FAILURE"
    | "SUSPICIOUS_ACTIVITY";

export type AuditSeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

interface AuditLogEntry {
    action: AuditAction;
    severity?: AuditSeverity;
    userId?: string | null;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: Date;
}

interface FormattedAuditLog {
    timestamp: string;
    action: AuditAction;
    severity: AuditSeverity;
    userId: string | null;
    resourceType: string | null;
    resourceId: string | null;
    metadata: Record<string, unknown>;
    ipAddress: string | null;
    userAgent: string | null;
}

/**
 * Format audit log entry for consistent output
 */
function formatAuditLog(entry: AuditLogEntry): FormattedAuditLog {
    return {
        timestamp: (entry.timestamp ?? new Date()).toISOString(),
        action: entry.action,
        severity: entry.severity ?? "INFO",
        userId: entry.userId ?? null,
        resourceType: entry.resourceType ?? null,
        resourceId: entry.resourceId ?? null,
        metadata: entry.metadata ?? {},
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
    };
}

/**
 * Log an audit event
 * 
 * In production, extend this to:
 * - Send to external logging service
 * - Store in dedicated audit log database
 * - Trigger alerts for critical events
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
    const formattedLog = formatAuditLog(entry);

    // Determine log level based on severity
    const logFn =
        formattedLog.severity === "CRITICAL" || formattedLog.severity === "ERROR"
            ? console.error
            : formattedLog.severity === "WARN"
                ? console.warn
                : console.log;

    // Log with [AUDIT] prefix for easy filtering
    logFn("[AUDIT]", JSON.stringify(formattedLog));

    // In production, you might want to:
    // 1. Send to external logging service
    // await sendToLoggingService(formattedLog);

    // 2. Store in database for compliance
    // await prisma.auditLog.create({ data: formattedLog });

    // 3. Trigger alerts for critical events
    // if (formattedLog.severity === "CRITICAL") {
    //   await sendAlert(formattedLog);
    // }
}

/**
 * Helper to log authentication events
 */
export async function logAuthEvent(
    action: "USER_LOGIN" | "USER_LOGOUT" | "USER_REGISTER" | "AUTH_FAILURE" | "PASSWORD_RESET",
    userId: string | null,
    success: boolean,
    metadata?: Record<string, unknown>
): Promise<void> {
    await logAuditEvent({
        action,
        severity: success ? "INFO" : "WARN",
        userId,
        metadata: {
            success,
            ...metadata,
        },
    });
}

/**
 * Helper to log admin actions
 */
export async function logAdminAction(
    userId: string,
    description: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await logAuditEvent({
        action: "ADMIN_ACTION",
        severity: "INFO",
        userId,
        resourceType,
        resourceId,
        metadata: {
            description,
            ...metadata,
        },
    });
}

/**
 * Helper to log suspicious activity
 */
export async function logSuspiciousActivity(
    description: string,
    userId?: string | null,
    ipAddress?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await logAuditEvent({
        action: "SUSPICIOUS_ACTIVITY",
        severity: "WARN",
        userId,
        ipAddress,
        metadata: {
            description,
            ...metadata,
        },
    });
}

/**
 * Helper to log rate limit events
 */
export async function logRateLimitEvent(
    ipAddress: string,
    endpoint: string,
    userId?: string | null
): Promise<void> {
    await logAuditEvent({
        action: "RATE_LIMIT_EXCEEDED",
        severity: "WARN",
        userId,
        ipAddress,
        metadata: {
            endpoint,
        },
    });
}

/**
 * Helper to log data access events (for GDPR compliance)
 */
export async function logDataAccess(
    userId: string,
    action: "DATA_EXPORT" | "USER_DELETE",
    requestedBy: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await logAuditEvent({
        action,
        severity: "INFO",
        userId,
        metadata: {
            requestedBy,
            ...metadata,
        },
    });
}
