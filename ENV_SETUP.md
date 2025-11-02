# Environment Variables Setup

## Overview

This application requires Firebase configuration and Module Federation URLs to be set via environment variables. These credentials should **NEVER** be committed to version control.

## Initial Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get Firebase credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `sneworks-9e334`
   - Navigate to: Project Settings → General → Your apps
   - Copy the Firebase SDK configuration values

3. **Update `.env.local` with real values:**
   ```bash
   # Replace "your_xxx_here" with actual Firebase values
   REACT_APP_FIREBASE_API_KEY=<your-actual-api-key>
   REACT_APP_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
   # ... etc
   ```

## Required Environment Variables

### Firebase Configuration
```
REACT_APP_FIREBASE_API_KEY          # Firebase API key from console
REACT_APP_FIREBASE_AUTH_DOMAIN      # Firebase auth domain
REACT_APP_FIREBASE_PROJECT_ID       # Firebase project ID
REACT_APP_FIREBASE_STORAGE_BUCKET   # Firebase storage bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID  # Firebase messaging sender ID
REACT_APP_FIREBASE_APP_ID           # Firebase app ID
```

### Module Federation URLs

**Development (localhost):**
```
REACT_APP_VIDEO_ASSET_MANAGER_REMOTE_URL=http://localhost:3004
REACT_APP_PODCAST_MANAGER_REMOTE_URL=http://localhost:3005
```

**Production (Vercel):**
```
REACT_APP_VIDEO_ASSET_MANAGER_REMOTE_URL=https://video-asset-manager.vercel.app
REACT_APP_PODCAST_MANAGER_REMOTE_URL=https://podcast-manager-rose.vercel.app
```

### Environment Flag
```
REACT_APP_ENVIRONMENT=development  # or "production"
```

## Security Best Practices

### ✅ DO:
- Keep `.env.local` file locally only
- Use `.env.example` as a template (no real credentials)
- Set environment variables in Vercel dashboard for production
- Rotate credentials if accidentally exposed

### ❌ DON'T:
- Commit `.env.local` to Git
- Share credentials in Slack, email, or other channels
- Use production credentials in development
- Hardcode credentials in source files

## Vercel Deployment

For production deployments on Vercel:

1. Go to: Project Settings → Environment Variables
2. Add each variable from `.env.local`
3. Set the environment: Production / Preview / Development
4. Vercel will inject these at build time

## Verification

Verify your setup is secure:

```bash
# Check .env.local is NOT tracked
git ls-files | grep .env.local
# Should return nothing ✅

# Check .env.local is in .gitignore
cat .gitignore | grep .env.local
# Should show: .env.local ✅

# Check file exists locally
ls -la .env.local
# Should show the file ✅
```

## Troubleshooting

**"Firebase not initialized" error:**
- Check all `REACT_APP_FIREBASE_*` variables are set
- Verify no typos in variable names
- Restart dev server after changing `.env.local`

**Module Federation remote not loading:**
- Verify child app URLs are correct
- Ensure child apps are running (ports 3004, 3005)
- Check console for CORS or network errors

---

**Last Updated:** November 1, 2025
**Security Audit:** CRITICAL-001 ✅ Completed
