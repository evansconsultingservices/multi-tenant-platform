/**
 * API Key Service
 *
 * Manages API keys for company automation access.
 * Now uses the standalone API instead of direct Firestore calls.
 */

import { api } from './api';
import { APIKey, CreateAPIKeyInput, APIKeyResponse } from '@/types/apikey.types';

export class APIKeyService {
  /**
   * Generate a new API key for a company
   */
  static async generateAPIKey(
    companyId: string,
    input: CreateAPIKeyInput
  ): Promise<APIKeyResponse> {
    const response = await api.post<APIKeyResponse>('/api-keys', {
      companyId,
      name: input.name,
      permissions: input.permissions,
      expiresAt: input.expiresAt?.toISOString(),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create API key');
    }

    // Convert date strings to Date objects
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
    };
  }

  /**
   * Get all API keys for a company
   */
  static async getCompanyAPIKeys(companyId: string): Promise<APIKey[]> {
    const response = await api.get<APIKey[]>('/api-keys', { companyId });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch API keys');
    }

    // Convert date strings to Date objects
    return response.data.map(key => ({
      ...key,
      createdAt: new Date(key.createdAt),
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : undefined,
      expiresAt: key.expiresAt ? new Date(key.expiresAt) : undefined,
    }));
  }

  /**
   * Revoke an API key
   */
  static async revokeAPIKey(apiKeyId: string): Promise<void> {
    const response = await api.put(`/api-keys/${apiKeyId}/revoke`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to revoke API key');
    }
  }

  /**
   * Delete an API key permanently
   */
  static async deleteAPIKey(apiKeyId: string): Promise<void> {
    const response = await api.delete(`/api-keys/${apiKeyId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete API key');
    }
  }

  /**
   * Verify an API key
   * Note: This is now handled server-side by the API.
   * This method can be used to test if a key is valid.
   */
  static async verifyAPIKey(apiKey: string): Promise<APIKey | null> {
    try {
      const response = await api.post<APIKey>('/api-keys/verify', { key: apiKey });

      if (!response.success || !response.data) {
        return null;
      }

      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        lastUsedAt: response.data.lastUsedAt ? new Date(response.data.lastUsedAt) : undefined,
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined,
      };
    } catch {
      return null;
    }
  }
}
