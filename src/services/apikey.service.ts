import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';
import { APIKey, CreateAPIKeyInput, APIKeyResponse } from '@/types/apikey.types';

export class APIKeyService {
  /**
   * Generate a new API key for a company
   */
  static async generateAPIKey(
    companyId: string,
    input: CreateAPIKeyInput
  ): Promise<APIKeyResponse> {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Generate a random API key
    const apiKey = this.createSecureAPIKey();
    const keyPrefix = apiKey.substring(0, 12); // e.g., "sk_live_abcd"

    const apiKeyData = {
      companyId,
      name: input.name,
      keyHash: await this.hashAPIKey(apiKey), // Store hash, not the actual key
      keyPrefix,
      status: 'active',
      permissions: input.permissions,
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
      expiresAt: input.expiresAt || null,
      lastUsedAt: null,
    };

    const docRef = await addDoc(collection(db, 'apiKeys'), apiKeyData);

    return {
      id: docRef.id,
      key: apiKey, // Return the full key ONLY on creation
      name: input.name,
      keyPrefix,
      status: 'active',
      createdAt: new Date(),
      permissions: input.permissions,
    };
  }

  /**
   * Get all API keys for a company
   */
  static async getCompanyAPIKeys(companyId: string): Promise<APIKey[]> {
    const q = query(
      collection(db, 'apiKeys'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      key: '••••••••', // Never return the actual key after creation
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastUsedAt: doc.data().lastUsedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
    })) as APIKey[];
  }

  /**
   * Revoke an API key
   */
  static async revokeAPIKey(apiKeyId: string): Promise<void> {
    const apiKeyRef = doc(db, 'apiKeys', apiKeyId);
    await updateDoc(apiKeyRef, {
      status: 'revoked',
      revokedAt: serverTimestamp(),
    });
  }

  /**
   * Delete an API key permanently
   */
  static async deleteAPIKey(apiKeyId: string): Promise<void> {
    const apiKeyRef = doc(db, 'apiKeys', apiKeyId);
    await updateDoc(apiKeyRef, {
      status: 'deleted',
      deletedAt: serverTimestamp(),
    });
  }

  /**
   * Create a secure API key
   * Format: sk_live_[32 random characters]
   */
  private static createSecureAPIKey(): string {
    const prefix = 'sk_live_';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';

    // Generate 32 random characters
    for (let i = 0; i < 32; i++) {
      randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return prefix + randomPart;
  }

  /**
   * Hash an API key for secure storage
   * In production, use a proper crypto library like bcrypt
   */
  private static async hashAPIKey(apiKey: string): Promise<string> {
    // Simple hash for demonstration - in production use proper crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Verify an API key (for future API endpoint use)
   */
  static async verifyAPIKey(apiKey: string): Promise<APIKey | null> {
    const keyHash = await this.hashAPIKey(apiKey);

    const q = query(
      collection(db, 'apiKeys'),
      where('keyHash', '==', keyHash),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docData = snapshot.docs[0];
    const data = docData.data();

    // Check if expired
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      return null;
    }

    // Update last used timestamp
    await updateDoc(docData.ref, {
      lastUsedAt: serverTimestamp(),
    });

    return {
      id: docData.id,
      ...data,
      key: '••••••••', // Never expose the actual key
      createdAt: data.createdAt?.toDate() || new Date(),
      lastUsedAt: new Date(),
      expiresAt: data.expiresAt?.toDate(),
    } as APIKey;
  }
}
