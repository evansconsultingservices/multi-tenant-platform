import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addHelloWorldTool() {
  try {
    const toolData = {
      name: 'Hello World Tool',
      description: 'A simple demonstration tool that displays a hello world message using Module Federation',
      icon: '👋',
      url: 'http://localhost:3001',
      status: 'active',
      category: 'Demo Tools',
      version: '1.0.0',
      createdBy: 'system',

      // Access configuration
      accessLevels: [
        {
          level: 'read',
          description: 'View-only access to the tool',
          permissions: ['view'],
        },
        {
          level: 'write',
          description: 'Standard usage permissions',
          permissions: ['view', 'use', 'edit'],
        },
        {
          level: 'admin',
          description: 'Full administrative control',
          permissions: ['view', 'use', 'edit', 'delete', 'configure'],
        },
      ],
      requiredRole: 'user',
      isPublic: true,

      // Technical details
      subdomain: 'hello-world',
      port: 3001,
      healthCheckUrl: 'http://localhost:3001',

      // UI configuration
      displayOrder: 0,
      featured: true,
      tags: ['demo', 'starter', 'module-federation'],

      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'tools'), toolData);

    console.log('✅ Hello World Tool added successfully!');
    console.log('Tool ID:', docRef.id);
    console.log('\nTool details:');
    console.log('- Name:', toolData.name);
    console.log('- URL:', toolData.url);
    console.log('- Category:', toolData.category);
    console.log('- Public:', toolData.isPublic);
    console.log('- Featured:', toolData.featured);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding tool:', error);
    process.exit(1);
  }
}

addHelloWorldTool();
