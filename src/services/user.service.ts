import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserRole, validateUserProfile } from '../types/user.types';

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
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('accountCreated', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.convertDocToUserProfile(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        return null;
      }

      return this.convertDocToUserProfile(userDoc.id, userDoc.data());
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      return this.convertDocToUserProfile(userDoc.id, userDoc.data());
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Omit<UserProfile, 'id' | 'accountCreated' | 'lastLogin' | 'totalLoginCount'>): Promise<string> {
    try {
      // Validate user data based on role
      validateUserProfile(userData);

      const usersRef = collection(db, 'users');

      // Check if user with email already exists
      const existing = await this.getUserByEmail(userData.email);
      if (existing) {
        // If user exists but doesn't have a companyId, update them instead of throwing error
        if (!existing.companyId && userData.companyId) {
          await this.updateUser(existing.id, {
            companyId: userData.companyId,
            department: userData.department,
            role: userData.role,
          });
          console.log(`Updated existing user ${existing.email} with companyId ${userData.companyId}`);
          return existing.id;
        }

        // If trying to add to same company, just return the user ID
        if (existing.companyId === userData.companyId) {
          console.log(`User ${existing.email} already belongs to company ${userData.companyId}`);
          return existing.id;
        }

        // User belongs to a different company - provide detailed error
        if (existing.companyId && userData.companyId && existing.companyId !== userData.companyId) {
          throw new Error(
            `User ${userData.email} already belongs to company ID: ${existing.companyId}. ` +
            `Cannot add to company ID: ${userData.companyId}. ` +
            `Remove user from their current company first, or reassign them.`
          );
        }

        throw new Error(`User with email ${userData.email} already exists`);
      }

      const docRef = await addDoc(usersRef, {
        ...userData,
        accountCreated: serverTimestamp(),
        lastLogin: serverTimestamp(),
        totalLoginCount: 0,
        assignedTools: userData.assignedTools || [],
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error instanceof Error ? error : new Error('Failed to create user');
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      // SECURITY: Validate all input before processing
      this.validateUserInput(updates);

      // If updating role or companyId, validate the combination
      if (updates.role || updates.companyId !== undefined) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const currentData = userDoc.data();
          const mergedData = {
            ...currentData,
            ...updates,
            role: updates.role || currentData.role,
            companyId: updates.companyId !== undefined ? updates.companyId : currentData.companyId,
          };
          validateUserProfile(mergedData);
        }
      }

      const userRef = doc(db, 'users', userId);

      // Remove fields that shouldn't be updated directly
      const { id, accountCreated, totalLoginCount, ...allowedUpdates } = updates as any;

      await updateDoc(userRef, allowedUpdates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, newRole: UserRole, updatedBy: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
      });

      // Log role change
      await this.logUserAction(userId, 'role_change', updatedBy, {
        newRole,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Delete user (soft delete - deactivate)
   */
  static async deactivateUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: UserRole.USER,
        // We could add an 'isActive' field if needed
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error('Failed to deactivate user');
    }
  }

  /**
   * Hard delete user (use with caution)
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role), orderBy('accountCreated', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.convertDocToUserProfile(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw new Error('Failed to fetch users by role');
    }
  }

  /**
   * Get users by company
   */
  static async getUsersByCompany(companyId: string): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');

      // Query both companyId and organizationId for backward compatibility
      const q1 = query(
        usersRef,
        where('companyId', '==', companyId),
        orderBy('accountCreated', 'desc')
      );
      const q2 = query(
        usersRef,
        where('organizationId', '==', companyId),
        orderBy('accountCreated', 'desc')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      const users = [
        ...snapshot1.docs.map(doc => this.convertDocToUserProfile(doc.id, doc.data())),
        ...snapshot2.docs.map(doc => this.convertDocToUserProfile(doc.id, doc.data())),
      ];

      // Deduplicate by id
      const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

      return uniqueUsers;
    } catch (error) {
      console.error('Error getting users by company:', error);
      throw new Error('Failed to fetch users by company');
    }
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
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentCount = userDoc.data().totalLoginCount || 0;
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          totalLoginCount: currentCount + 1,
        });
      }
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
      const logsRef = collection(db, 'userActionLogs');
      await addDoc(logsRef, {
        userId,
        action,
        performedBy,
        timestamp: serverTimestamp(),
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
    try {
      const allUsers = await this.getAllUsers();

      const lowerSearch = searchTerm.toLowerCase();
      return allUsers.filter(user =>
        user.firstName.toLowerCase().includes(lowerSearch) ||
        user.lastName.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Helper to convert Firestore document to UserProfile
   */
  private static convertDocToUserProfile(id: string, data: any): UserProfile {
    return {
      id,
      email: data.email,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: data.avatarUrl,
      phoneNumber: data.phoneNumber,
      companyId: data.companyId || data.organizationId, // Support both for migration
      organizationRole: data.organizationRole,
      department: data.department,
      assignedTools: data.assignedTools || [],
      lastLogin: this.convertTimestampToDate(data.lastLogin),
      accountCreated: this.convertTimestampToDate(data.accountCreated),
      totalLoginCount: data.totalLoginCount || 0,
      theme: data.theme || 'dark',
      timezone: data.timezone || 'UTC',
      language: data.language || 'en',
      subscriptionTier: data.subscriptionTier,
      subscriptionStatus: data.subscriptionStatus,
      stripeCustomerId: data.stripeCustomerId,
    };
  }

  /**
   * Helper to convert Firestore Timestamp to Date
   */
  private static convertTimestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp.toDate) return timestamp.toDate();
    return new Date();
  }
}
