// Copy and paste this into the browser console while on the Admin Panel Tools tab
// Make sure you're logged in as an admin/super_admin

(async function addHelloWorldTool() {
  try {
    // Get Firebase from the window (already loaded by the app)
    const { addDoc, collection, serverTimestamp } = window.firebase.firestore;
    const { db } = window.firebaseApp;

    // Get current user ID from auth context
    const currentUser = window.auth?.currentUser;
    if (!currentUser) {
      console.error('❌ You must be logged in to add a tool');
      return;
    }

    const toolData = {
      name: 'Hello World Tool',
      description: 'A simple demonstration tool that displays a hello world message using Module Federation',
      icon: '👋',
      url: 'http://localhost:3001',
      status: 'active',
      category: 'Demo Tools',
      version: '1.0.0',
      createdBy: currentUser.uid,

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
    console.log('\nRefresh the page to see the new tool.');

    // Refresh the page to show the new tool
    setTimeout(() => window.location.reload(), 1000);

  } catch (error) {
    console.error('❌ Error adding tool:', error);
  }
})();
