/**
 * Company Service
 *
 * Manages company/tenant operations.
 * Now uses the standalone API instead of direct Firestore calls.
 */

import { api } from './api';
import {
  Company,
  CompanyToolAccess,
  CreateCompanyInput,
  UpdateCompanyInput,
  SubscriptionTier,
} from '../types/company.types';
import { UserProfile } from '../types/user.types';

// Helper to convert date strings to Date objects
const convertCompanyDates = (company: Company): Company => ({
  ...company,
  createdAt: new Date(company.createdAt),
  updatedAt: new Date(company.updatedAt),
  subscription: {
    ...company.subscription,
    startDate: new Date(company.subscription.startDate),
    endDate: company.subscription.endDate ? new Date(company.subscription.endDate) : undefined,
  },
});

// Helper to convert user profile dates
const convertUserDates = (user: UserProfile): UserProfile => ({
  ...user,
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date(),
  accountCreated: user.accountCreated ? new Date(user.accountCreated) : new Date(),
});

export class CompanyService {
  /**
   * Get all companies (Admin/Super Admin only)
   */
  static async getAllCompanies(): Promise<Company[]> {
    const response = await api.get<Company[]>('/companies');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch companies');
    }

    return response.data.map(convertCompanyDates);
  }

  /**
   * Get a company by ID
   */
  static async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const response = await api.get<Company>(`/companies/${companyId}`);

      if (!response.success || !response.data) {
        return null;
      }

      return convertCompanyDates(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Get a company by slug
   */
  static async getCompanyBySlug(slug: string): Promise<Company | null> {
    try {
      const response = await api.get<Company>('/companies/by-slug', { slug });

      if (!response.success || !response.data) {
        return null;
      }

      return convertCompanyDates(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new company
   */
  static async createCompany(input: CreateCompanyInput, createdByUserId: string): Promise<string> {
    const response = await api.post<{ id: string }>('/companies', {
      ...input,
      createdBy: createdByUserId,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create company');
    }

    return response.data.id;
  }

  /**
   * Update a company
   */
  static async updateCompany(companyId: string, updates: UpdateCompanyInput): Promise<void> {
    const response = await api.put(`/companies/${companyId}`, updates);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update company');
    }
  }

  /**
   * Delete a company (soft delete - set status to inactive)
   */
  static async deleteCompany(companyId: string): Promise<void> {
    const response = await api.delete(`/companies/${companyId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete company');
    }
  }

  /**
   * Enable a company (set status to active)
   */
  static async enableCompany(companyId: string): Promise<void> {
    const response = await api.put(`/companies/${companyId}/enable`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to enable company');
    }
  }

  /**
   * Disable a company (set status to inactive)
   */
  static async disableCompany(companyId: string): Promise<void> {
    const response = await api.put(`/companies/${companyId}/disable`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to disable company');
    }
  }

  /**
   * Search companies by name
   */
  static async searchCompanies(searchTerm: string): Promise<Company[]> {
    const response = await api.get<Company[]>('/companies/search', { q: searchTerm });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search companies');
    }

    return response.data.map(convertCompanyDates);
  }

  /**
   * Get all users in a company
   */
  static async getCompanyUsers(companyId: string): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>(`/companies/${companyId}/users`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch company users');
    }

    return response.data.map(convertUserDates);
  }

  /**
   * Get count of users in a company
   */
  static async getCompanyUserCount(companyId: string): Promise<number> {
    try {
      const response = await api.get<{ count: number }>(`/companies/${companyId}/user-count`);

      if (!response.success || !response.data) {
        return 0;
      }

      return response.data.count;
    } catch {
      return 0;
    }
  }

  /**
   * Get all tools accessible to a company
   */
  static async getCompanyTools(companyId: string): Promise<CompanyToolAccess[]> {
    const response = await api.get<CompanyToolAccess[]>(`/companies/${companyId}/tools`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch company tools');
    }

    return response.data;
  }

  /**
   * Get count of tools accessible to a company
   */
  static async getCompanyToolsCount(companyId: string): Promise<number> {
    try {
      const response = await api.get<{ count: number }>(`/companies/${companyId}/tools-count`);

      if (!response.success || !response.data) {
        return 0;
      }

      return response.data.count;
    } catch {
      return 0;
    }
  }

  /**
   * Grant tool access to a company
   */
  static async grantCompanyToolAccess(
    companyId: string,
    toolId: string,
    accessLevel: 'read' | 'write' | 'admin',
    grantedBy: string
  ): Promise<void> {
    const response = await api.post(`/companies/${companyId}/tools`, {
      toolId,
      accessLevel,
      grantedBy,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to grant tool access to company');
    }
  }

  /**
   * Revoke tool access from a company
   */
  static async revokeCompanyToolAccess(companyId: string, toolId: string): Promise<void> {
    const response = await api.delete(`/companies/${companyId}/tools/${toolId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to revoke tool access from company');
    }
  }

  /**
   * Get all companies a user belongs to (for company switcher)
   * Super admins see all companies
   * Regular users see only companies they're members of
   */
  static async getUserCompanies(userId: string): Promise<Company[]> {
    const response = await api.get<Company[]>('/companies/user', { userId });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user companies');
    }

    return response.data.map(convertCompanyDates);
  }

  /**
   * Switch user's current company context
   * Updates the user's `companyId` field
   */
  static async switchUserCompany(userId: string, newCompanyId: string): Promise<void> {
    const response = await api.put('/companies/switch', {
      userId,
      companyId: newCompanyId,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to switch company');
    }
  }

  /**
   * Get all companies in the same group as the given company
   */
  static async getGroupedCompanies(companyId: string): Promise<Company[]> {
    const response = await api.get<Company[]>(`/companies/${companyId}/group`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch grouped companies');
    }

    return response.data.map(convertCompanyDates);
  }

  /**
   * Get all users across all companies in a group (shared user pool)
   */
  static async getGroupUsers(companyId: string): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>(`/companies/${companyId}/group/users`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch group users');
    }

    return response.data.map(convertUserDates);
  }

  /**
   * Check if user has permission to manage users in this company group
   */
  static async canManageGroupUsers(userId: string, companyId: string): Promise<boolean> {
    try {
      const response = await api.get<{ canManage: boolean }>('/companies/can-manage-group-users', {
        userId,
        companyId,
      });

      if (!response.success || !response.data) {
        return false;
      }

      return response.data.canManage;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Get max users by subscription tier (client-side reference)
   */
  static getMaxUsersByTier(tier: SubscriptionTier): number {
    switch (tier) {
      case SubscriptionTier.FREE:
        return 5;
      case SubscriptionTier.PRO:
        return 50;
      case SubscriptionTier.ENTERPRISE:
        return 1000;
      default:
        return 5;
    }
  }

  /**
   * Helper: Get max storage by subscription tier (client-side reference)
   */
  static getMaxStorageByTier(tier: SubscriptionTier): number {
    switch (tier) {
      case SubscriptionTier.FREE:
        return 5; // GB
      case SubscriptionTier.PRO:
        return 100; // GB
      case SubscriptionTier.ENTERPRISE:
        return 1000; // GB
      default:
        return 5;
    }
  }
}
