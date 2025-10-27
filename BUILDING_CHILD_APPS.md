# Building Child Applications for Media Orchestrator

**Complete Guide to Creating Module Federation Child Apps**

> **Last Updated**: October 2025
> **Platform Version**: 2.0+
> **Architecture**: Module Federation + Shadcn/ui

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Project Setup](#project-setup)
5. [Module Federation Configuration](#module-federation-configuration)
6. [Menu Configuration System](#menu-configuration-system)
7. [Version Tracking](#version-tracking)
8. [Building Your UI](#building-your-ui)
9. [Routing & Navigation](#routing--navigation)
10. [API Integration](#api-integration)
11. [Registering with Parent Platform](#registering-with-parent-platform)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)
15. [Best Practices](#best-practices)

---

## Overview

Child applications are standalone React apps that integrate with the Media Orchestrator platform using **Webpack Module Federation**. This architecture provides:

- **True Integration**: Components run natively (not in iframes)
- **Shared Dependencies**: React, Shadcn/ui components shared across apps
- **Dynamic Menu System**: Apps expose navigation menus to parent shell
- **Independent Deployment**: Each app deploys to its own Vercel project
- **Version Tracking**: Automatic versioning and build information

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Media Orchestrator (Parent Shell - Port 3000)             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Sidebar Navigation                                 │   │
│  │  ├─ Home                                           │   │
│  │  ├─ Admin                                          │   │
│  │  └─ Your Tool ◄── Dynamically loaded menu         │   │
│  │     ├─ Overview   ◄── From menuConfig.ts          │   │
│  │     └─ Settings                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Tool Content Area                                  │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │  Your Tool App (loaded via Module Federation)│ │   │
│  │  │  Rendered natively with shared React instance │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Module Federation
         │ Loads remoteEntry.js from:
         ▼
┌─────────────────────────────────────────┐
│  Your Tool App (Port 3XXX)              │
│  Exposes:                                │
│  - ./App (React component)              │
│  - ./menuConfig (navigation structure)  │
└─────────────────────────────────────────┘
```

---

## Prerequisites

- Node.js 16+ and npm
- Familiarity with React, TypeScript, and Tailwind CSS
- Understanding of Webpack Module Federation (helpful but not required)
- Git for version control

---

## Quick Start

```bash
# 1. Create new React app with TypeScript
npx create-react-app my-tool --template typescript
cd my-tool

# 2. Install Module Federation + Shadcn/ui dependencies
npm install -D @craco/craco
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge lucide-react

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Initialize Shadcn/ui
npx shadcn@latest init

# 5. Install common Shadcn components
npx shadcn@latest add button card input label

# 6. Configure Module Federation (see detailed steps below)
# 7. Create menuConfig.ts
# 8. Start development server on unique port
```

---

## Project Setup

### 1. Create React App

```bash
npx create-react-app your-tool-name --template typescript
cd your-tool-name
```

### 2. Install Core Dependencies

```bash
# Module Federation
npm install -D @craco/craco

# Tailwind CSS + Shadcn/ui core
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge

# Icons
npm install lucide-react

# Routing (if you need multiple pages)
npm install react-router-dom
npm install -D @types/react-router-dom
```

### 3. Configure Tailwind CSS

Initialize Tailwind:

```bash
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 4. Initialize Shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:
- TypeScript: **Yes**
- Style: **Default**
- Tailwind CSS: **Yes**
- Import alias: **@/components**
- Configure path mapping: **Yes**

### 5. Install Common Shadcn Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add skeleton
npx shadcn@latest add tabs
```

### 6. Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

Create `src/lib/utils.ts` for Shadcn utilities:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Module Federation Configuration

### 1. Create CRACO Config

Create `craco.config.js` in project root:

```javascript
const path = require('path');
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
          name: "yourToolName",  // 🔧 CHANGE THIS - camelCase, unique name
          filename: "remoteEntry.js",
          exposes: {
            "./App": "./src/App",
            "./YourToolName": "./src/App",  // 🔧 CHANGE THIS
            "./menuConfig": "./src/menuConfig",  // ✅ REQUIRED for menu system
          },
          shared: {
            // React (REQUIRED)
            react: {
              singleton: true,
              requiredVersion: deps.react,
              eager: true,  // ⚠️ CRITICAL - must be eager
            },
            "react-dom": {
              singleton: true,
              requiredVersion: deps["react-dom"],
              eager: true,
            },

            // Icons (REQUIRED if using lucide-react)
            "lucide-react": {
              singleton: true,
              requiredVersion: deps["lucide-react"],
              eager: true,
            },

            // Shadcn/ui core (REQUIRED)
            "@radix-ui/react-slot": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-slot"],
              eager: true,
            },
            "class-variance-authority": {
              singleton: true,
              requiredVersion: deps["class-variance-authority"],
              eager: true,
            },
            "clsx": {
              singleton: true,
              requiredVersion: deps.clsx,
              eager: true,
            },
            "tailwind-merge": {
              singleton: true,
              requiredVersion: deps["tailwind-merge"],
              eager: true,
            },

            // ⚠️ ADD MORE @radix-ui packages as you add Shadcn components
            // Every @radix-ui package MUST be listed here with eager: true
            // See "Adding New Shadcn Components" section below
          },
        })
      );

      // Module Federation configuration
      webpackConfig.output.publicPath = "auto";
      webpackConfig.optimization.runtimeChunk = false;

      return webpackConfig;
    },
  },
  devServer: {
    port: 3XXX,  // 🔧 CHANGE THIS - Unique port (3001, 3002, 3003, etc.)
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },

    // Optional: Proxy configuration for your backend API
    proxy: {
      '/api': {
        target: 'http://localhost:YYYY',  // Your backend port
        changeOrigin: true,
      }
    }
  }
};
```

### 2. 🚨 CRITICAL: Adding New Shadcn Components

**Every time you add a new Shadcn component, you MUST follow these steps:**

```bash
# 1. Install the Radix UI dependency
npm install @radix-ui/react-[component]

# 2. Add the Shadcn component
npx shadcn@latest add [component]

# 3. ⚠️ CRITICAL: Update craco.config.js shared section
# Add this to the ModuleFederationPlugin shared object:
"@radix-ui/react-[component]": {
  singleton: true,
  requiredVersion: deps["@radix-ui/react-[component]"],
  eager: true,  // REQUIRED or app will crash with white screen
},

# 4. Restart dev server completely
pkill -f "npm start"
npm start
```

**Example - Adding Tabs Component:**

```bash
npm install @radix-ui/react-tabs
npx shadcn@latest add tabs
```

Then add to `craco.config.js`:

```javascript
"@radix-ui/react-tabs": {
  singleton: true,
  requiredVersion: deps["@radix-ui/react-tabs"],
  eager: true,
},
```

**If you forget step 3**, you'll get:
```
Error: Shared module is not available for eager consumption:
webpack/sharing/consume/default/@radix-ui/react-tabs
```
This crashes React with a blank white screen!

### 3. Update package.json Scripts

Replace the `scripts` section:

```json
{
  "scripts": {
    "start": "PORT=3XXX craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "react-scripts eject"
  }
}
```

---

## Menu Configuration System

The menu system allows your child app to dynamically provide navigation menu items to the parent shell's sidebar.

### 1. Create menuConfig.ts

Create `src/menuConfig.ts`:

```typescript
/**
 * Menu configuration for Your Tool Name
 * This configuration is dynamically loaded by the parent shell app
 * to populate the navigation sidebar
 */

// Load version info (generated at build time)
let versionInfo = null;
try {
  versionInfo = require('./version.json');
} catch (error) {
  // Version info not available (dev mode without build)
  versionInfo = {
    version: 'dev',
    buildTimestamp: new Date().toISOString(),
    gitCommit: 'unknown',
    gitBranch: 'unknown',
    environment: 'development',
    buildNumber: 0,
  };
}

export const menuConfig = {
  version: versionInfo,
  items: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/',  // Relative to your tool's base path
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
    },
    // Add more menu items as needed
  ],
};
```

### 2. Menu Item Structure

```typescript
interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;

  /** Display label for the menu item */
  label: string;

  /** Path relative to the tool/app base path */
  path: string;

  /** Optional: Nested menu items for hierarchical navigation */
  children?: MenuItem[];

  /** Optional: Lucide React icon name */
  icon?: string;
}
```

### 3. How It Works

1. **Parent shell** loads your `remoteEntry.js`
2. **MenuLoaderService** imports `./menuConfig` from your app
3. **Parent sidebar** renders your menu items under your tool's section
4. **User clicks** a menu item → navigates to `/tools/your-tool-id/your-path`
5. **Your app** receives the sub-path and routes accordingly

### 4. Example Multi-Level Menu

```typescript
export const menuConfig = {
  version: versionInfo,
  items: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
    },
    {
      id: 'media',
      label: 'Media',
      path: '/media',
      children: [
        {
          id: 'media-videos',
          label: 'Videos',
          path: '/media/videos',
        },
        {
          id: 'media-images',
          label: 'Images',
          path: '/media/images',
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
    },
  ],
};
```

---

## Version Tracking

Version tracking provides automatic versioning and build information.

### 1. Create Version Build Script

Create `scripts/generate-version.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get git information
const getGitCommit = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

const getGitBranch = () => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

// Generate version info
const versionInfo = {
  version: process.env.npm_package_version || '0.0.0',
  buildTimestamp: new Date().toISOString(),
  gitCommit: getGitCommit(),
  gitBranch: getGitBranch(),
  environment: process.env.NODE_ENV || 'development',
  buildNumber: parseInt(process.env.BUILD_NUMBER || '0', 10),
};

// Write to src/version.json
const outputPath = path.join(__dirname, '..', 'src', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log('✅ Version info generated:', versionInfo);
```

### 2. Update package.json

Add prebuild script:

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-version.js",
    "start": "PORT=3XXX craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

### 3. Add to .gitignore

```
# Version info (generated at build)
src/version.json
```

### 4. Version Display

The parent shell can access version info via your menuConfig:

```typescript
// In parent shell
const menuData = await MenuLoaderService.loadToolMenu('yourTool', remoteUrl);
console.log('Tool Version:', menuData.version);
```

---

## Building Your UI

### 1. Basic App Structure

Update `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Your Tool Name
          </h1>
          <p className="text-lg text-muted-foreground">
            Tool description
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Get started with your tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Click me</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
```

### 2. Design System Guidelines

**Always use Shadcn/ui components:**

✅ **Correct:**
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

<Card>
  <Button>Save Changes</Button>
</Card>
```

❌ **Incorrect:**
```typescript
<div className="border rounded-lg p-4">
  <button className="bg-blue-500">Save Changes</button>
</div>
```

**Use semantic color tokens:**

✅ **Correct:**
```typescript
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Subtitle</p>
</div>
```

❌ **Incorrect:**
```typescript
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  <p className="text-gray-500">Subtitle</p>
</div>
```

---

## Routing & Navigation

If your tool has multiple pages, use React Router:

### 1. Install React Router

```bash
npm install react-router-dom
npm install -D @types/react-router-dom
```

### 2. Setup Routes

Update `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Overview } from './pages/Overview';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router basename="/tools/your-tool-id">
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

### 3. Create Page Components

Create `src/pages/Overview.tsx`:

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Overview: React.FC = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">Overview</h1>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your tool's main content here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

---

## API Integration

### 1. Using Proxy (Development)

Configure proxy in `craco.config.js`:

```javascript
devServer: {
  port: 3XXX,
  proxy: {
    '/api': {
      target: 'http://localhost:YYYY',  // Your backend
      changeOrigin: true,
    },
    '/v2': {
      target: 'https://external-api.com',
      changeOrigin: true,
      secure: true,
    }
  }
}
```

### 2. API Service Example

Create `src/services/api.service.ts`:

```typescript
export class ApiService {
  private static baseUrl = '/api';

  static async fetchData<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  static async postData<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### 3. Using in Components

```typescript
import React, { useEffect, useState } from 'react';
import { ApiService } from '@/services/api.service';

export const DataList: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await ApiService.fetchData('/items');
        setData(result);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

---

## Registering with Parent Platform

### 1. Get Your Tool Ready

Before registering, ensure:
- ✅ Module Federation configured in `craco.config.js`
- ✅ `menuConfig.ts` created and exposed
- ✅ App builds without errors: `npm run build`
- ✅ Dev server runs on unique port
- ✅ `remoteEntry.js` accessible at `http://localhost:3XXX/remoteEntry.js`

### 2. Update Parent Shell's CRACO Config

In `/multi-tenant-platform/craco.config.js`, add your remote:

```javascript
remotes: {
  helloWorld: "helloWorld@http://localhost:3001/remoteEntry.js",
  cloudinaryTool: "cloudinaryTool@http://localhost:3002/remoteEntry.js",
  yourTool: "yourToolName@http://localhost:3XXX/remoteEntry.js",  // Add this
},
```

### 3. Update Parent Shell's ToolFrame

In `/multi-tenant-platform/src/components/tools/ToolFrame.tsx`, add mapping:

```typescript
// In getToolConfig function
if (tool.url.includes('3XXX') || tool.name.toLowerCase().includes('your tool')) {
  return {
    remoteName: 'yourToolName',
    remoteUrl: getRemoteEntryUrl(tool.url),
  };
}
```

### 4. Register in Database

Add your tool to Firebase/Firestore via Admin Panel:

```typescript
{
  name: "Your Tool Name",
  url: "http://localhost:3XXX",  // Dev URL
  description: "Description of your tool",
  icon: "Wrench",  // Lucide icon name
  category: "media",
  status: "active"
}
```

---

## Testing

### 1. Test Standalone

```bash
npm start
# Visit http://localhost:3XXX
```

Verify:
- ✅ App loads without white screen
- ✅ UI components render correctly
- ✅ Navigation works (if using React Router)
- ✅ API calls work (if using proxy)

### 2. Test Module Federation

Check `remoteEntry.js` is accessible:

```bash
curl http://localhost:3XXX/remoteEntry.js
# Should return JavaScript code
```

### 3. Test in Parent Shell

```bash
# Terminal 1: Start your tool
cd your-tool
npm start

# Terminal 2: Start parent shell
cd multi-tenant-platform
npm start
```

Visit `http://localhost:3000`:
1. Login to platform
2. Navigate to your tool from sidebar
3. Verify menu items appear in sidebar
4. Click menu items and verify navigation
5. Check browser console for errors

### 4. Common Issues

**White Screen:**
- Check browser console for "Shared module not available for eager consumption"
- Ensure all @radix-ui packages are in `craco.config.js` with `eager: true`

**Menu Not Appearing:**
- Verify `./menuConfig` is exposed in ModuleFederationPlugin
- Check MenuLoaderService can load your menuConfig
- Look for console errors about module loading

**Tool Not Loading:**
- Verify both apps running (parent on 3000, yours on 3XXX)
- Check remoteEntry.js is accessible
- Verify ToolFrame has correct mapping

---

## Deployment

### 1. Prepare for Production

Update `craco.config.js` for production remote URLs:

```javascript
// Use environment variable for remote URL
const remoteUrl = process.env.REACT_APP_REMOTE_URL || 'http://localhost:3XXX';
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Project name: your-tool-name
# - Framework: Create React App
# - Build command: npm run build
# - Output directory: build
```

### 3. Set Environment Variables

In Vercel dashboard, set:
- `NODE_ENV=production`
- Any other environment variables your tool needs

### 4. Update Parent Platform

Update parent's remote URLs to point to production:

```javascript
// In parent's craco.config.js
remotes: {
  yourTool: "yourToolName@https://your-tool.vercel.app/remoteEntry.js",
}
```

---

## Troubleshooting

### White Screen After Adding Component

**Problem:** Blank white screen, console shows "Shared module not available for eager consumption"

**Solution:**
1. Check which @radix-ui package is missing
2. Add to `craco.config.js` shared section with `eager: true`
3. Fully restart dev server: `pkill -f "npm start" && npm start`

### Menu Not Showing in Sidebar

**Problem:** Tool loads but no menu items appear in sidebar

**Solution:**
1. Verify `./menuConfig` is exposed in ModuleFederationPlugin
2. Check `menuConfig.ts` exports correct structure
3. Verify MenuLoaderService can import the module
4. Check browser console for loading errors

### Module Not Found

**Problem:** "Cannot find module './menuConfig'" or similar

**Solution:**
1. Ensure file exists: `src/menuConfig.ts`
2. Verify path in ModuleFederationPlugin exposes matches file location
3. Restart dev server

### Port Already in Use

**Problem:** "Port 3XXX is already in use"

**Solution:**
```bash
# Find and kill process using port
lsof -ti:3XXX | xargs kill -9

# Or use different port in craco.config.js
```

### CORS Errors

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
- Ensure `craco.config.js` devServer has CORS headers
- For production, configure Vercel headers in `vercel.json`

---

## Best Practices

### 1. Component Organization

```
src/
├── components/
│   ├── ui/              # Shadcn components
│   ├── features/        # Feature-specific components
│   └── layout/          # Layout components
├── pages/               # Route pages
├── services/            # API services
├── types/               # TypeScript types
├── lib/                 # Utilities
├── hooks/               # Custom hooks
├── menuConfig.ts        # Menu configuration
├── App.tsx             # Main app component
└── index.tsx           # Entry point
```

### 2. TypeScript Types

Create `src/types/` for shared types:

```typescript
// src/types/models.ts
export interface Video {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
}
```

### 3. Error Handling

```typescript
import React, { ErrorBoundary } from 'react';

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <CardContent>
              <p>Something went wrong. Please refresh the page.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4. Loading States

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export const DataCard = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[250px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return <Card>{/* actual content */}</Card>;
};
```

### 5. Environment Variables

Create `.env.local`:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FEATURE_FLAG_NEW_UI=true
```

Use in code:

```typescript
const apiUrl = process.env.REACT_APP_API_URL;
```

---

## Summary

You now have a complete guide to building child applications for Media Orchestrator. Key takeaways:

1. ✅ Use Module Federation for true integration
2. ✅ Always expose `./menuConfig` for dynamic navigation
3. ✅ Include version tracking for better debugging
4. ✅ Use only Shadcn/ui components for consistent design
5. ✅ Remember: Every @radix-ui package needs `eager: true` in shared config
6. ✅ Test standalone first, then integrate with parent
7. ✅ Deploy each child app to its own Vercel project

**Next Steps:**
1. Create your child app following this guide
2. Test locally with parent platform
3. Deploy to Vercel
4. Register in production platform

**Need Help?**
- Check existing child apps: `hello-world-tool`, `video-asset-manager`
- Review parent platform's `ToolFrame.tsx` for integration patterns
- Check browser console for detailed error messages
- Test `remoteEntry.js` accessibility: `curl http://localhost:3XXX/remoteEntry.js`

Happy building! 🚀
