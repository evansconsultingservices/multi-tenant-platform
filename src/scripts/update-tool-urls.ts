/**
 * Script to update tool URLs in Firebase database
 * This fixes tools that were created with localhost URLs to use production URLs
 *
 * Run this once in production after deployment to update existing tool records
 */

import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const URL_MAPPINGS = {
  'http://localhost:3001': process.env.REACT_APP_HELLO_WORLD_REMOTE_URL || 'https://hello-world-tool-xi.vercel.app',
  'http://localhost:3002': process.env.REACT_APP_CLOUDINARY_REMOTE_URL || 'https://cloudinary-tool.vercel.app',
  'http://localhost:3004': process.env.REACT_APP_VIDEO_ASSET_MANAGER_REMOTE_URL || 'https://video-asset-manager.vercel.app',
};

export async function updateToolUrls() {
  console.log('Starting tool URL update...');

  try {
    const toolsRef = collection(db, 'tools');
    const snapshot = await getDocs(toolsRef);

    let updated = 0;
    let skipped = 0;

    for (const toolDoc of snapshot.docs) {
      const tool = toolDoc.data();
      const oldUrl = tool.url;
      const oldHealthCheckUrl = tool.healthCheckUrl;

      // Check if URL needs updating
      const newUrl = URL_MAPPINGS[oldUrl as keyof typeof URL_MAPPINGS];
      const newHealthCheckUrl = URL_MAPPINGS[oldHealthCheckUrl as keyof typeof URL_MAPPINGS];

      if (newUrl || newHealthCheckUrl) {
        const updates: any = {};

        if (newUrl) {
          updates.url = newUrl;
          console.log(`Updating ${tool.name}: ${oldUrl} → ${newUrl}`);
        }

        if (newHealthCheckUrl) {
          updates.healthCheckUrl = newHealthCheckUrl;
        }

        await updateDoc(doc(db, 'tools', toolDoc.id), updates);
        updated++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Tool URL update complete!`);
    console.log(`   Updated: ${updated} tools`);
    console.log(`   Skipped: ${skipped} tools`);

    return { updated, skipped };
  } catch (error) {
    console.error('❌ Error updating tool URLs:', error);
    throw error;
  }
}
