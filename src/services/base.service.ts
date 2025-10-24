import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';

/**
 * Base service class that provides company-scoped database operations.
 * All services that need to work with company-specific data should extend this class.
 *
 * This class automatically:
 * - Injects companyId into all queries
 * - Validates companyId on all operations
 * - Provides super admin bypass methods
 */
export abstract class BaseCompanyService {

  /**
   * Get the current authenticated user's company ID
   *
   * @throws Error if user is not authenticated or doesn't have a company
   */
  protected static async getCurrentCompanyId(): Promise<string> {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User must be authenticated to perform this operation');
    }

    // Get user profile which contains companyId
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    const companyId = userData.companyId || userData.organizationId; // Support both for migration

    if (!companyId) {
      throw new Error('User is not assigned to a company. Please contact your administrator.');
    }

    return companyId;
  }

  /**
   * Get the current authenticated user's full profile
   */
  protected static async getCurrentUser(): Promise<any> {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  }

  /**
   * Check if current user is a super admin
   */
  protected static async isSuperAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.role === 'super_admin';
    } catch {
      return false;
    }
  }

  /**
   * Query documents filtered by current user's company
   *
   * @param collectionName - Firestore collection name
   * @param additionalConstraints - Additional query constraints (orderBy, limit, etc.)
   * @returns Array of documents with id and data
   */
  protected static async queryByCompany<T>(
    collectionName: string,
    ...additionalConstraints: QueryConstraint[]
  ): Promise<T[]> {
    const companyId = await this.getCurrentCompanyId();

    const q = query(
      collection(db, collectionName),
      where('companyId', '==', companyId),
      ...additionalConstraints
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data()),
    })) as T[];
  }

  /**
   * Query documents for a specific company (admin/super admin only)
   *
   * @param collectionName - Firestore collection name
   * @param companyId - Company ID to query
   * @param additionalConstraints - Additional query constraints
   */
  protected static async queryByCompanyId<T>(
    collectionName: string,
    companyId: string,
    ...additionalConstraints: QueryConstraint[]
  ): Promise<T[]> {
    const q = query(
      collection(db, collectionName),
      where('companyId', '==', companyId),
      ...additionalConstraints
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data()),
    })) as T[];
  }

  /**
   * Create a document with automatic companyId injection
   *
   * @param collectionName - Firestore collection name
   * @param data - Document data (companyId will be auto-added)
   * @returns Document ID
   */
  protected static async createWithCompanyId(
    collectionName: string,
    data: any
  ): Promise<string> {
    const companyId = await this.getCurrentCompanyId();
    const user = await this.getCurrentUser();

    const docData = {
      ...data,
      companyId, // Automatically inject companyId
      createdAt: serverTimestamp(),
      createdBy: user.id,
      updatedAt: serverTimestamp(),
    };

    // Validate: Don't allow overriding companyId
    if (data.companyId && data.companyId !== companyId) {
      throw new Error('Cannot create document for a different company');
    }

    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
  }

  /**
   * Create a document for a specific company (admin/super admin only)
   */
  protected static async createWithSpecificCompanyId(
    collectionName: string,
    companyId: string,
    data: any
  ): Promise<string> {
    const user = await this.getCurrentUser();

    const docData = {
      ...data,
      companyId,
      createdAt: serverTimestamp(),
      createdBy: user.id,
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
  }

  /**
   * Update a document with company validation
   *
   * @param collectionName - Firestore collection name
   * @param documentId - Document ID to update
   * @param updates - Fields to update
   */
  protected static async updateByCompany(
    collectionName: string,
    documentId: string,
    updates: any
  ): Promise<void> {
    const companyId = await this.getCurrentCompanyId();

    // First verify the document belongs to this company
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const docData = docSnap.data();
    const docCompanyId = docData.companyId || docData.organizationId; // Support both

    if (docCompanyId !== companyId) {
      throw new Error('Access denied: Document belongs to a different company');
    }

    // Remove fields that shouldn't be updated
    const { companyId: _, createdAt: __, createdBy: ___, ...allowedUpdates } = updates;

    await updateDoc(docRef, {
      ...allowedUpdates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a document with company validation
   *
   * @param collectionName - Firestore collection name
   * @param documentId - Document ID to delete
   */
  protected static async deleteByCompany(
    collectionName: string,
    documentId: string
  ): Promise<void> {
    const companyId = await this.getCurrentCompanyId();

    // First verify the document belongs to this company
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const docData = docSnap.data();
    const docCompanyId = docData.companyId || docData.organizationId;

    if (docCompanyId !== companyId) {
      throw new Error('Access denied: Document belongs to a different company');
    }

    await deleteDoc(docRef);
  }

  /**
   * Get a single document by ID with company validation
   */
  protected static async getByIdWithCompanyCheck<T>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    const companyId = await this.getCurrentCompanyId();

    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const docData = docSnap.data();
    const docCompanyId = docData.companyId || docData.organizationId;

    if (docCompanyId !== companyId) {
      throw new Error('Access denied: Document belongs to a different company');
    }

    return {
      id: docSnap.id,
      ...this.convertTimestamps(docData),
    } as T;
  }

  /**
   * Convert Firestore Timestamps to JavaScript Dates
   */
  protected static convertTimestamps(data: any): any {
    const converted = { ...data };

    Object.keys(converted).forEach(key => {
      const value = converted[key];

      if (value instanceof Timestamp) {
        converted[key] = value.toDate();
      } else if (value && typeof value === 'object' && value.toDate) {
        converted[key] = value.toDate();
      }
    });

    return converted;
  }

  /**
   * Log an audit event for compliance
   */
  protected static async logAuditEvent(
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const companyId = await this.getCurrentCompanyId();

      await addDoc(collection(db, 'auditLogs'), {
        companyId,
        userId: user.id,
        userEmail: user.email,
        action,
        entityType,
        entityId,
        metadata: metadata || {},
        timestamp: serverTimestamp(),
        ipAddress: null, // Can be added from backend if needed
      });
    } catch (error) {
      // Logging errors shouldn't break the main flow
      console.error('Failed to log audit event:', error);
    }
  }
}
