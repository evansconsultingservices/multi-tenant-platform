export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

export interface ToolAccess {
  toolId: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  accessLevel: 'read' | 'write' | 'admin';
}

export interface UserProfile {
  // Core Identity
  id: string;
  email: string;
  role: UserRole;

  // Profile Information
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: string;

  // Company (Multi-tenant context)
  companyId: string; // Reference to Company document
  organizationRole?: string; // Deprecated: Use companyId instead
  department?: string;

  // Access Control
  assignedTools: ToolAccess[];

  // Usage Tracking
  lastLogin: Date;
  accountCreated: Date;
  totalLoginCount: number;

  // Preferences
  theme: 'light' | 'dark';
  timezone: string;
  language: string;

  // Future Billing
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  subscriptionStatus?: 'active' | 'trial' | 'expired';
  stripeCustomerId?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}