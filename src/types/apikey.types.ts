export interface APIKey {
  id: string;
  companyId: string;
  name: string;
  key: string; // The actual API key (only shown once during creation)
  keyPrefix: string; // First 8 characters for display (e.g., "sk_test_...")
  status: 'active' | 'revoked';
  createdAt: Date;
  createdBy: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions: string[]; // e.g., ['read', 'write', 'admin']
}

export interface CreateAPIKeyInput {
  name: string;
  permissions: string[];
  expiresAt?: Date;
}

export interface APIKeyResponse {
  id: string;
  key: string; // Full key - only returned once
  name: string;
  keyPrefix: string;
  status: 'active' | 'revoked';
  createdAt: Date;
  permissions: string[];
}
