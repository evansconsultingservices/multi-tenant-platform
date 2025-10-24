import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Company,
  CompanyStatus,
  CompanyToolAccess,
  CreateCompanyInput,
  UpdateCompanyInput,
  SubscriptionTier,
  SubscriptionStatus,
} from '../types/company.types';
import { BaseCompanyService } from './base.service';

export class CompanyService extends BaseCompanyService {

  /**
   * Get all companies (Admin/Super Admin only)
   */
  static async getAllCompanies(): Promise<Company[]> {
    try {
      // Check if user is admin/super admin
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        const user = await this.getCurrentUser();
        if (user.role !== 'admin') {
          throw new Error('Access denied: Only admins can view all companies');
        }
      }

      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const companies = querySnapshot.docs.map(doc =>
        this.convertDocToCompany(doc.id, doc.data())
      );

      // Optionally load user counts for each company
      for (const company of companies) {
        company.userCount = await this.getCompanyUserCount(company.id);
        company.toolsCount = await this.getCompanyToolsCount(company.id);
      }

      return companies;
    } catch (error) {
      console.error('Error getting all companies:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch companies');
    }
  }

  /**
   * Get a company by ID
   */
  static async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));

      if (!companyDoc.exists()) {
        return null;
      }

      const company = this.convertDocToCompany(companyDoc.id, companyDoc.data());
      company.userCount = await this.getCompanyUserCount(company.id);
      company.toolsCount = await this.getCompanyToolsCount(company.id);

      return company;
    } catch (error) {
      console.error('Error getting company by ID:', error);
      throw new Error('Failed to fetch company');
    }
  }

  /**
   * Get a company by slug
   */
  static async getCompanyBySlug(slug: string): Promise<Company | null> {
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const companyDoc = querySnapshot.docs[0];
      return this.convertDocToCompany(companyDoc.id, companyDoc.data());
    } catch (error) {
      console.error('Error getting company by slug:', error);
      throw new Error('Failed to fetch company');
    }
  }

  /**
   * Create a new company
   */
  static async createCompany(input: CreateCompanyInput, createdByUserId: string): Promise<string> {
    try {
      // Generate slug if not provided
      const slug = input.slug || this.generateSlug(input.name);

      // Check if slug is unique
      const existingCompany = await this.getCompanyBySlug(slug);
      if (existingCompany) {
        throw new Error(`Company with slug "${slug}" already exists`);
      }

      const companiesRef = collection(db, 'companies');

      const companyData = {
        name: input.name,
        slug,
        description: input.description || '',
        status: input.status || CompanyStatus.ACTIVE,
        contactEmail: input.contactEmail,
        website: input.website || '',
        logoUrl: '',
        subscription: {
          tier: input.subscriptionTier || SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
        },
        settings: {
          featuresEnabled: [],
          maxUsers: this.getMaxUsersByTier(input.subscriptionTier || SubscriptionTier.FREE),
          maxStorageGB: this.getMaxStorageByTier(input.subscriptionTier || SubscriptionTier.FREE),
          customDatabaseConfig: {
            enabled: false,
          },
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: createdByUserId,
      };

      const docRef = await addDoc(companiesRef, companyData);

      await this.logAuditEvent('company_created', 'company', docRef.id, {
        companyName: input.name,
        slug,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error instanceof Error ? error : new Error('Failed to create company');
    }
  }

  /**
   * Update a company
   */
  static async updateCompany(companyId: string, updates: UpdateCompanyInput): Promise<void> {
    try {
      const companyRef = doc(db, 'companies', companyId);

      // Verify company exists
      const companyDoc = await getDoc(companyRef);
      if (!companyDoc.exists()) {
        throw new Error('Company not found');
      }

      await updateDoc(companyRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await this.logAuditEvent('company_updated', 'company', companyId, updates);
    } catch (error) {
      console.error('Error updating company:', error);
      throw error instanceof Error ? error : new Error('Failed to update company');
    }
  }

  /**
   * Delete a company (soft delete - set status to inactive)
   */
  static async deleteCompany(companyId: string): Promise<void> {
    try {
      // Check if company has users
      const userCount = await this.getCompanyUserCount(companyId);
      if (userCount > 0) {
        throw new Error('Cannot delete company with active users. Please reassign or remove users first.');
      }

      const companyRef = doc(db, 'companies', companyId);

      await updateDoc(companyRef, {
        status: CompanyStatus.INACTIVE,
        updatedAt: serverTimestamp(),
      });

      await this.logAuditEvent('company_deleted', 'company', companyId);
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error instanceof Error ? error : new Error('Failed to delete company');
    }
  }

  /**
   * Enable a company (set status to active)
   */
  static async enableCompany(companyId: string): Promise<void> {
    try {
      const companyRef = doc(db, 'companies', companyId);

      await updateDoc(companyRef, {
        status: CompanyStatus.ACTIVE,
        updatedAt: serverTimestamp(),
      });

      await this.logAuditEvent('company_enabled', 'company', companyId);
    } catch (error) {
      console.error('Error enabling company:', error);
      throw new Error('Failed to enable company');
    }
  }

  /**
   * Disable a company (set status to inactive)
   */
  static async disableCompany(companyId: string): Promise<void> {
    try {
      const companyRef = doc(db, 'companies', companyId);

      await updateDoc(companyRef, {
        status: CompanyStatus.INACTIVE,
        updatedAt: serverTimestamp(),
      });

      await this.logAuditEvent('company_disabled', 'company', companyId);
    } catch (error) {
      console.error('Error disabling company:', error);
      throw new Error('Failed to disable company');
    }
  }

  /**
   * Search companies by name
   */
  static async searchCompanies(searchTerm: string): Promise<Company[]> {
    try {
      // Get all companies and filter in JavaScript (Firestore doesn't support full-text search)
      const allCompanies = await this.getAllCompanies();

      const lowerSearch = searchTerm.toLowerCase();
      return allCompanies.filter(company =>
        company.name.toLowerCase().includes(lowerSearch) ||
        company.slug.toLowerCase().includes(lowerSearch) ||
        company.contactEmail.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('Error searching companies:', error);
      throw new Error('Failed to search companies');
    }
  }

  /**
   * Get all users in a company
   */
  static async getCompanyUsers(companyId: string): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      // Support both companyId and organizationId for migration
      const q1 = query(usersRef, where('companyId', '==', companyId));
      const q2 = query(usersRef, where('organizationId', '==', companyId));

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      const users = [
        ...snapshot1.docs.map(doc => ({ id: doc.id, ...this.convertTimestamps(doc.data()) })),
        ...snapshot2.docs.map(doc => ({ id: doc.id, ...this.convertTimestamps(doc.data()) })),
      ];

      // Deduplicate by id
      const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

      return uniqueUsers;
    } catch (error) {
      console.error('Error getting company users:', error);
      throw new Error('Failed to fetch company users');
    }
  }

  /**
   * Get count of users in a company
   */
  static async getCompanyUserCount(companyId: string): Promise<number> {
    try {
      const users = await this.getCompanyUsers(companyId);
      return users.length;
    } catch (error) {
      console.error('Error getting company user count:', error);
      return 0;
    }
  }

  /**
   * Get all tools accessible to a company
   */
  static async getCompanyTools(companyId: string): Promise<CompanyToolAccess[]> {
    try {
      const accessRef = collection(db, 'companyToolAccess');
      const q = query(
        accessRef,
        where('companyId', '==', companyId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as CompanyToolAccess[];
    } catch (error) {
      console.error('Error getting company tools:', error);
      throw new Error('Failed to fetch company tools');
    }
  }

  /**
   * Get count of tools accessible to a company
   */
  static async getCompanyToolsCount(companyId: string): Promise<number> {
    try {
      const tools = await this.getCompanyTools(companyId);
      return tools.length;
    } catch (error) {
      console.error('Error getting company tools count:', error);
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
    try {
      const accessRef = collection(db, 'companyToolAccess');

      // Check if access already exists
      const existingQuery = query(
        accessRef,
        where('companyId', '==', companyId),
        where('toolId', '==', toolId),
        where('isActive', '==', true)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        // Update existing access
        const existingDoc = existingSnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          accessLevel,
          grantedBy,
          grantedAt: serverTimestamp(),
        });
      } else {
        // Create new access record
        await addDoc(accessRef, {
          companyId,
          toolId,
          accessLevel,
          grantedBy,
          grantedAt: serverTimestamp(),
          isActive: true,
        });
      }

      await this.logAuditEvent('company_tool_access_granted', 'companyToolAccess', `${companyId}-${toolId}`, {
        companyId,
        toolId,
        accessLevel,
      });
    } catch (error) {
      console.error('Error granting company tool access:', error);
      throw new Error('Failed to grant tool access to company');
    }
  }

  /**
   * Revoke tool access from a company
   */
  static async revokeCompanyToolAccess(companyId: string, toolId: string): Promise<void> {
    try {
      const accessRef = collection(db, 'companyToolAccess');
      const q = query(
        accessRef,
        where('companyId', '==', companyId),
        where('toolId', '==', toolId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();

      await this.logAuditEvent('company_tool_access_revoked', 'companyToolAccess', `${companyId}-${toolId}`, {
        companyId,
        toolId,
      });
    } catch (error) {
      console.error('Error revoking company tool access:', error);
      throw new Error('Failed to revoke tool access from company');
    }
  }

  /**
   * Helper: Convert Firestore document to Company object
   */
  private static convertDocToCompany(id: string, data: any): Company {
    return {
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status,
      contactEmail: data.contactEmail,
      website: data.website,
      phone: data.phone,
      logoUrl: data.logoUrl,
      subscription: {
        ...data.subscription,
        startDate: this.convertTimestamps({ date: data.subscription?.startDate }).date || new Date(),
        endDate: data.subscription?.endDate ?
          this.convertTimestamps({ date: data.subscription.endDate }).date : undefined,
      },
      settings: data.settings || {
        featuresEnabled: [],
        maxUsers: 10,
        maxStorageGB: 5,
      },
      createdAt: this.convertTimestamps({ date: data.createdAt }).date || new Date(),
      updatedAt: this.convertTimestamps({ date: data.updatedAt }).date || new Date(),
      createdBy: data.createdBy,
    };
  }

  /**
   * Helper: Generate URL-friendly slug from company name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper: Get max users by subscription tier
   */
  private static getMaxUsersByTier(tier: SubscriptionTier): number {
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
   * Helper: Get max storage by subscription tier
   */
  private static getMaxStorageByTier(tier: SubscriptionTier): number {
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
