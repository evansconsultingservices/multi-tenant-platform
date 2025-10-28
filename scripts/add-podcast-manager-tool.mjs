import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

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

async function addPodcastManagerTool() {
  try {
    const toolData = {
      name: 'Podcast Manager',
      description: 'Transform articles into engaging podcast episodes with AI-powered audio generation and publishing to PodBean',
      icon: '🎙️',
      url: 'http://localhost:3005',
      status: 'active',
      category: 'Content Creation',
      version: '0.1.0',
      createdBy: 'system',

      // Access configuration
      accessLevels: [
        {
          level: 'read',
          description: 'View-only access to episodes',
          permissions: ['view'],
        },
        {
          level: 'write',
          description: 'Create and edit episodes',
          permissions: ['view', 'use', 'edit', 'create'],
        },
        {
          level: 'admin',
          description: 'Full administrative control',
          permissions: ['view', 'use', 'edit', 'create', 'delete', 'configure', 'publish'],
        },
      ],
      requiredRole: 'user',
      isPublic: false,

      // Technical details
      subdomain: 'podcast-manager',
      port: 3005,
      healthCheckUrl: 'http://localhost:3005',

      // UI configuration
      displayOrder: 2,
      featured: true,
      tags: ['podcast', 'audio', 'ai', 'content-creation', 'publishing'],

      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'tools'), toolData);

    console.log('✅ Podcast Manager Tool added successfully!');
    console.log('Tool ID:', docRef.id);
    console.log('\nTool details:');
    console.log('- Name:', toolData.name);
    console.log('- URL:', toolData.url);
    console.log('- Category:', toolData.category);
    console.log('- Public:', toolData.isPublic);
    console.log('- Featured:', toolData.featured);
    console.log('\n📝 Next steps:');
    console.log('1. Go to Admin > Companies in the platform');
    console.log('2. Edit your company and add the Podcast Manager tool');
    console.log('3. Navigate to /tools/' + docRef.id + ' to access it');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding tool:', error);
    process.exit(1);
  }
}

addPodcastManagerTool();
