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
  // Optional: super_admins don't belong to companies
  // Required: admins and users must belong to a company
  companyId?: string; // Reference to Company document
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

/**
 * Check if a role requires company membership
 */
export function requiresCompany(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.USER;
}

/**
 * Validate user profile based on role requirements
 */
export function validateUserProfile(user: Partial<UserProfile>): void {
  if (!user.role) {
    throw new Error('User role is required');
  }

  if (requiresCompany(user.role) && !user.companyId) {
    throw new Error(`${user.role} must belong to a company`);
  }

  if (user.role === UserRole.SUPER_ADMIN && user.companyId) {
    throw new Error('super_admin should not belong to a company');
  }
}