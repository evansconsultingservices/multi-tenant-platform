/**
 * Tool Service
 *
 * Manages tools and tool access for users and companies.
 * Now uses the standalone API instead of direct Firestore calls.
 */

import { api } from './api';
import { Tool } from '../types/tool.types';
import { UserProfile } from '../types/user.types';

// Helper to convert date strings to Date objects
const convertToolDates = (tool: Tool): Tool => ({
  ...tool,
  createdAt: new Date(tool.createdAt),
  updatedAt: new Date(tool.updatedAt),
});

// Helper to convert user profile dates
const convertUserDates = (user: UserProfile): UserProfile => ({
  ...user,
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date(),
  accountCreated: user.accountCreated ? new Date(user.accountCreated) : new Date(),
});

export class ToolService {
  /**
   * Get all available tools
   */
  static async getAllTools(): Promise<Tool[]> {
    const response = await api.get<Tool[]>('/tools');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch tools');
    }

    return response.data.map(convertToolDates);
  }

  /**
   * Get tools accessible by a company
   */
  static async getCompanyTools(companyId: string): Promise<Tool[]> {
    const response = await api.get<Tool[]>('/tools/company', { companyId });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch company tools');
    }

    return response.data.map(convertToolDates);
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
    const response = await api.post('/tools/company/access', {
      companyId,
      toolId,
      accessLevel,
      grantedBy,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to grant company tool access');
    }
  }

  /**
   * Revoke tool access from a company
   */
  static async revokeCompanyToolAccess(companyId: string, toolId: string): Promise<void> {
    const response = await api.delete(`/tools/company/access?companyId=${encodeURIComponent(companyId)}&toolId=${encodeURIComponent(toolId)}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to revoke company tool access');
    }
  }

  /**
   * Get tools accessible by a specific user (with role-based access)
   * Logic:
   * - super_admin: sees ALL tools (no company restriction)
   * - admin/user: company-based access with user-level overrides
   */
  static async getUserTools(userId: string): Promise<Tool[]> {
    const response = await api.get<Tool[]>('/tools/user', { userId });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user tools');
    }

    return response.data.map(convertToolDates);
  }

  /**
   * Create a new tool
   */
  static async createTool(toolData: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<string> {
    const response = await api.post<{ id: string }>('/tools', {
      ...toolData,
      createdBy,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create tool');
    }

    return response.data.id;
  }

  /**
   * Update an existing tool
   */
  static async updateTool(toolId: string, updates: Partial<Tool>): Promise<void> {
    const response = await api.put(`/tools/${toolId}`, updates);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update tool');
    }
  }

  /**
   * Delete a tool
   */
  static async deleteTool(toolId: string): Promise<void> {
    const response = await api.delete(`/tools/${toolId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete tool');
    }
  }

  /**
   * Grant tool access to a user
   */
  static async grantToolAccess(
    userId: string,
    toolId: string,
    accessLevel: 'read' | 'write' | 'admin',
    grantedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    const response = await api.post('/tools/user/access', {
      userId,
      toolId,
      accessLevel,
      grantedBy,
      expiresAt: expiresAt?.toISOString(),
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to grant tool access');
    }
  }

  /**
   * Revoke tool access from a user
   */
  static async revokeToolAccess(userId: string, toolId: string): Promise<void> {
    const response = await api.delete(`/tools/user/access?userId=${encodeURIComponent(userId)}&toolId=${encodeURIComponent(toolId)}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to revoke tool access');
    }
  }

  /**
   * Get users who have access to a specific tool
   */
  static async getToolUsers(toolId: string): Promise<(UserProfile & { accessLevel: string })[]> {
    const response = await api.get<(UserProfile & { accessLevel: string })[]>(`/tools/${toolId}/users`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch tool users');
    }

    return response.data.map(user => ({
      ...convertUserDates(user),
      accessLevel: user.accessLevel,
    }));
  }

  /**
   * Log tool usage
   */
  static async logToolUsage(
    userId: string,
    toolId: string,
    action: 'access' | 'login' | 'logout' | 'error',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await api.post('/tools/usage', {
        userId,
        toolId,
        action,
        metadata: metadata || {},
      });
    } catch (error) {
      // Don't throw error for logging - it shouldn't break the main flow
      console.error('Error logging tool usage:', error);
    }
  }

  /**
   * Check if user has access to a specific tool (with role-based and cascading company access)
   */
  static async hasToolAccess(userId: string, toolId: string): Promise<{ hasAccess: boolean; accessLevel?: string; source?: 'user' | 'company' | 'super_admin' }> {
    try {
      const response = await api.get<{ hasAccess: boolean; accessLevel?: string; source?: 'user' | 'company' | 'super_admin' }>(
        '/tools/access/check',
        { userId, toolId }
      );

      if (!response.success || !response.data) {
        return { hasAccess: false };
      }

      return response.data;
    } catch (error) {
      console.error('Error checking tool access:', error);
      return { hasAccess: false };
    }
  }
}
