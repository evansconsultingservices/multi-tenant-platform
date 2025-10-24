import { UserRole, UserProfile } from './user.types';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  refreshUserProfile: () => Promise<void>;
}

export interface FirebaseCustomClaims {
  role: UserRole;
  organizationId: string;
  toolIds: string[];
  [toolId: string]: any; // For tool-specific access levels
}

export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}