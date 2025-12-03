/**
 * User Service
 *
 * Manages user profiles and user-company relationships.
 * Now uses the standalone API instead of direct Firestore calls.
 *
 * SECURITY: Input validation is performed client-side before sending to API.
 * The API also performs server-side validation.
 */

import { api } from './api';
import { UserProfile, UserRole, validateUserProfile } from '../types/user.types';
import { SecurityAuditService } from './security-audit.service';
import { auth } from './firebase';

// Helper to convert date strings to Date objects
const convertUserDates = (user: UserProfile): UserProfile => ({
  ...user,
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date(),
  accountCreated: user.accountCreated ? new Date(user.accountCreated) : new Date(),
});

export class UserService {
  /**
   * Input validation patterns and limits
   * SECURITY: Prevent XSS, injection, and data pollution
   */
  private static readonly NAME_MAX_LENGTH = 100;
  private static readonly NAME_PATTERN = /^[a-zA-Z\s\-'.]+$/;
  private static readonly PHONE_PATTERN = /^\+?[0-9\s\-()]{10,20}$/;
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly DANGEROUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /onload=/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i,
  ];

  /**
   * Validate user input for XSS and injection attempts
   * SECURITY: Comprehensive input validation
   */
  private static validateUserInput(updates: Partial<UserProfile>): void {
    // Validate firstName
    if (updates.firstName !== undefined) {
      if (updates.firstName.length > this.NAME_MAX_LENGTH) {
        throw new Error(`First name must be ${this.NAME_MAX_LENGTH} characters or less`);
      }
      if (!this.NAME_PATTERN.test(updates.firstName)) {
        throw new Error('First name contains invalid characters. Use only letters, spaces, hyphens, apostrophes, and periods.');
      }
    }

    // Validate lastName
    if (updates.lastName !== undefined) {
      if (updates.lastName.length > this.NAME_MAX_LENGTH) {
        throw new Error(`Last name must be ${this.NAME_MAX_LENGTH} characters or less`);
      }
      if (!this.NAME_PATTERN.test(updates.lastName)) {
        throw new Error('Last name contains invalid characters. Use only letters, spaces, hyphens, apostrophes, and periods.');
      }
    }

    // Validate phoneNumber
    if (updates.phoneNumber !== undefined && updates.phoneNumber) {
      if (!this.PHONE_PATTERN.test(updates.phoneNumber)) {
        throw new Error('Invalid phone number format. Use format: +1234567890 or (123) 456-7890');
      }
    }

    // Validate email format (if provided)
    if (updates.email !== undefined && !this.EMAIL_PATTERN.test(updates.email)) {
      throw new Error('Invalid email format');
    }

    // Check for XSS and injection patterns in all string fields
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.DANGEROUS_PATTERNS.forEach(pattern => {
          if (pattern.test(value)) {
            // SECURITY: Log XSS/injection attempt
            const currentUser = auth.currentUser;
            if (currentUser) {
              SecurityAuditService.logXSSAttempt(
                currentUser.uid,
                currentUser.email || 'unknown',
                key,
                value
              );
            }

            throw new Error(`Input contains potentially malicious content in field: ${key}`);
          }
        });
      }
    });

    // Validate department if provided
    if (updates.department !== undefined && typeof updates.department === 'string') {
      if (updates.department.length > this.NAME_MAX_LENGTH) {
        throw new Error(`Department must be ${this.NAME_MAX_LENGTH} characters or less`);
      }
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>('/users');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch users');
    }

    return response.data.map(convertUserDates);
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const response = await api.get<UserProfile>(`/users/${userId}`);

      if (!response.success || !response.data) {
        return null;
      }

      return convertUserDates(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const response = await api.get<UserProfile>('/users/by-email', { email });

      if (!response.success || !response.data) {
        return null;
      }

      return convertUserDates(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Omit<UserProfile, 'id' | 'accountCreated' | 'lastLogin' | 'totalLoginCount'>): Promise<string> {
    // Validate user data based on role
    validateUserProfile(userData);

    const response = await api.post<{ id: string }>('/users', userData);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create user');
    }

    return response.data.id;
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    // SECURITY: Validate all input before processing
    this.validateUserInput(updates);

    // If updating role or companyId, validate the combination
    if (updates.role || updates.companyId !== undefined) {
      const currentUser = await this.getUserById(userId);
      if (currentUser) {
        const mergedData = {
          ...currentUser,
          ...updates,
          role: updates.role || currentUser.role,
          companyId: updates.companyId !== undefined ? updates.companyId : currentUser.companyId,
        };
        validateUserProfile(mergedData);
      }
    }

    // Remove fields that shouldn't be updated directly
    const { id, accountCreated, totalLoginCount, ...allowedUpdates } = updates as any;

    const response = await api.put(`/users/${userId}`, allowedUpdates);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update user');
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, newRole: UserRole, updatedBy: string): Promise<void> {
    const response = await api.put(`/users/${userId}/role`, {
      role: newRole,
      updatedBy,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update user role');
    }
  }

  /**
   * Delete user (soft delete - deactivate)
   */
  static async deactivateUser(userId: string): Promise<void> {
    const response = await api.put(`/users/${userId}/deactivate`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to deactivate user');
    }
  }

  /**
   * Hard delete user (use with caution)
   */
  static async deleteUser(userId: string): Promise<void> {
    const response = await api.delete(`/users/${userId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete user');
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>('/users', { role });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch users by role');
    }

    return response.data.map(convertUserDates);
  }

  /**
   * Get users by company
   */
  static async getUsersByCompany(companyId: string): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>('/users', { companyId });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch users by company');
    }

    return response.data.map(convertUserDates);
  }

  /**
   * @deprecated Use getUsersByCompany instead
   */
  static async getUsersByOrganization(organizationId: string): Promise<UserProfile[]> {
    return this.getUsersByCompany(organizationId);
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await api.put(`/users/${userId}/login`);
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw - this shouldn't break the login flow
    }
  }

  /**
   * Log user action for audit trail
   */
  static async logUserAction(
    userId: string,
    action: string,
    performedBy: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await api.post('/users/action-log', {
        userId,
        action,
        performedBy,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Error logging user action:', error);
      // Don't throw - logging shouldn't break the main flow
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>('/users/search', { q: searchTerm });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search users');
    }

    return response.data.map(convertUserDates);
  }

  /**
   * Add user to a company (with permission check)
   */
  static async addUserToCompany(
    userId: string,
    companyId: string,
    actorId: string
  ): Promise<void> {
    const response = await api.post(`/users/${userId}/companies`, {
      companyId,
      actorId,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add user to company');
    }
  }

  /**
   * Remove user from a company (with safeguards)
   */
  static async removeUserFromCompany(
    userId: string,
    companyId: string,
    actorId: string
  ): Promise<void> {
    const response = await api.delete(
      `/users/${userId}/companies/${companyId}?actorId=${encodeURIComponent(actorId)}`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove user from company');
    }
  }
}
