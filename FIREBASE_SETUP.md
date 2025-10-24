# Firebase Project Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `multi-tenant-platform` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In the Firebase console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Toggle "Enable"
4. Add your email as a test user
5. Set the public-facing name for your project
6. Click "Save"

## Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select your preferred location
5. Click "Done"

## Step 4: Add Web App

1. Go to **Project Overview**
2. Click the web icon `</>`
3. Give your app a nickname: `multi-tenant-platform-web`
4. Check "Also set up Firebase Hosting" (optional)
5. Click "Register app"
6. Copy the Firebase configuration object

## Step 5: Configure Environment Variables

1. Open `.env.local` in your project
2. Replace the placeholder values with your Firebase config:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcd...
```

## Step 6: Set Up Security Rules

### Firestore Security Rules

Go to **Firestore Database** > **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admins can read all users
    match /users/{userId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }

    // Super admins can write all users
    match /users/{userId} {
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }

    // Organizations (future)
    match /organizations/{orgId} {
      allow read, write: if request.auth != null;
    }

    // Audit logs (admin read-only)
    match /auditLogs/{logId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
      allow create: if request.auth != null;
    }
  }
}
```

## Step 7: Set Up Custom Claims (Optional - for advanced role management)

Create a Cloud Function for managing custom claims:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login`
3. Run `firebase init functions`
4. Choose TypeScript
5. Add this function to set user roles:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const setCustomClaims = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const userData = change.after.data();

    if (userData) {
      const customClaims = {
        role: userData.role,
        organizationId: userData.organizationId,
        toolIds: userData.assignedTools?.map((tool: any) => tool.toolId) || [],
      };

      try {
        await admin.auth().setCustomUserClaims(userId, customClaims);
        console.log(`Custom claims set for user ${userId}:`, customClaims);
      } catch (error) {
        console.error(`Error setting custom claims for user ${userId}:`, error);
      }
    }
  });
```

6. Deploy: `firebase deploy --only functions`

## Step 8: Test the Setup

1. Restart your development server: `npm start`
2. Open the app in your browser
3. The Firebase configuration should now be loaded
4. You can test authentication once we implement the login component

## Step 9: Production Security

Before going to production:

1. **Update Firestore rules** to be more restrictive
2. **Set up Firebase App Check** for additional security
3. **Configure authorized domains** in Authentication settings
4. **Set up monitoring** and alerts
5. **Review and test** all security rules thoroughly

## Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**
   - Check that all environment variables are set correctly
   - Ensure no typos in the `.env.local` file

2. **Authentication popup blocked**
   - Allow popups in your browser
   - Try using `signInWithRedirect` instead of `signInWithPopup`

3. **Firestore permission denied**
   - Check that your security rules allow the operation
   - Ensure the user is properly authenticated

4. **CORS errors**
   - Add your domain to authorized domains in Firebase console
   - For localhost, add `http://localhost:3000`

## Next Steps

After completing this setup:
1. The authentication service will be functional
2. User profiles will be automatically created
3. The first user will become a super admin
4. You can proceed with building the authentication UI components