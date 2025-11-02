import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { UserProfile, UserRole } from '../types/user.types';
// import { AuthError } from '../types/auth.types';

export class AuthService {
  /**
   * Whitelist of emails authorized to become super admin
   * SECURITY: Only these emails can be assigned super_admin role on first login
   */
  private static readonly SUPER_ADMIN_EMAILS = [
    'sean@sneworks.com',
    'admin@mediaorchestrator.com'
  ];

  /**
   * Rate limiting configuration
   * SECURITY: Prevents brute force authentication attempts
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
   */
  static async signInWithGoogle(): Promise<UserProfile> {
    const clientId = this.getClientFingerprint();

    // Check rate limit before attempting sign-in
    this.checkRateLimit(clientId);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create or update user profile
      const userProfile = await this.createOrUpdateUserProfile(user);

      // Clear rate limit on successful authentication
      this.clearRateLimit(clientId);

      return userProfile;
    } catch (error: any) {
      // Record failed attempt for rate limiting
      this.recordFailedAttempt(clientId);

      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Sign-in failed');
    }
  }

  /**
   * Sign out current user
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
   * Create or update user profile in Firestore
   */
  static async createOrUpdateUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    const now = new Date();

    if (userSnap.exists()) {
      // Update existing user
      const existingData = userSnap.data() as UserProfile;

      const updateData = {
        lastLogin: serverTimestamp(),
        totalLoginCount: (existingData.totalLoginCount || 0) + 1,
        // Update email and display name in case they changed
        email: firebaseUser.email || existingData.email,
        avatarUrl: firebaseUser.photoURL || existingData.avatarUrl,
      };

      await updateDoc(userRef, updateData);

      return {
        ...existingData,
        lastLogin: now,
        totalLoginCount: updateData.totalLoginCount,
        email: updateData.email,
        avatarUrl: updateData.avatarUrl,
      };
    } else {
      // Check if user was pre-invited (profile exists with matching email)
      const preInvitedProfile = await this.findPreInvitedUser(firebaseUser.email || '');

      if (preInvitedProfile) {
        // Migrate pre-invited profile to use Firebase UID
        const migratedProfile: UserProfile = {
          ...preInvitedProfile,
          id: firebaseUser.uid,
          avatarUrl: firebaseUser.photoURL || preInvitedProfile.avatarUrl,
          lastLogin: now,
          totalLoginCount: 1,
        };

        // Create profile with Firebase UID
        await setDoc(userRef, {
          ...migratedProfile,
          lastLogin: serverTimestamp(),
        });

        // Delete old pre-invited profile if it has a different ID
        if (preInvitedProfile.id !== firebaseUser.uid) {
          try {
            const oldRef = doc(db, 'users', preInvitedProfile.id);
            await deleteDoc(oldRef);
            console.log(`Deleted old pre-invited profile: ${preInvitedProfile.id}`);
          } catch (error) {
            console.error('Error deleting old profile:', error);
          }
        }

        return migratedProfile;
      }

      // Create new user profile (no pre-invitation)
      const isFirstUser = await this.isFirstUser();
      const isSuperAdminEmail = this.SUPER_ADMIN_EMAILS.includes(firebaseUser.email || '');

      // SECURITY: Validate super admin assignment
      let role = UserRole.USER;
      if (isFirstUser) {
        if (!isSuperAdminEmail) {
          const errorMsg = `Security: First user ${firebaseUser.email} is not authorized for super admin access`;
          console.error(errorMsg);
          throw new Error('Platform initialization required. Please contact your system administrator.');
        }
        role = UserRole.SUPER_ADMIN;
        console.log(`Super admin account created for whitelisted email: ${firebaseUser.email}`);
      }

      const newUserProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        role,
        firstName: this.extractFirstName(firebaseUser.displayName || ''),
        lastName: this.extractLastName(firebaseUser.displayName || ''),
        avatarUrl: firebaseUser.photoURL || undefined,
        companyId: isFirstUser ? 'default' : 'default', // TODO: Implement proper company assignment
        assignedTools: [],
        lastLogin: now,
        accountCreated: now,
        totalLoginCount: 1,
        theme: 'dark',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
      };

      await setDoc(userRef, {
        ...newUserProfile,
        lastLogin: serverTimestamp(),
        accountCreated: serverTimestamp(),
      });

      return newUserProfile;
    }
  }

  /**
   * Find pre-invited user by email
   */
  private static async findPreInvitedUser(email: string): Promise<UserProfile | null> {
    if (!email) return null;

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        return {
          id: userDoc.id,
          ...data,
          lastLogin: data.lastLogin?.toDate?.() || new Date(),
          accountCreated: data.accountCreated?.toDate?.() || new Date(),
        } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error finding pre-invited user:', error);
      return null;
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          lastLogin: data.lastLogin?.toDate?.() || new Date(),
          accountCreated: data.accountCreated?.toDate?.() || new Date(),
        } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Check if this is the first user (for super admin assignment)
   */
  private static async isFirstUser(): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', UserRole.SUPER_ADMIN));
      const querySnapshot = await getDocs(q);

      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking first user:', error);
      return false;
    }
  }

  /**
   * Extract first name from display name
   */
  private static extractFirstName(displayName: string): string {
    const parts = displayName.trim().split(' ');
    return parts[0] || '';
  }

  /**
   * Extract last name from display name
   */
  private static extractLastName(displayName: string): string {
    const parts = displayName.trim().split(' ');
    return parts.slice(1).join(' ') || '';
  }

  /**
   * Listen to authentication state changes
   */
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}