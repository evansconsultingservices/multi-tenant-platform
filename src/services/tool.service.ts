import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Tool } from '../types/tool.types';
import { UserProfile } from '../types/user.types';

export class ToolService {
  /**
   * Get all available tools
   */
  static async getAllTools(): Promise<Tool[]> {
    try {
      const toolsRef = collection(db, 'tools');
      // Simple query without compound orderBy to avoid index requirements
      const querySnapshot = await getDocs(toolsRef);

      const tools = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Tool[];

      // Sort by displayOrder, then by name (in JavaScript to avoid Firestore index requirements)
      return tools.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error getting tools:', error);
      throw new Error('Failed to fetch tools');
    }
  }

  /**
   * Get the current user's company ID
   */
  private static async getUserCompanyId(userId: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }
      const userData = userDoc.data();
      return userData.companyId || userData.organizationId || null;
    } catch (error) {
      console.error('Error getting user company ID:', error);
      return null;
    }
  }

  /**
   * Get tools accessible by a company
   */
  static async getCompanyTools(companyId: string): Promise<Tool[]> {
    try {
      const accessRef = collection(db, 'companyToolAccess');
      const accessQuery = query(
        accessRef,
        where('companyId', '==', companyId),
        where('isActive', '==', true)
      );
      const accessSnapshot = await getDocs(accessQuery);

      if (accessSnapshot.empty) {
        return [];
      }

      const toolIds = accessSnapshot.docs.map(doc => doc.data().toolId);
      const tools: Tool[] = [];

      for (const toolId of toolIds) {
        const toolDoc = await getDoc(doc(db, 'tools', toolId));
        if (toolDoc.exists()) {
          tools.push({
            id: toolDoc.id,
            ...toolDoc.data(),
            createdAt: toolDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: toolDoc.data().updatedAt?.toDate() || new Date(),
          } as Tool);
        }
      }

      return tools.sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (error) {
      console.error('Error getting company tools:', error);
      throw new Error('Failed to fetch company tools');
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
    } catch (error) {
      console.error('Error granting company tool access:', error);
      throw new Error('Failed to grant company tool access');
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
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error revoking company tool access:', error);
      throw new Error('Failed to revoke company tool access');
    }
  }

  /**
   * Get tools accessible by a specific user (with role-based access)
   * Logic:
   * - super_admin: sees ALL tools (no company restriction)
   * - admin/user: company-based access with user-level overrides
   */
  static async getUserTools(userId: string): Promise<Tool[]> {
    try {
      // Step 1: Get user data to check role
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();
      const userRole = userData.role;

      // Step 2: Super admins see ALL tools
      if (userRole === 'super_admin') {
        return this.getAllTools();
      }

      const toolMap = new Map<string, Tool>();
      const explicitRevocations = new Set<string>();

      // Step 3: Get user's company ID
      const companyId = userData.companyId || userData.organizationId || null;

      // Step 4: Get company-level tool access
      if (companyId) {
        const companyTools = await this.getCompanyTools(companyId);
        companyTools.forEach(tool => {
          toolMap.set(tool.id, tool);
        });
      }

      // Step 5: Get user-level tool access (both active and inactive for override logic)
      const userAccessRef = collection(db, 'userToolAccess');
      const userAccessQuery = query(
        userAccessRef,
        where('userId', '==', userId)
      );
      const userAccessSnapshot = await getDocs(userAccessQuery);

      // Step 6: Process user-level access
      for (const accessDoc of userAccessSnapshot.docs) {
        const accessData = accessDoc.data();
        const toolId = accessData.toolId;

        if (accessData.isActive) {
          // Explicit grant - add tool even if not in company access
          if (!toolMap.has(toolId)) {
            const toolDoc = await getDoc(doc(db, 'tools', toolId));
            if (toolDoc.exists()) {
              toolMap.set(toolId, {
                id: toolDoc.id,
                ...toolDoc.data(),
                createdAt: toolDoc.data().createdAt?.toDate() || new Date(),
                updatedAt: toolDoc.data().updatedAt?.toDate() || new Date(),
              } as Tool);
            }
          }
        } else {
          // Explicit revocation - remove from access even if company has access
          explicitRevocations.add(toolId);
        }
      }

      // Step 7: Remove explicitly revoked tools
      explicitRevocations.forEach(toolId => {
        toolMap.delete(toolId);
      });

      // Step 8: Convert to array and sort
      const tools = Array.from(toolMap.values());
      return tools.sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (error) {
      console.error('Error getting user tools:', error);
      throw new Error('Failed to fetch user tools');
    }
  }

  /**
   * Create a new tool
   */
  static async createTool(toolData: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<string> {
    try {
      const toolsRef = collection(db, 'tools');
      const docRef = await addDoc(toolsRef, {
        ...toolData,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating tool:', error);
      throw new Error('Failed to create tool');
    }
  }

  /**
   * Update an existing tool
   */
  static async updateTool(toolId: string, updates: Partial<Tool>): Promise<void> {
    try {
      const toolRef = doc(db, 'tools', toolId);
      await updateDoc(toolRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating tool:', error);
      throw new Error('Failed to update tool');
    }
  }

  /**
   * Delete a tool
   */
  static async deleteTool(toolId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete the tool
      const toolRef = doc(db, 'tools', toolId);
      batch.delete(toolRef);

      // Delete all user access records for this tool
      const accessRef = collection(db, 'userToolAccess');
      const accessQuery = query(accessRef, where('toolId', '==', toolId));
      const accessSnapshot = await getDocs(accessQuery);

      accessSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting tool:', error);
      throw new Error('Failed to delete tool');
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
    try {
      const accessRef = collection(db, 'userToolAccess');

      // Check if access already exists
      const existingQuery = query(
        accessRef,
        where('userId', '==', userId),
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
          expiresAt: expiresAt || null,
        });
      } else {
        // Create new access record
        await addDoc(accessRef, {
          userId,
          toolId,
          accessLevel,
          grantedBy,
          grantedAt: serverTimestamp(),
          expiresAt: expiresAt || null,
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error granting tool access:', error);
      throw new Error('Failed to grant tool access');
    }
  }

  /**
   * Revoke tool access from a user
   */
  static async revokeToolAccess(userId: string, toolId: string): Promise<void> {
    try {
      const accessRef = collection(db, 'userToolAccess');
      const q = query(
        accessRef,
        where('userId', '==', userId),
        where('toolId', '==', toolId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error revoking tool access:', error);
      throw new Error('Failed to revoke tool access');
    }
  }

  /**
   * Get users who have access to a specific tool
   */
  static async getToolUsers(toolId: string): Promise<(UserProfile & { accessLevel: string })[]> {
    try {
      const accessRef = collection(db, 'userToolAccess');
      const q = query(
        accessRef,
        where('toolId', '==', toolId),
        where('isActive', '==', true)
      );
      const accessSnapshot = await getDocs(q);

      const users: (UserProfile & { accessLevel: string })[] = [];

      for (const accessDoc of accessSnapshot.docs) {
        const accessData = accessDoc.data();
        const userDoc = await getDoc(doc(db, 'users', accessData.userId));

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          users.push({
            ...userData,
            lastLogin: (userData.lastLogin as any)?.toDate?.() || userData.lastLogin || new Date(),
            accountCreated: (userData.accountCreated as any)?.toDate?.() || userData.accountCreated || new Date(),
            accessLevel: accessData.accessLevel,
          });
        }
      }

      return users;
    } catch (error) {
      console.error('Error getting tool users:', error);
      throw new Error('Failed to fetch tool users');
    }
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
      const logsRef = collection(db, 'toolUsageLogs');
      await addDoc(logsRef, {
        userId,
        toolId,
        action,
        timestamp: serverTimestamp(),
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Error logging tool usage:', error);
      // Don't throw error for logging - it shouldn't break the main flow
    }
  }

  /**
   * Check if user has access to a specific tool (with role-based and cascading company access)
   */
  static async hasToolAccess(userId: string, toolId: string): Promise<{ hasAccess: boolean; accessLevel?: string; source?: 'user' | 'company' | 'super_admin' }> {
    try {
      // Step 1: Check user role
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return { hasAccess: false };
      }
      const userData = userDoc.data();

      // Super admins have access to everything
      if (userData.role === 'super_admin') {
        return {
          hasAccess: true,
          accessLevel: 'admin',
          source: 'super_admin',
        };
      }

      // Step 2: Check for explicit user-level access (both active and inactive)
      const userAccessRef = collection(db, 'userToolAccess');
      const userAccessQuery = query(
        userAccessRef,
        where('userId', '==', userId),
        where('toolId', '==', toolId)
      );
      const userAccessSnapshot = await getDocs(userAccessQuery);

      if (!userAccessSnapshot.empty) {
        const userAccessData = userAccessSnapshot.docs[0].data();

        // If explicitly revoked, deny access regardless of company access
        if (!userAccessData.isActive) {
          return { hasAccess: false };
        }

        // If explicitly granted, allow access
        // Check if access has expired
        if (userAccessData.expiresAt && userAccessData.expiresAt.toDate() < new Date()) {
          return { hasAccess: false };
        }

        return {
          hasAccess: true,
          accessLevel: userAccessData.accessLevel,
          source: 'user',
        };
      }

      // Step 2: Check company-level access
      const companyId = await this.getUserCompanyId(userId);
      if (companyId) {
        const companyAccessRef = collection(db, 'companyToolAccess');
        const companyAccessQuery = query(
          companyAccessRef,
          where('companyId', '==', companyId),
          where('toolId', '==', toolId),
          where('isActive', '==', true)
        );
        const companyAccessSnapshot = await getDocs(companyAccessQuery);

        if (!companyAccessSnapshot.empty) {
          const companyAccessData = companyAccessSnapshot.docs[0].data();
          return {
            hasAccess: true,
            accessLevel: companyAccessData.accessLevel,
            source: 'company',
          };
        }
      }

      // No access found
      return { hasAccess: false };
    } catch (error) {
      console.error('Error checking tool access:', error);
      return { hasAccess: false };
    }
  }
}