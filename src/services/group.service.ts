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
} from 'firebase/firestore';
import { db } from './firebase';
import { BaseCompanyService } from './base.service';
import { CompanyGroup, CreateGroupInput, UpdateGroupInput } from '../types/group.types';

export class GroupService extends BaseCompanyService {
  private static readonly COLLECTION = 'groups';

  /**
   * Get all groups (super admin only)
   * Returns all groups without company filtering
   */
  static async getAllGroups(): Promise<CompanyGroup[]> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can manage groups');
      }

      const groupsRef = collection(db, this.COLLECTION);
      const q = query(groupsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const groups: CompanyGroup[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const group: CompanyGroup = {
          id: docSnap.id,
          groupId: data.groupId,
          name: data.name,
          description: data.description,
          createdAt: this.convertTimestamps({ date: data.createdAt }).date || new Date(),
          createdBy: data.createdBy,
          updatedAt: this.convertTimestamps({ date: data.updatedAt }).date || new Date(),
          updatedBy: data.updatedBy || data.createdBy,
        };

        // Get company count for this group
        group.companyCount = await this.getGroupCompanyCount(group.groupId);

        groups.push(group);
      }

      return groups;
    } catch (error) {
      console.error('Error getting all groups:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch groups');
    }
  }

  /**
   * Get a group by document ID
   */
  static async getGroupById(id: string): Promise<CompanyGroup | null> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can manage groups');
      }

      const groupDoc = await getDoc(doc(db, this.COLLECTION, id));

      if (!groupDoc.exists()) {
        return null;
      }

      const data = groupDoc.data();
      const group: CompanyGroup = {
        id: groupDoc.id,
        groupId: data.groupId,
        name: data.name,
        description: data.description,
        createdAt: this.convertTimestamps({ date: data.createdAt }).date || new Date(),
        createdBy: data.createdBy,
        updatedAt: this.convertTimestamps({ date: data.updatedAt }).date || new Date(),
        updatedBy: data.updatedBy || data.createdBy,
      };

      // Get company count
      group.companyCount = await this.getGroupCompanyCount(group.groupId);

      return group;
    } catch (error) {
      console.error('Error getting group by ID:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch group');
    }
  }

  /**
   * Get a group by groupId string
   */
  static async getGroupByGroupId(groupId: string): Promise<CompanyGroup | null> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can manage groups');
      }

      const groupsRef = collection(db, this.COLLECTION);
      const q = query(groupsRef, where('groupId', '==', groupId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data();

      const group: CompanyGroup = {
        id: docSnap.id,
        groupId: data.groupId,
        name: data.name,
        description: data.description,
        createdAt: this.convertTimestamps({ date: data.createdAt }).date || new Date(),
        createdBy: data.createdBy,
        updatedAt: this.convertTimestamps({ date: data.updatedAt }).date || new Date(),
        updatedBy: data.updatedBy || data.createdBy,
      };

      // Get company count
      group.companyCount = await this.getGroupCompanyCount(group.groupId);

      return group;
    } catch (error) {
      console.error('Error getting group by groupId:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch group');
    }
  }

  /**
   * Validate groupId format and uniqueness
   */
  static async validateGroupId(groupId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can manage groups');
      }

      // Check format: lowercase letters, numbers, hyphens only
      const formatRegex = /^[a-z0-9-]+$/;
      if (!formatRegex.test(groupId)) {
        return {
          valid: false,
          error: 'Group ID must contain only lowercase letters, numbers, and hyphens',
        };
      }

      // Check minimum length
      if (groupId.length < 3) {
        return {
          valid: false,
          error: 'Group ID must be at least 3 characters long',
        };
      }

      // Check uniqueness
      const existingGroup = await this.getGroupByGroupId(groupId);
      if (existingGroup) {
        return {
          valid: false,
          error: 'This Group ID is already in use',
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating groupId:', error);
      throw error instanceof Error ? error : new Error('Failed to validate group ID');
    }
  }

  /**
   * Create a new group
   */
  static async createGroup(input: CreateGroupInput, userId: string): Promise<string> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can create groups');
      }

      // Validate groupId
      const validation = await this.validateGroupId(input.groupId);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const groupsRef = collection(db, this.COLLECTION);

      const groupData = {
        groupId: input.groupId.toLowerCase().trim(),
        name: input.name.trim(),
        description: input.description?.trim() || '',
        createdAt: serverTimestamp(),
        createdBy: userId,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      };

      const docRef = await addDoc(groupsRef, groupData);

      await this.logAuditEvent('group_created', 'group', docRef.id, {
        groupId: input.groupId,
        name: input.name,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error instanceof Error ? error : new Error('Failed to create group');
    }
  }

  /**
   * Update a group
   */
  static async updateGroup(id: string, updates: UpdateGroupInput, userId: string): Promise<void> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can update groups');
      }

      const groupRef = doc(db, this.COLLECTION, id);

      // Verify group exists
      const groupDoc = await getDoc(groupRef);
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const updateData: any = {
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description.trim();
      }

      await updateDoc(groupRef, updateData);

      await this.logAuditEvent('group_updated', 'group', id, updates);
    } catch (error) {
      console.error('Error updating group:', error);
      throw error instanceof Error ? error : new Error('Failed to update group');
    }
  }

  /**
   * Delete a group
   * Can only delete if no companies are assigned to this group
   */
  static async deleteGroup(id: string, userId: string): Promise<void> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can delete groups');
      }

      const groupDoc = await getDoc(doc(db, this.COLLECTION, id));

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const data = groupDoc.data();
      const groupId = data.groupId;

      // Check if any companies are using this group
      const companyCount = await this.getGroupCompanyCount(groupId);
      if (companyCount > 0) {
        throw new Error(
          `Cannot delete group: ${companyCount} company(companies) are currently assigned to this group. Please reassign or remove these companies first.`
        );
      }

      // Delete the group document
      const groupRef = doc(db, this.COLLECTION, id);
      await updateDoc(groupRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: userId,
      });

      await this.logAuditEvent('group_deleted', 'group', id, {
        groupId,
        name: data.name,
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error instanceof Error ? error : new Error('Failed to delete group');
    }
  }

  /**
   * Get all companies using a specific groupId
   */
  static async getGroupCompanies(groupId: string): Promise<any[]> {
    try {
      // Verify super admin access
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        throw new Error('Access denied: Only super admins can view group companies');
      }

      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('groupId', '==', groupId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      }));
    } catch (error) {
      console.error('Error getting group companies:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch group companies');
    }
  }

  /**
   * Get count of companies using a specific groupId
   */
  static async getGroupCompanyCount(groupId: string): Promise<number> {
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('groupId', '==', groupId));
      const snapshot = await getDocs(q);

      return snapshot.docs.length;
    } catch (error) {
      console.error('Error getting group company count:', error);
      return 0;
    }
  }
}
