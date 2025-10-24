export interface Tool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  url: string;
  status: 'active' | 'inactive' | 'maintenance';
  category: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Access configuration
  accessLevels: ToolAccessLevel[];
  requiredRole: 'user' | 'admin' | 'super_admin';
  isPublic: boolean;

  // Technical details
  subdomain?: string;
  port?: number;
  healthCheckUrl?: string;

  // UI configuration
  displayOrder: number;
  featured: boolean;
  tags: string[];
}

export interface ToolAccessLevel {
  level: 'read' | 'write' | 'admin';
  description: string;
  permissions: string[];
}

export interface UserToolAccess {
  userId: string;
  toolId: string;
  accessLevel: 'read' | 'write' | 'admin';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface ToolUsageLog {
  id: string;
  userId: string;
  toolId: string;
  action: 'access' | 'login' | 'logout' | 'error';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ToolConfiguration {
  id: string;
  toolId: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isSecret: boolean;
  description?: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Company-level tool access (grants access to all users in the company)
 */
export interface CompanyToolAccess {
  id: string;
  companyId: string;
  toolId: string;
  accessLevel: 'read' | 'write' | 'admin';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}