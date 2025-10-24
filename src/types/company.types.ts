export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface CompanySubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  trialEndsAt?: Date;
  billingEmail?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface CompanySettings {
  // Feature flags
  featuresEnabled: string[];

  // Limits based on subscription
  maxUsers: number;
  maxStorageGB: number;
  maxMonthlyApiCalls?: number;

  // Branding
  customBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  // Security
  requireTwoFactor?: boolean;
  allowedDomains?: string[];
  sessionTimeoutMinutes?: number;

  // Custom database configuration (for advanced multi-tenancy)
  customDatabaseConfig?: {
    enabled: boolean;
    connectionString?: string;
    databaseName?: string;
  };
}

export interface Company {
  // Core Identity
  id: string;
  name: string;
  slug: string; // URL-friendly unique identifier (e.g., "acme-corp")
  description?: string;

  // Status
  status: CompanyStatus;

  // Contact Information
  contactEmail: string;
  website?: string;
  phone?: string;

  // Branding
  logoUrl?: string;

  // Subscription & Billing
  subscription: CompanySubscription;

  // Settings & Configuration
  settings: CompanySettings;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID of creator

  // Statistics (computed fields, not stored)
  userCount?: number;
  toolsCount?: number;
}

export interface CompanyToolAccess {
  id: string;
  companyId: string;
  toolId: string;
  accessLevel: 'read' | 'write' | 'admin';
  grantedAt: Date;
  grantedBy: string; // User ID
  expiresAt?: Date;
  isActive: boolean;
}

export interface CreateCompanyInput {
  name: string;
  slug?: string; // Auto-generated if not provided
  description?: string;
  contactEmail: string;
  website?: string;
  subscriptionTier?: SubscriptionTier;
  status?: CompanyStatus;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  contactEmail?: string;
  website?: string;
  phone?: string;
  logoUrl?: string;
  status?: CompanyStatus;
  settings?: Partial<CompanySettings>;
}
