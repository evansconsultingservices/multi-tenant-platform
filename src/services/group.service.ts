/**
 * Group Service
 *
 * Manages company groups for organizing tenants.
 * Now uses the standalone API instead of direct Firestore calls.
 */

import { api } from './api';
import { CompanyGroup, CreateGroupInput, UpdateGroupInput } from '../types/group.types';

// Helper to convert date strings to Date objects
const convertGroupDates = (group: CompanyGroup): CompanyGroup => ({
  ...group,
  createdAt: new Date(group.createdAt),
  updatedAt: new Date(group.updatedAt),
});

export class GroupService {
  /**
   * Get all groups (super admin only)
   */
  static async getAllGroups(): Promise<CompanyGroup[]> {
    const response = await api.get<CompanyGroup[]>('/groups');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch groups');
    }

    return response.data.map(convertGroupDates);
  }

  /**
   * Get a group by document ID
   */
  static async getGroupById(id: string): Promise<CompanyGroup | null> {
    try {
      const response = await api.get<CompanyGroup>(`/groups/${id}`);

      if (!response.success || !response.data) {
        return null;
      }

      return convertGroupDates(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Get a group by groupId string
   */
  static async getGroupByGroupId(groupId: string): Promise<CompanyGroup | null> {
    try {
      const response = await api.get<CompanyGroup>('/groups/by-group-id', { groupId });

      if (!response.success || !response.data) {
        return null;
      }

      return convertGroupDates(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Validate groupId format and uniqueness
   */
  static async validateGroupId(groupId: string): Promise<{ valid: boolean; error?: string }> {
    const response = await api.post<{ valid: boolean; error?: string }>('/groups/validate', {
      groupId,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to validate group ID');
    }

    return response.data || { valid: false, error: 'Unknown validation error' };
  }

  /**
   * Create a new group
   */
  static async createGroup(input: CreateGroupInput, userId: string): Promise<string> {
    const response = await api.post<{ id: string }>('/groups', {
      ...input,
      userId, // The API will use this for audit logging
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create group');
    }

    return response.data.id;
  }

  /**
   * Update a group
   */
  static async updateGroup(id: string, updates: UpdateGroupInput, userId: string): Promise<void> {
    const response = await api.put(`/groups/${id}`, {
      ...updates,
      userId, // The API will use this for audit logging
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update group');
    }
  }

  /**
   * Delete a group
   * Can only delete if no companies are assigned to this group
   */
  static async deleteGroup(id: string, userId: string): Promise<void> {
    const response = await api.delete(`/groups/${id}?userId=${encodeURIComponent(userId)}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete group');
    }
  }

  /**
   * Get all companies using a specific groupId
   */
  static async getGroupCompanies(groupId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/groups/${groupId}/companies`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch group companies');
    }

    return response.data;
  }

  /**
   * Get count of companies using a specific groupId
   */
  static async getGroupCompanyCount(groupId: string): Promise<number> {
    try {
      const response = await api.get<{ count: number }>(`/groups/${groupId}/company-count`);

      if (!response.success || !response.data) {
        return 0;
      }

      return response.data.count;
    } catch {
      return 0;
    }
  }
}
