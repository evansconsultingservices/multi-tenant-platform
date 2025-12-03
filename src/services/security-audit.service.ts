/**
 * Security Audit Service
 *
 * SECURITY: Comprehensive audit logging for compliance and threat detection
 * Now uses the standalone API instead of direct Firestore calls.
 *
 * - Logs all authentication and authorization events
 * - Tracks suspicious activities and blocked attacks
 * - Provides forensic data for security investigations
 * - Supports SOC 2, PCI DSS 8.2.8, and GDPR requirements
 */

import { api } from './api';

/**
 * Security event types for comprehensive audit logging
 * COMPLIANCE: Required for SOC 2, PCI DSS, GDPR
 */
export enum SecurityEventType {
  // Authentication events
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_RATE_LIMITED = 'auth_rate_limited',
  SESSION_TIMEOUT = 'session_timeout',
  TOKEN_REFRESH_FAILED = 'token_refresh_failed',

  // Authorization events
  ACCESS_DENIED = 'access_denied',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',

  // User management events
  ROLE_CHANGE = 'role_change',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',

  // Super admin events
  SUPER_ADMIN_ACTION = 'super_admin_action',
  SUPER_ADMIN_UNAUTHORIZED_ATTEMPT = 'super_admin_unauthorized_attempt',

  // Suspicious activity
  SUSPICIOUS_INPUT_DETECTED = 'suspicious_input_detected',
  XSS_ATTEMPT_BLOCKED = 'xss_attempt_blocked',
  INJECTION_ATTEMPT_BLOCKED = 'injection_attempt_blocked',

  // Data access
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  BULK_DATA_EXPORT = 'bulk_data_export',
}

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Security audit log entry interface
 */
export interface SecurityAuditLog {
  id?: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  email?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

export class SecurityAuditService {
  /**
   * Get user agent string
   */
  private static getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  /**
   * Log a security event
   *
   * IMPORTANT: This method should NEVER throw errors that break the main flow
   */
  static async logSecurityEvent(
    eventType: SecurityEventType,
    severity: SecurityEventSeverity,
    description: string,
    options?: {
      userId?: string;
      email?: string;
      companyId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      await api.post('/audit', {
        eventType,
        severity,
        description,
        userAgent: this.getUserAgent(),
        userId: options?.userId,
        email: options?.email,
        companyId: options?.companyId,
        metadata: options?.metadata || {},
      });

      // Log critical events to console for immediate visibility
      if (severity === SecurityEventSeverity.CRITICAL || severity === SecurityEventSeverity.ERROR) {
        console.error('[SECURITY AUDIT]', eventType, description, options?.metadata);
      } else if (severity === SecurityEventSeverity.WARNING) {
        console.warn('[SECURITY AUDIT]', eventType, description);
      }
    } catch (error) {
      // CRITICAL: Never throw errors from logging
      // Logging failures should not break the application
      console.error('Failed to log security event:', error);
      console.error('Original event:', { eventType, severity, description, options });
    }
  }

  /**
   * Log authentication success
   */
  static async logAuthSuccess(userId: string, email: string): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.AUTH_SUCCESS,
      SecurityEventSeverity.INFO,
      `User ${email} successfully authenticated`,
      { userId, email }
    );
  }

  /**
   * Log authentication failure
   */
  static async logAuthFailure(email: string, reason: string): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.AUTH_FAILURE,
      SecurityEventSeverity.WARNING,
      `Authentication failed for ${email}: ${reason}`,
      { email, metadata: { reason } }
    );
  }

  /**
   * Log rate limiting trigger
   */
  static async logRateLimitTrigger(identifier: string, remainingMinutes: number): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.AUTH_RATE_LIMITED,
      SecurityEventSeverity.WARNING,
      `Rate limit triggered for client. Lockout: ${remainingMinutes} minutes remaining`,
      { metadata: { identifier, remainingMinutes } }
    );
  }

  /**
   * Log session timeout
   */
  static async logSessionTimeout(userId: string, email: string): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.SESSION_TIMEOUT,
      SecurityEventSeverity.INFO,
      `Session expired for user ${email} due to inactivity`,
      { userId, email }
    );
  }

  /**
   * Log token refresh failure
   */
  static async logTokenRefreshFailure(userId: string, email: string, error: string): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.TOKEN_REFRESH_FAILED,
      SecurityEventSeverity.ERROR,
      `Token refresh failed for user ${email}`,
      { userId, email, metadata: { error } }
    );
  }

  /**
   * Log access denied event
   */
  static async logAccessDenied(
    userId: string,
    email: string,
    resource: string,
    reason: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.ACCESS_DENIED,
      SecurityEventSeverity.WARNING,
      `Access denied for user ${email} to resource ${resource}: ${reason}`,
      { userId, email, metadata: { resource, reason } }
    );
  }

  /**
   * Log role change
   */
  static async logRoleChange(
    userId: string,
    email: string,
    oldRole: string,
    newRole: string,
    performedBy: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.ROLE_CHANGE,
      SecurityEventSeverity.WARNING,
      `User ${email} role changed from ${oldRole} to ${newRole} by ${performedBy}`,
      { userId, email, metadata: { oldRole, newRole, performedBy } }
    );
  }

  /**
   * Log user creation
   */
  static async logUserCreated(
    userId: string,
    email: string,
    role: string,
    companyId: string,
    performedBy: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.USER_CREATED,
      SecurityEventSeverity.INFO,
      `User ${email} created with role ${role} by ${performedBy}`,
      { userId, email, companyId, metadata: { role, performedBy } }
    );
  }

  /**
   * Log user update
   */
  static async logUserUpdated(
    userId: string,
    email: string,
    updatedFields: string[],
    performedBy: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.USER_UPDATED,
      SecurityEventSeverity.INFO,
      `User ${email} profile updated by ${performedBy}`,
      { userId, email, metadata: { updatedFields, performedBy } }
    );
  }

  /**
   * Log user deletion
   */
  static async logUserDeleted(
    userId: string,
    email: string,
    performedBy: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.USER_DELETED,
      SecurityEventSeverity.WARNING,
      `User ${email} deleted by ${performedBy}`,
      { userId, email, metadata: { performedBy } }
    );
  }

  /**
   * Log super admin action
   */
  static async logSuperAdminAction(
    userId: string,
    email: string,
    action: string,
    targetResource?: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.SUPER_ADMIN_ACTION,
      SecurityEventSeverity.WARNING,
      `Super admin ${email} performed action: ${action}`,
      { userId, email, metadata: { action, targetResource } }
    );
  }

  /**
   * Log unauthorized super admin attempt
   */
  static async logUnauthorizedSuperAdminAttempt(email: string): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.SUPER_ADMIN_UNAUTHORIZED_ATTEMPT,
      SecurityEventSeverity.CRITICAL,
      `CRITICAL: Unauthorized super admin access attempt by ${email}`,
      { email }
    );
  }

  /**
   * Log suspicious input detection
   */
  static async logSuspiciousInput(
    userId: string,
    email: string,
    field: string,
    pattern: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_INPUT_DETECTED,
      SecurityEventSeverity.WARNING,
      `Suspicious input detected in field ${field} for user ${email}`,
      { userId, email, metadata: { field, pattern } }
    );
  }

  /**
   * Log XSS attempt
   */
  static async logXSSAttempt(
    userId: string,
    email: string,
    field: string,
    input: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.XSS_ATTEMPT_BLOCKED,
      SecurityEventSeverity.ERROR,
      `XSS attempt blocked for user ${email} in field ${field}`,
      { userId, email, metadata: { field, inputSample: input.substring(0, 100) } }
    );
  }

  /**
   * Log injection attempt
   */
  static async logInjectionAttempt(
    userId: string,
    email: string,
    field: string,
    input: string
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.INJECTION_ATTEMPT_BLOCKED,
      SecurityEventSeverity.ERROR,
      `Injection attempt blocked for user ${email} in field ${field}`,
      { userId, email, metadata: { field, inputSample: input.substring(0, 100) } }
    );
  }

  /**
   * Log sensitive data access
   */
  static async logSensitiveDataAccess(
    userId: string,
    email: string,
    resource: string,
    recordCount?: number
  ): Promise<void> {
    await this.logSecurityEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESS,
      SecurityEventSeverity.INFO,
      `User ${email} accessed sensitive data: ${resource}`,
      { userId, email, metadata: { resource, recordCount } }
    );
  }

  /**
   * Get recent security events (super admin only)
   */
  static async getRecentEvents(limit: number = 100): Promise<SecurityAuditLog[]> {
    try {
      const response = await api.get<SecurityAuditLog[]>('/audit', { limit });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch security audit logs');
      }

      return response.data.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching security logs:', error);
      throw new Error('Failed to fetch security audit logs');
    }
  }

  /**
   * Get security events for a specific user
   */
  static async getUserEvents(userId: string, limit: number = 50): Promise<SecurityAuditLog[]> {
    try {
      const response = await api.get<SecurityAuditLog[]>('/audit', { userId, limit });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch user security logs');
      }

      return response.data.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching user security logs:', error);
      throw new Error('Failed to fetch user security logs');
    }
  }

  /**
   * Get critical security events
   */
  static async getCriticalEvents(limit: number = 50): Promise<SecurityAuditLog[]> {
    try {
      const response = await api.get<SecurityAuditLog[]>('/audit', {
        severity: SecurityEventSeverity.CRITICAL,
        limit,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch critical security logs');
      }

      return response.data.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching critical security logs:', error);
      throw new Error('Failed to fetch critical security logs');
    }
  }
}
