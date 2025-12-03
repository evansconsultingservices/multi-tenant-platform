/**
 * Auth Service
 *
 * Handles Firebase Authentication and user profile management.
 *
 * NOTE: Firebase Auth operations (signInWithPopup, signOut, onAuthStateChanged)
 * must remain client-side as they require browser APIs.
 * User profile management now uses the standalone API.
 */

import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { api } from './api';
import { UserProfile } from '../types/user.types';
import { SecurityAuditService } from './security-audit.service';

// Helper to convert date strings to Date objects
const convertUserDates = (user: UserProfile): UserProfile => ({
  ...user,
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date(),
  accountCreated: user.accountCreated ? new Date(user.accountCreated) : new Date(),
});

export class AuthService {
  /**
   * Rate limiting configuration
   * SECURITY: Prevents brute force authentication attempts
   * Note: This is client-side rate limiting for UX; server-side rate limiting is also in place
   */
  private static readonly MAX_AUTH_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static authAttempts: Map<string, { count: number; timestamp: number }> = new Map();

  /**
   * Generate browser/device fingerprint for rate limiting
   */
  private static getClientFingerprint(): string {
    const userAgent = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const colorDepth = window.screen.colorDepth;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return `${userAgent}_${screenRes}_${colorDepth}_${timezone}`;
  }

  /**
   * Check if client is rate limited
   * SECURITY: Throws error if too many failed attempts
   */
  private static checkRateLimit(clientId: string): void {
    const attempt = this.authAttempts.get(clientId);

    if (attempt) {
      const timeSinceLastAttempt = Date.now() - attempt.timestamp;

      // Check if still in lockout period
      if (attempt.count >= this.MAX_AUTH_ATTEMPTS && timeSinceLastAttempt < this.LOCKOUT_DURATION_MS) {
        const remainingTime = Math.ceil((this.LOCKOUT_DURATION_MS - timeSinceLastAttempt) / 60000);

        // SECURITY: Log rate limit trigger
        SecurityAuditService.logRateLimitTrigger(clientId, remainingTime);

        throw new Error(`Too many sign-in attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`);
      }

      // Reset counter if lockout period has passed
      if (timeSinceLastAttempt > this.LOCKOUT_DURATION_MS) {
        this.authAttempts.delete(clientId);
      }
    }
  }

  /**
   * Record failed authentication attempt
   */
  private static recordFailedAttempt(clientId: string): void {
    const current = this.authAttempts.get(clientId) || { count: 0, timestamp: Date.now() };
    this.authAttempts.set(clientId, {
      count: current.count + 1,
      timestamp: Date.now()
    });

    const newCount = current.count + 1;
    if (newCount >= this.MAX_AUTH_ATTEMPTS) {
      console.warn(`Rate limit triggered for client. ${newCount} failed attempts.`);
    }
  }

  /**
   * Clear rate limit on successful authentication
   */
  private static clearRateLimit(clientId: string): void {
    this.authAttempts.delete(clientId);
  }

  /**
   * Sign in with Google OAuth
   * Note: Firebase Auth popup must happen client-side
   */
  static async signInWithGoogle(): Promise<UserProfile> {
    const clientId = this.getClientFingerprint();

    // Check rate limit before attempting sign-in
    this.checkRateLimit(clientId);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create or update user profile via API
      const userProfile = await this.createOrUpdateUserProfile(user);

      // Clear rate limit on successful authentication
      this.clearRateLimit(clientId);

      // SECURITY: Log successful authentication
      SecurityAuditService.logAuthSuccess(userProfile.id, userProfile.email);

      return userProfile;
    } catch (error: any) {
      // Record failed attempt for rate limiting
      this.recordFailedAttempt(clientId);

      // SECURITY: Log authentication failure
      const email = error.email || 'unknown';
      SecurityAuditService.logAuthFailure(email, error.message || 'Sign-in failed');

      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Sign-in failed');
    }
  }

  /**
   * Sign out current user
   * Note: Firebase Auth signOut must happen client-side
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error(error.message || 'Sign-out failed');
    }
  }

  /**
   * Get current auth token
   * Note: Token retrieval must happen client-side (Firebase SDK)
   */
  static async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      return await user.getIdToken();
    } catch (error: any) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }

  /**
   * Create or update user profile via API
   * The API handles:
   * - Checking for pre-invited users
   * - First user (super admin) logic with email whitelist
   * - Profile creation/update with proper timestamps
   */
  static async createOrUpdateUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
    const response = await api.post<UserProfile>('/auth/profile', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create/update user profile');
    }

    return convertUserDates(response.data);
  }

  /**
   * Get user profile by ID via API
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await api.get<UserProfile>(`/auth/profile/${userId}`);

      if (!response.success || !response.data) {
        return null;
      }

      return convertUserDates(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Listen to authentication state changes
   * Note: This Firebase listener must remain client-side
   */
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}
