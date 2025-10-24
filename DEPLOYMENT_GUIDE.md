# Multi-Tenant Platform Deployment Guide

## Architecture Overview

This platform uses **Module Federation** (Webpack 5) to create a micro-frontend architecture where:
- **Shell App** (multi-tenant-platform) - Main orchestration application
- **Child Apps** (mtp-*) - Independent micro-frontend tools loaded dynamically

### Key Benefits
✅ **Independent Development** - Each team can work on their own tool
✅ **Independent Deployment** - Deploy updates without rebuilding everything
✅ **Independent Scaling** - Scale individual tools based on usage
✅ **Independent Versioning** - Each tool has its own release cycle
✅ **Smaller Blast Radius** - Bugs in one tool don't break the platform

---

## Repository Structure

```
evansconsultingservices/
├── multi-tenant-platform              # Shell app (port 3000)
├── mtp-hello-world-tool              # Demo tool (port 3001)
├── mtp-cloudinary-tool               # Media management (port 3002)
├── mtp-video-asset-manager           # Video management (port 3004)
└── mtp-blox-video-generator          # Video generation (port 3005)
```

**GitHub URLs:**
- https://github.com/evansconsultingservices/multi-tenant-platform
- https://github.com/evansconsultingservices/mtp-hello-world-tool
- https://github.com/evansconsultingservices/mtp-cloudinary-tool
- https://github.com/evansconsultingservices/mtp-video-asset-manager
- https://github.com/evansconsultingservices/mtp-blox-video-generator

---

## Deployment Strategy

### Phase 1: Deploy Child Applications First

**Why?** The shell app needs to know the production URLs of child apps to load them.

#### Step 1.1: Deploy mtp-hello-world-tool

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Click "New Project"

2. **Import Repository**
   - Select `evansconsultingservices/mtp-hello-world-tool`
   - Click "Import"

3. **Configure Build Settings**
   ```
   Framework Preset: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **Environment Variables** (if needed)
   - None required for hello-world-tool

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the production URL (e.g., `https://mtp-hello-world-tool.vercel.app`)

6. **Verify remoteEntry.js**
   - Visit: `https://mtp-hello-world-tool.vercel.app/remoteEntry.js`
   - Should return JavaScript code (not 404)

---

#### Step 1.2: Deploy mtp-cloudinary-tool

1. **Import to Vercel**
   - New Project → `evansconsultingservices/mtp-cloudinary-tool`

2. **Configure Build Settings**
   ```
   Framework Preset: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
   REACT_APP_CLOUDINARY_API_KEY=your_api_key
   REACT_APP_CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Deploy and Verify**
   - Production URL: `https://mtp-cloudinary-tool.vercel.app`
   - Verify: `https://mtp-cloudinary-tool.vercel.app/remoteEntry.js`

---

#### Step 1.3: Deploy mtp-video-asset-manager

1. **Import to Vercel**
   - New Project → `evansconsultingservices/mtp-video-asset-manager`

2. **Configure Build Settings**
   ```
   Framework Preset: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   REACT_APP_FIELD59_USERNAME=your_field59_username
   REACT_APP_FIELD59_PASSWORD=your_field59_password
   ```

   ⚠️ **Security Note:** Consider using Field59 API tokens instead of passwords in production

4. **Deploy and Verify**
   - Production URL: `https://mtp-video-asset-manager.vercel.app`
   - Verify: `https://mtp-video-asset-manager.vercel.app/remoteEntry.js`

---

#### Step 1.4: Deploy mtp-blox-video-generator

1. **Import to Vercel**
   - New Project → `evansconsultingservices/mtp-blox-video-generator`

2. **Configure Build Settings**
   ```
   Framework Preset: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Environment Variables** (add your specific env vars)
   ```
   REACT_APP_API_ENDPOINT=your_video_api_endpoint
   # Add other required env vars
   ```

4. **Deploy and Verify**
   - Production URL: `https://mtp-blox-video-generator.vercel.app`
   - Verify: `https://mtp-blox-video-generator.vercel.app/remoteEntry.js`

---

### Phase 2: Update Shell App Configuration

Now that all child apps are deployed, update the shell app to point to production URLs.

#### Step 2.1: Update craco.config.js

**File:** `multi-tenant-platform/craco.config.js`

**Find this section (around lines 16-21):**
```javascript
remotes: {
  // Map remote apps - in production these URLs would be dynamic
  helloWorld: "helloWorld@http://localhost:3001/remoteEntry.js",
  cloudinaryTool: "cloudinaryTool@http://localhost:3002/remoteEntry.js",
  videoAssetManager: "videoAssetManager@http://localhost:3004/remoteEntry.js",
},
```

**Replace with production URLs:**
```javascript
remotes: {
  helloWorld: process.env.NODE_ENV === 'production'
    ? "helloWorld@https://mtp-hello-world-tool.vercel.app/remoteEntry.js"
    : "helloWorld@http://localhost:3001/remoteEntry.js",

  cloudinaryTool: process.env.NODE_ENV === 'production'
    ? "cloudinaryTool@https://mtp-cloudinary-tool.vercel.app/remoteEntry.js"
    : "cloudinaryTool@http://localhost:3002/remoteEntry.js",

  videoAssetManager: process.env.NODE_ENV === 'production'
    ? "videoAssetManager@https://mtp-video-asset-manager.vercel.app/remoteEntry.js"
    : "videoAssetManager@http://localhost:3004/remoteEntry.js",

  bloxVideoGenerator: process.env.NODE_ENV === 'production'
    ? "bloxVideoGenerator@https://mtp-blox-video-generator.vercel.app/remoteEntry.js"
    : "bloxVideoGenerator@http://localhost:3005/remoteEntry.js",
},
```

**Alternatively (Advanced):** Use environment variables:
```javascript
remotes: {
  helloWorld: `helloWorld@${process.env.REACT_APP_HELLO_WORLD_URL || 'http://localhost:3001'}/remoteEntry.js`,
  cloudinaryTool: `cloudinaryTool@${process.env.REACT_APP_CLOUDINARY_TOOL_URL || 'http://localhost:3002'}/remoteEntry.js`,
  videoAssetManager: `videoAssetManager@${process.env.REACT_APP_VIDEO_MANAGER_URL || 'http://localhost:3004'}/remoteEntry.js`,
  bloxVideoGenerator: `bloxVideoGenerator@${process.env.REACT_APP_VIDEO_GENERATOR_URL || 'http://localhost:3005'}/remoteEntry.js`,
},
```

#### Step 2.2: Commit and Push Changes

```bash
cd multi-tenant-platform
git add craco.config.js
git commit -m "feat: Add production URLs for Module Federation remotes"
git push origin main
```

---

### Phase 3: Deploy Shell Application

#### Step 3.1: Deploy to Vercel

1. **Import to Vercel**
   - New Project → `evansconsultingservices/multi-tenant-platform`

2. **Configure Build Settings**
   ```
   Framework Preset: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

   # Optional: Remote URLs (if using env var approach)
   REACT_APP_HELLO_WORLD_URL=https://mtp-hello-world-tool.vercel.app
   REACT_APP_CLOUDINARY_TOOL_URL=https://mtp-cloudinary-tool.vercel.app
   REACT_APP_VIDEO_MANAGER_URL=https://mtp-video-asset-manager.vercel.app
   REACT_APP_VIDEO_GENERATOR_URL=https://mtp-blox-video-generator.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Production URL: `https://multi-tenant-platform.vercel.app`

---

### Phase 4: Configure Firebase

#### Step 4.1: Add Authorized Domains

1. **Go to Firebase Console**
   - Visit https://console.firebase.google.com
   - Select your project

2. **Navigate to Authentication → Settings → Authorized Domains**

3. **Add Production Domains**
   ```
   multi-tenant-platform.vercel.app
   mtp-hello-world-tool.vercel.app
   mtp-cloudinary-tool.vercel.app
   mtp-video-asset-manager.vercel.app
   mtp-blox-video-generator.vercel.app
   ```

4. **Add Custom Domain (if applicable)**
   ```
   yourdomain.com
   www.yourdomain.com
   ```

---

## Independent Deployment Workflow

### Updating a Child App (e.g., mtp-cloudinary-tool)

**Scenario:** You fixed a bug in the Cloudinary tool and want to deploy it.

#### Step 1: Make Changes Locally
```bash
cd child_apps/cloudinary-tool
# Make your code changes
npm test  # Run tests
npm run build  # Verify build works
```

#### Step 2: Commit and Push
```bash
git add .
git commit -m "fix: Resolve image upload timeout issue"
git push origin main
```

#### Step 3: Automatic Deployment
- Vercel automatically detects the push
- Builds and deploys the new version
- **No shell app rebuild required!**

#### Step 4: Verify Changes
1. Visit: `https://mtp-cloudinary-tool.vercel.app/remoteEntry.js`
2. Open shell app: `https://multi-tenant-platform.vercel.app`
3. Navigate to Cloudinary tool
4. Verify fix is live

**That's it!** The shell app will automatically load the new version.

---

### Updating the Shell App

**Scenario:** You added a new admin feature to the platform.

#### Step 1: Make Changes
```bash
cd multi-tenant-platform
# Make your code changes
npm test
npm run build
```

#### Step 2: Commit and Push
```bash
git add .
git commit -m "feat: Add user bulk import feature"
git push origin main
```

#### Step 3: Automatic Deployment
- Vercel rebuilds the shell app
- **Child apps are NOT affected**

---

### Adding a New Child App

**Scenario:** You want to add a new tool: `mtp-reporting-tool`

#### Step 1: Create the Application Locally
```bash
cd child_apps
npx create-react-app reporting-tool
cd reporting-tool
npm install @craco/craco
```

#### Step 2: Configure Module Federation
**Create `craco.config.js`:**
```javascript
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
          name: "reportingTool",
          filename: "remoteEntry.js",
          exposes: {
            "./App": "./src/App",
            "./ReportingTool": "./src/App",
          },
          shared: {
            react: { singleton: true, requiredVersion: deps.react, eager: true },
            "react-dom": { singleton: true, requiredVersion: deps["react-dom"], eager: true },
          },
        })
      );

      webpackConfig.output.publicPath = process.env.NODE_ENV === 'production' ? "auto" : "/";
      webpackConfig.optimization.runtimeChunk = false;

      return webpackConfig;
    },
  },
  devServer: {
    port: 3006,  // New port
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
};
```

#### Step 3: Create GitHub Repository
```bash
cd reporting-tool
git init
git add .
git commit -m "feat: Initial reporting tool implementation"
gh repo create mtp-reporting-tool --public --source=. --description="Reporting tool for multi-tenant platform"
git push -u origin main
```

#### Step 4: Deploy Child App
1. Deploy to Vercel (see Phase 1 steps)
2. Get production URL: `https://mtp-reporting-tool.vercel.app`

#### Step 5: Update Shell App

**Edit `multi-tenant-platform/craco.config.js`:**
```javascript
remotes: {
  helloWorld: "helloWorld@...",
  cloudinaryTool: "cloudinaryTool@...",
  videoAssetManager: "videoAssetManager@...",
  bloxVideoGenerator: "bloxVideoGenerator@...",
  reportingTool: process.env.NODE_ENV === 'production'
    ? "reportingTool@https://mtp-reporting-tool.vercel.app/remoteEntry.js"
    : "reportingTool@http://localhost:3006/remoteEntry.js",  // Add new tool
},
```

**Create new component to load the tool:**
```javascript
// src/components/tools/ReportingToolLoader.tsx
import { lazy } from 'react';
const ReportingTool = lazy(() => import('reportingTool/ReportingTool'));

export const ReportingToolLoader = () => {
  return <ReportingTool />;
};
```

#### Step 6: Deploy Shell App
```bash
cd multi-tenant-platform
git add .
git commit -m "feat: Add reporting tool integration"
git push origin main
```

---

## Scaling Strategies

### 1. CDN Distribution
Place `remoteEntry.js` files on CDN for faster global access.

**Cloudflare Setup:**
1. Add domain to Cloudflare
2. Enable caching for `*.js` files
3. Set cache TTL to 1 hour for `remoteEntry.js`

### 2. Load Balancing
For high-traffic tools, deploy multiple instances:

**Vercel:**
- Automatic edge network distribution
- No additional configuration needed

**Custom Setup:**
```javascript
remotes: {
  cloudinaryTool: `cloudinaryTool@${loadBalancer.getNextURL()}/remoteEntry.js`,
}
```

### 3. Version Management

**Approach 1: URL-based versioning**
```javascript
cloudinaryTool: "cloudinaryTool@https://v2.mtp-cloudinary-tool.vercel.app/remoteEntry.js"
```

**Approach 2: Query parameters**
```javascript
cloudinaryTool: `cloudinaryTool@https://mtp-cloudinary-tool.vercel.app/remoteEntry.js?v=${version}`
```

**Approach 3: Git branches**
- `main` → Production
- `staging` → Staging environment
- `dev` → Development

Deploy each branch to different Vercel projects:
- https://mtp-cloudinary-tool.vercel.app (main)
- https://mtp-cloudinary-tool-staging.vercel.app (staging)
- https://mtp-cloudinary-tool-dev.vercel.app (dev)

### 4. Feature Flags

Use environment variables to enable/disable tools:

**Shell app:**
```javascript
const remotes = {};

if (process.env.REACT_APP_ENABLE_CLOUDINARY === 'true') {
  remotes.cloudinaryTool = "cloudinaryTool@https://...";
}

if (process.env.REACT_APP_ENABLE_VIDEO === 'true') {
  remotes.videoAssetManager = "videoAssetManager@https://...";
}
```

### 5. Monitoring & Observability

**Add error boundaries for each tool:**
```javascript
<ErrorBoundary fallback={<ToolErrorFallback />}>
  <CloudinaryToolLoader />
</ErrorBoundary>
```

**Track Module Federation errors:**
```javascript
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Shared module')) {
    console.error('Module Federation Error:', event.reason);
    // Send to error tracking service (Sentry, etc.)
  }
});
```

---

## Troubleshooting

### Issue: "Shared module is not available for eager consumption"

**Cause:** Missing dependency in Module Federation shared config

**Solution:**
1. Identify the missing dependency from error message
2. Add to `craco.config.js` shared config in BOTH shell and child app:
```javascript
shared: {
  "@radix-ui/react-dialog": {
    singleton: true,
    requiredVersion: deps["@radix-ui/react-dialog"],
    eager: true,
  },
}
```
3. Restart dev servers completely: `pkill -9 node && npm start`

### Issue: "Failed to fetch dynamically imported module"

**Cause:** `remoteEntry.js` not accessible

**Solution:**
1. Verify URL: `https://your-app.vercel.app/remoteEntry.js`
2. Check CORS headers in child app
3. Verify build succeeded on Vercel
4. Check browser console for network errors

### Issue: White screen after deployment

**Cause:** Usually Module Federation configuration mismatch

**Solution:**
1. Open browser console, check for errors
2. Verify `publicPath` is set to `"auto"` in production
3. Check all shared dependencies match versions
4. Verify all child apps deployed successfully

---

## Best Practices

### 1. Development Workflow
- ✅ Always run all apps locally before deployment
- ✅ Test Module Federation loading in local environment
- ✅ Use consistent Node.js and npm versions across all apps
- ✅ Keep shared dependencies in sync

### 2. Deployment Workflow
- ✅ Deploy child apps BEFORE shell app
- ✅ Verify `remoteEntry.js` accessible before updating shell
- ✅ Use staging environments for testing
- ✅ Monitor error rates after deployment

### 3. Version Management
- ✅ Use semantic versioning for child apps
- ✅ Document breaking changes
- ✅ Maintain backward compatibility when possible
- ✅ Plan deprecation cycles for major changes

### 4. Security
- ✅ Never commit `.env` files
- ✅ Use Vercel environment variables for secrets
- ✅ Rotate API keys regularly
- ✅ Implement proper authentication in child apps
- ✅ Validate all user inputs

### 5. Performance
- ✅ Lazy load tools only when needed
- ✅ Minimize shared dependencies size
- ✅ Use code splitting within child apps
- ✅ Monitor bundle sizes
- ✅ Cache `remoteEntry.js` appropriately

---

## Quick Reference

### Local Development Ports
```
Shell App:              3000
hello-world-tool:       3001
cloudinary-tool:        3002
video-asset-manager:    3004
blox-video-generator:   3005
```

### Production URLs Template
```
Shell:    https://multi-tenant-platform.vercel.app
Tool 1:   https://mtp-hello-world-tool.vercel.app
Tool 2:   https://mtp-cloudinary-tool.vercel.app
Tool 3:   https://mtp-video-asset-manager.vercel.app
Tool 4:   https://mtp-blox-video-generator.vercel.app
```

### Critical Files to Update
```
multi-tenant-platform/craco.config.js     - Remote URLs
multi-tenant-platform/.env                - Firebase config
child_apps/*/craco.config.js              - Module Federation config
child_apps/*/.env                         - Tool-specific env vars
```

---

## Support & Resources

- **GitHub Organization:** https://github.com/evansconsultingservices
- **Module Federation Docs:** https://webpack.js.org/concepts/module-federation/
- **Vercel Docs:** https://vercel.com/docs
- **Firebase Docs:** https://firebase.google.com/docs

---

**Last Updated:** October 24, 2025
**Version:** 1.0.0
