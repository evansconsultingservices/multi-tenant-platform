# Company Management System Documentation

## Overview

The multi-tenant platform now supports **company-based data isolation** with cascading tool access control. Each user belongs to a company, and all data is automatically scoped to their company using the `companyId` field.

## Key Features

- ✅ **Company CRUD Operations** - Create, read, update, and delete companies
- ✅ **Multi-Tenant Data Isolation** - Each company's data is automatically isolated
- ✅ **Cascading Tool Access** - Company-level and user-level access control
- ✅ **Firestore Security Rules** - Database-level access enforcement
- ✅ **Module Federation Sharing** - Child tools automatically inherit authentication and company context
- ✅ **Backward Compatibility** - Supports both `companyId` and `organizationId` fields

---

## Data Isolation Architecture

### Company ID Partitioning

All Firestore documents include a `companyId` field that determines data ownership:

```
users/
  ├─ user1 (companyId: "company-a")
  ├─ user2 (companyId: "company-a")
  └─ user3 (companyId: "company-b")

tools/
  ├─ tool1 (global - no companyId)
  └─ tool2 (global - no companyId)

companyToolAccess/
  ├─ access1 (companyId: "company-a", toolId: "tool1")
  └─ access2 (companyId: "company-b", toolId: "tool2")

userToolAccess/
  ├─ access1 (userId: "user1", toolId: "tool1")
  └─ access2 (userId: "user2", toolId: "tool2")
```

### BaseCompanyService

All database queries automatically filter by the current user's `companyId`:

```typescript
// services/base.service.ts

export abstract class BaseCompanyService {
  // Automatically gets companyId from authenticated user
  protected static async getCurrentCompanyId(): Promise<string>

  // All queries auto-inject where('companyId', '==', currentCompanyId)
  protected static async queryByCompany<T>(
    collectionName: string,
    ...additionalConstraints: QueryConstraint[]
  ): Promise<T[]>

  // All document creation auto-injects companyId
  protected static async createWithCompanyId(
    collectionName: string,
    data: any
  ): Promise<string>
}
```

**Usage Example:**

```typescript
import { BaseCompanyService } from '@/services/base.service';

class CustomService extends BaseCompanyService {
  static async getMyCompanyData() {
    // Automatically filters by current user's companyId
    return await this.queryByCompany('myCollection');
  }

  static async createData(data: any) {
    // Automatically adds companyId to the document
    return await this.createWithCompanyId('myCollection', data);
  }
}
```

---

## Tool Access Control (Cascading Logic)

### Access Levels

Tool access is determined by **cascading rules**:

1. **Company-level access** → All users in company get access
2. **User-level grant** → Specific user gets access (even if company doesn't have access)
3. **User-level revoke** → Specific user loses access (even if company has access)

### Priority Order

```
User-level revoke (isActive: false)  [HIGHEST PRIORITY]
  ↓
User-level grant (isActive: true)
  ↓
Company-level access
  ↓
No access [DEFAULT]
```

### Example Scenarios

**Scenario 1: Company access grants user access**

```
Company A has access to Tool 1
User from Company A → Can access Tool 1 ✅
```

**Scenario 2: User-level grant overrides company**

```
Company B has NO access to Tool 1
User X from Company B has explicit grant → Can access Tool 1 ✅
```

**Scenario 3: User-level revoke overrides company**

```
Company A has access to Tool 1
User Y from Company A has explicit revoke → Cannot access Tool 1 ❌
```

### API Methods

```typescript
import { ToolService } from '@/services/tool.service';

// Company-level access
await ToolService.grantCompanyToolAccess(companyId, toolId, 'read', grantedBy);
await ToolService.revokeCompanyToolAccess(companyId, toolId);
await ToolService.getCompanyTools(companyId);

// User-level access
await ToolService.grantToolAccess(userId, toolId, 'read', grantedBy);
await ToolService.revokeToolAccess(userId, toolId);
await ToolService.getUserTools(userId); // Respects cascading logic

// Check access with cascading
const { hasAccess, accessLevel, source } = await ToolService.hasToolAccess(userId, toolId);
// source: 'user' | 'company'
```

---

## Admin UI

### Companies Tab

Navigate to **Admin Panel → Companies** to:

- ✅ View all companies
- ✅ Create new companies with subscription tiers
- ✅ Edit company details (name, contact, status)
- ✅ Enable/Disable companies
- ✅ Delete companies
- ✅ Search companies

### User Management with Companies

Navigate to **Admin Panel → Users** to:

- ✅ See which company each user belongs to
- ✅ Create users and assign them to companies (required field)
- ✅ Company selector dropdown when inviting users

---

## Firestore Security Rules

Database-level access control is enforced via `firestore.rules`:

```javascript
// Helper function - Gets user's company ID (supports both companyId and organizationId)
function getUserCompanyId() {
  let userData = getUserData();
  return userData.companyId != null ? userData.companyId : userData.organizationId;
}

// Users can only read data from their company
match /users/{userId} {
  allow read: if request.auth != null && (
    request.auth.uid == userId ||
    isAdmin() ||
    docBelongsToUserCompany(resource.data)
  );
}

// Audit logs - only company data visible
match /auditLogs/{logId} {
  allow read: if request.auth != null &&
    (docBelongsToUserCompany(resource.data) || isSuperAdmin());
}
```

### Deploying Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## Module Federation Integration

### Exposed Modules from Parent Shell

The parent shell (`multi-tenant-platform`) exposes these modules to child tools:

```javascript
// craco.config.js - exposes section
exposes: {
  "./AuthContext": "./src/contexts/AuthContext",
  "./BaseCompanyService": "./src/services/base.service",
  "./Firebase": "./src/services/firebase",
}
```

### Using in Child Tools

#### 1. Import AuthContext

```typescript
// In child tool (e.g., hello-world-tool/src/App.tsx)
import { useAuth } from 'shell/AuthContext';

function ChildToolApp() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  // Access company ID
  const companyId = user.companyId || user.organizationId;

  return (
    <div>
      <h1>Welcome {user.firstName}!</h1>
      <p>Company: {companyId}</p>
    </div>
  );
}
```

#### 2. Use BaseCompanyService for Data Queries

```typescript
// In child tool service (e.g., hello-world-tool/src/services/data.service.ts)
import { BaseCompanyService } from 'shell/BaseCompanyService';
import { db } from 'shell/Firebase';
import { collection, query, where } from 'firebase/firestore';

class ChildToolDataService extends BaseCompanyService {
  // All queries automatically filtered by current user's companyId
  static async getMyData() {
    return await this.queryByCompany('myChildToolCollection');
  }

  static async createData(data: any) {
    // Automatically adds companyId
    return await this.createWithCompanyId('myChildToolCollection', data);
  }
}
```

#### 3. Update Child Tool craco.config.js

```javascript
// child_apps/hello-world-tool/craco.config.js
new ModuleFederationPlugin({
  name: "helloWorld",
  filename: "remoteEntry.js",
  remotes: {
    // Import from parent shell
    shell: "shell@http://localhost:3000/remoteEntry.js",
  },
  exposes: {
    "./App": "./src/App",
  },
  shared: {
    // Share React and Firebase dependencies
    react: { singleton: true, eager: true },
    "react-dom": { singleton: true, eager: true },
    firebase: { singleton: true },
    // ... other shared deps
  },
})
```

---

## TypeScript Type Definitions

### Company Types

```typescript
// src/types/company.types.ts

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface Company {
  id: string;
  name: string;
  slug: string; // URL-friendly unique identifier
  status: CompanyStatus;
  contactEmail: string;
  website?: string;
  phone?: string;
  description?: string;
  subscription: CompanySubscription;
  settings: CompanySettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CompanySubscription {
  tier: SubscriptionTier;
  maxUsers: number;
  maxStorage: number; // in GB
  features: string[];
}

export interface CompanyToolAccess {
  id: string;
  companyId: string;
  toolId: string;
  accessLevel: 'read' | 'write' | 'admin';
  grantedAt: Date;
  grantedBy: string;
  isActive: boolean;
}
```

### User Types (Updated)

```typescript
// src/types/user.types.ts

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string; // Reference to Company document
  role: UserRole;
  // ... other fields
}
```

---

## Migration Guide (organizationId → companyId)

### Backward Compatibility

The system supports **both** `companyId` and `organizationId` during migration:

```typescript
// All helper functions check both fields
function getUserCompanyId() {
  let userData = getUserData();
  return userData.companyId != null ? userData.companyId : userData.organizationId;
}
```

### Migration Steps

1. **Update user documents** to include `companyId`:

```javascript
// Firebase Console or migration script
db.collection('users').get().then(snapshot => {
  snapshot.forEach(doc => {
    const userData = doc.data();
    if (!userData.companyId && userData.organizationId) {
      doc.ref.update({
        companyId: userData.organizationId
      });
    }
  });
});
```

2. **Update code** to use `companyId` instead of `organizationId`:

```typescript
// Before
user.organizationId

// After
user.companyId || user.organizationId // During migration
user.companyId // After complete migration
```

3. **Deploy Firestore rules** that support both fields

4. **Remove `organizationId` field** after full migration (optional)

---

## Testing

### Deploy Firestore Configuration

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Test Company Management

1. Navigate to Admin Panel → Companies
2. Create a test company
3. Create a user assigned to that company
4. Verify data isolation by:
   - Logging in as user from Company A
   - Confirming they cannot see Company B's data

### Test Tool Access

1. Grant company-level access to a tool
2. Verify all users in company can access tool
3. Revoke access for specific user
4. Verify user cannot access tool despite company access

---

## Troubleshooting

### Child tools can't access AuthContext

**Solution:** Ensure the parent shell is running on port 3000 and the `exposes` section is configured in craco.config.js

### Data not filtered by company

**Solution:**
1. Verify all services extend `BaseCompanyService`
2. Use `queryByCompany()` instead of raw Firestore queries
3. Check Firestore rules are deployed

### Module Federation errors

**Solution:**
1. Restart both parent and child dev servers
2. Clear browser cache and localStorage
3. Verify shared dependencies match between parent and child

---

## API Reference

### CompanyService

```typescript
// Create company
CompanyService.createCompany(input: CreateCompanyInput, createdByUserId: string): Promise<string>

// Get all companies
CompanyService.getAllCompanies(): Promise<Company[]>

// Get company by ID
CompanyService.getCompanyById(companyId: string): Promise<Company | null>

// Get company by slug
CompanyService.getCompanyBySlug(slug: string): Promise<Company | null>

// Update company
CompanyService.updateCompany(companyId: string, updates: UpdateCompanyInput): Promise<void>

// Delete company
CompanyService.deleteCompany(companyId: string): Promise<void>

// Enable/Disable
CompanyService.enableCompany(companyId: string): Promise<void>
CompanyService.disableCompany(companyId: string): Promise<void>

// Get users by company
CompanyService.getUsersByCompany(companyId: string): Promise<any[]>

// Tool access
CompanyService.grantCompanyToolAccess(companyId: string, toolId: string, accessLevel: string, grantedBy: string): Promise<void>
CompanyService.revokeCompanyToolAccess(companyId: string, toolId: string): Promise<void>
```

### ToolService (with cascading)

```typescript
// Get tools with cascading logic
ToolService.getUserTools(userId: string): Promise<Tool[]>
ToolService.getCompanyTools(companyId: string): Promise<Tool[]>

// Check access with cascading
ToolService.hasToolAccess(userId: string, toolId: string): Promise<{
  hasAccess: boolean;
  accessLevel?: string;
  source?: 'user' | 'company';
}>

// Company access management
ToolService.grantCompanyToolAccess(companyId: string, toolId: string, accessLevel: string, grantedBy: string): Promise<void>
ToolService.revokeCompanyToolAccess(companyId: string, toolId: string): Promise<void>

// User access management
ToolService.grantToolAccess(userId: string, toolId: string, accessLevel: string, grantedBy: string, expiresAt?: Date): Promise<void>
ToolService.revokeToolAccess(userId: string, toolId: string): Promise<void>
```

---

## Summary

✅ **All 16 implementation tasks completed**

The company management system provides:

1. **Complete data isolation** at the database level
2. **Flexible tool access control** with cascading rules
3. **Admin UI** for managing companies and users
4. **Module Federation integration** for child tools
5. **Backward compatibility** with existing organizationId fields
6. **Security enforcement** via Firestore rules

Child tools automatically inherit the authentication context and can use `BaseCompanyService` to ensure all their data queries are scoped to the current user's company, providing seamless multi-tenant data isolation across the entire platform.
