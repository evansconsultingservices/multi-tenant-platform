# Connectivity Troubleshooting Report

**Date:** October 28, 2025
**Status:** Parent app running locally, child apps returning 403 errors

---

## Summary

The multi-tenant platform parent app (shell) is successfully running locally on port 3000. However, all deployed child applications on Vercel are returning **403 Forbidden** errors when attempting to access their Module Federation remote entry points.

---

## What's Working

✅ **Parent App (Shell)**
- Successfully installed dependencies
- Compiles without errors (only 1 minor warning about version.json, which has been fixed)
- Running on http://localhost:3000
- Ready to load child apps via Module Federation

---

## Critical Issue: Child Apps Returning 403 Forbidden

### Affected Applications

All child apps deployed on Vercel are inaccessible:

| Application | Root URL | remoteEntry.js Status |
|-------------|----------|----------------------|
| mtp-hello-world-tool | ✅ 200 OK | ❌ 403 Forbidden |
| mtp-cloudinary-tool | ✅ 200 OK | ❌ 403 Forbidden |
| mtp-video-asset-manager | ✅ 200 OK | ❌ 403 Forbidden |
| mtp-podcast-manager | ✅ 200 OK | ❌ 403 Forbidden |

### Test Results

```bash
# Root path works
curl https://mtp-hello-world-tool.vercel.app/
# Returns: 200 OK (HTML page)

# Module Federation entry point blocked
curl https://mtp-hello-world-tool.vercel.app/remoteEntry.js
# Returns: 403 Forbidden - "Access denied"

# Static files also blocked
curl https://mtp-hello-world-tool.vercel.app/static/js/main.js
# Returns: 403 Forbidden - "Access denied"
```

---

## Root Cause Analysis

The 403 "Access denied" response suggests one of the following Vercel configurations:

### 1. **Vercel Protection Enabled** (Most Likely)
- Vercel Protection adds authentication to deployments
- Blocks access to all static files including remoteEntry.js
- Check: Vercel Dashboard → Project Settings → Protection

### 2. **Deployment Authentication**
- Projects might be set to require authentication
- Check: Vercel Dashboard → Project Settings → Deployment Protection

### 3. **IP Restrictions**
- Access Control rules might be limiting traffic
- Check: Vercel Dashboard → Project Settings → Security

### 4. **Build Output Issues**
- remoteEntry.js might not be generated during build
- Less likely since error is "Access denied" not "404 Not Found"

### 5. **CORS Configuration**
- Your vercel.json already has CORS headers configured correctly
- This is not a CORS issue (would show different error)

---

## Solutions to Test

### Option 1: Disable Vercel Protection (Recommended for Testing)

For each child app deployment:
1. Go to Vercel Dashboard
2. Select the project (e.g., mtp-hello-world-tool)
3. Settings → Deployment Protection
4. Disable "Vercel Authentication"
5. Disable "Vercel Protection" if enabled
6. Redeploy or wait for changes to propagate

### Option 2: Add Authentication Headers

If protection must stay enabled:
- Configure the parent app to send authentication tokens
- Add Vercel bypass tokens to requests
- Update Module Federation loader to include credentials

### Option 3: Whitelist Parent App Domain

If using IP restrictions:
1. Add the parent app's production domain to allowlist
2. For local dev, you may need to disable restrictions
3. Consider using Vercel's domain-based access control

### Option 4: Use Environment Variable for Bypass

Add Vercel Protection Bypass:
```bash
# In parent app .env.local
REACT_APP_VERCEL_PROTECTION_BYPASS=your-bypass-token
```

Update remote loading to include bypass parameter:
```javascript
`https://mtp-hello-world-tool.vercel.app/remoteEntry.js?bypass=${token}`
```

---

## Testing in Local Development

To test Module Federation locally without relying on Vercel deployments:

### 1. Clone Child App Repositories

```bash
# From parent directory
cd /home/user
git clone https://github.com/evansconsultingservices/mtp-hello-world-tool.git
git clone https://github.com/evansconsultingservices/mtp-cloudinary-tool.git
git clone https://github.com/evansconsultingservices/mtp-video-asset-manager.git
git clone https://github.com/evansconsultingservices/mtp-podcast-manager.git
```

### 2. Install Dependencies for Each

```bash
cd mtp-hello-world-tool && npm install && cd ..
cd mtp-cloudinary-tool && npm install && cd ..
cd mtp-video-asset-manager && npm install && cd ..
cd mtp-podcast-manager && npm install && cd ..
```

### 3. Start Each Child App

Run each in a separate terminal:
```bash
# Terminal 1: Parent app (already running)
cd multi-tenant-platform && npm start  # Port 3000

# Terminal 2: Hello World
cd mtp-hello-world-tool && npm start   # Port 3001

# Terminal 3: Cloudinary Tool
cd mtp-cloudinary-tool && npm start    # Port 3002

# Terminal 4: Video Asset Manager
cd mtp-video-asset-manager && npm start # Port 3004

# Terminal 5: Podcast Manager
cd mtp-podcast-manager && npm start    # Port 3005
```

### 4. Update Parent App .env.local

Use localhost URLs (these are the defaults):
```bash
REACT_APP_HELLO_WORLD_REMOTE_URL=http://localhost:3001
REACT_APP_CLOUDINARY_REMOTE_URL=http://localhost:3002
REACT_APP_VIDEO_ASSET_MANAGER_REMOTE_URL=http://localhost:3004
REACT_APP_PODCAST_MANAGER_REMOTE_URL=http://localhost:3005
```

---

## Firebase Configuration Required

The parent app also needs valid Firebase credentials. Currently using placeholders in `.env.local`:

```bash
# These MUST be replaced with real values from Firebase Console
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

See `FIREBASE_SETUP.md` for detailed instructions.

---

## Current Status

### Local Development Environment

```
✅ Parent app dependencies installed
✅ Parent app compiling successfully
✅ Parent app running on http://localhost:3000
✅ version.json generated
✅ .env.local created (needs Firebase credentials)
❌ Firebase credentials not configured (using placeholders)
❌ Child apps not running locally (not cloned yet)
❌ Child apps on Vercel returning 403 errors
```

### Module Federation Status

```
Parent App (Shell): READY
├── helloWorld: ❌ 403 (http://localhost:3001 or Vercel)
├── cloudinaryTool: ❌ 403 (http://localhost:3002 or Vercel)
├── videoAssetManager: ❌ 403 (http://localhost:3004 or Vercel)
└── podcastManager: ❌ 403 (http://localhost:3005 or Vercel)
```

---

## Next Steps

### Immediate Actions Required

1. **Resolve Vercel 403 Issue**
   - Check Vercel Dashboard for protection settings
   - Disable authentication/protection on child app deployments
   - Or set up proper authentication bypass

2. **Configure Firebase Credentials**
   - Get credentials from Firebase Console
   - Update `.env.local` with real values
   - Restart parent app: `pkill -f "npm start" && npm start`

3. **Test Module Federation**
   - Option A: Fix Vercel access and use production URLs
   - Option B: Clone and run child apps locally

### For Production Deployment

1. Ensure all child apps are accessible without 403 errors
2. Verify CORS headers are properly configured (already done in vercel.json)
3. Test cross-origin loading of remoteEntry.js files
4. Set up proper environment variables for production URLs
5. Consider setting up a CDN or edge caching for remote entries

---

## Useful Commands

```bash
# Check if parent app is running
curl -I http://localhost:3000

# Test Vercel child app accessibility
curl -I https://mtp-hello-world-tool.vercel.app/remoteEntry.js

# Check running processes
ps aux | grep "npm start"

# Kill all npm start processes
pkill -f "npm start"

# Restart parent app
cd /home/user/multi-tenant-platform && npm start

# Check which ports are in use
netstat -tlnp | grep -E ":(3000|3001|3002|3004|3005)"
```

---

## Contact & Support

For Vercel-specific issues:
- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Documentation: https://vercel.com/docs
- Check deployment logs for build errors

For Module Federation issues:
- See: `DEPLOYMENT_GUIDE.md`
- See: `BUILDING_CHILD_APPS.md`
- Check browser console for Federation loading errors
