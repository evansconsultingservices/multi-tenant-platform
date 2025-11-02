import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { AuthService } from '../services/auth.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { UserProfile } from '../types/user.types';
import { AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout configuration
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes (tokens expire at 60min)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session management refs
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      try {
        setError(null);

        if (firebaseUser) {
          // User is signed in, get their profile
          const userProfile = await AuthService.getUserProfile(firebaseUser.uid);
          setUser(userProfile);
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userProfile = await AuthService.signInWithGoogle();
      setUser(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      await AuthService.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-out failed');
      throw err;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await AuthService.getAuthToken();
    } catch (err) {
      console.error('Token retrieval error:', err);
      return null;
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (user) {
      try {
        const updatedProfile = await AuthService.getUserProfile(user.id);
        setUser(updatedProfile);
      } catch (err) {
        console.error('Profile refresh error:', err);
      }
    }
  };

  // Inactivity timeout - auto logout after 30 minutes of no activity
  useEffect(() => {
    if (!user) return;

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();

      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Set new timer
      inactivityTimerRef.current = setTimeout(async () => {
        console.warn('Session expired due to inactivity (30 minutes)');
        try {
          // SECURITY: Log session timeout before signing out
          if (user) {
            SecurityAuditService.logSessionTimeout(user.id, user.email);
          }
          await signOut();
        } catch (err) {
          console.error('Auto sign-out error:', err);
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Listen for user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Initialize timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

  // Token refresh - proactively refresh Firebase token every 50 minutes
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.getIdToken(true); // Force refresh
          console.log('Firebase token refreshed successfully');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);

        // SECURITY: Log token refresh failure
        if (user) {
          SecurityAuditService.logTokenRefreshFailure(
            user.id,
            user.email,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        // If token refresh fails, sign out for security
        await signOut();
      }
    };

    // Initial refresh
    refreshToken();

    // Set up interval for periodic refresh
    tokenRefreshTimerRef.current = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL_MS);

    // Cleanup
    return () => {
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
      }
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    getAuthToken,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};