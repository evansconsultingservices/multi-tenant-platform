import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthService } from '../services/auth.service';
import { UserProfile } from '../types/user.types';
import { AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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