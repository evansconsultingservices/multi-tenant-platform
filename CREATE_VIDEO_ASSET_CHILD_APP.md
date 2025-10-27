# Creating a Video Asset Manager Child App

> **⚠️ DEPRECATED - Use [BUILDING_CHILD_APPS.md](/BUILDING_CHILD_APPS.md) instead**
>
> This guide is outdated and missing recent platform updates:
> - ❌ Version tracking system not included
> - ❌ Latest Module Federation patterns missing
> - ❌ Menu configuration details incomplete
>
> **Please refer to [BUILDING_CHILD_APPS.md](/BUILDING_CHILD_APPS.md) for the complete, up-to-date guide.**
>
> This document remains as a reference for the video-asset-manager app specifically.

---

# Original Guide (Deprecated)

This guide provides step-by-step instructions to create a new child app for listing videos from an asset management platform API, combining the CHILD_APPLICATION_GUIDE.md with the Module Federation architecture.

## Prerequisites

- Node.js and npm installed
- Main platform running on port 3000
- Understanding of React, TypeScript, and Tailwind CSS
- Familiarity with Module Federation concepts

---

## Step 1: Create the Child App Structure

```bash
# Navigate to child_apps directory
cd /Users/sean/Projects/SNE\ Projects/multi-tenant-platform/child_apps

# Create new React app with TypeScript
npx create-react-app video-asset-manager --template typescript

# Navigate into the new app
cd video-asset-manager
```

---

## Step 2: Install Required Dependencies

```bash
# Core dependencies
npm install firebase
npm install @types/jsonwebtoken

# Tailwind CSS and Shadcn/ui
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Shadcn/ui core dependencies
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Module Federation (required for integration)
npm install -D craco @craco/craco

# Additional utilities
npm install date-fns  # For date formatting
```

---

## Step 3: Configure CRACO for Module Federation

Create `craco.config.js` in the root:

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
      // Add Module Federation plugin
      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
          name: "videoAssetManager",
          filename: "remoteEntry.js",
          exposes: {
            "./App": "./src/App",
            "./VideoAssetManager": "./src/App",
          },
          shared: {
            react: {
              singleton: true,
              requiredVersion: deps.react,
              eager: true,  // CRITICAL: Must be eager
            },
            "react-dom": {
              singleton: true,
              requiredVersion: deps["react-dom"],
              eager: true,
            },
            "react-router-dom": {
              singleton: true,
              requiredVersion: deps["react-router-dom"],
              eager: true,
            },
            "lucide-react": {
              singleton: true,
              requiredVersion: deps["lucide-react"],
              eager: true,
            },
            "@radix-ui/react-slot": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-slot"],
              eager: true,
            },
            "@radix-ui/react-label": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-label"],
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
          },
        })
      );

      // Fix for Module Federation
      webpackConfig.output.publicPath = "auto";
      webpackConfig.optimization.runtimeChunk = false;

      return webpackConfig;
    },
  },
  devServer: {
    port: 3004,  // Use unique port
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
    // If you have a backend API, add proxy here
    proxy: {
      '/api/videos': {
        target: 'http://localhost:3005',  // Your backend port
        pathRewrite: { '^/api/videos': '' },
        changeOrigin: true
      }
    }
  }
};
```

**Important Notes:**
- ⚠️ **CRITICAL**: All shared dependencies MUST have `eager: true` or you'll get a white screen
- 🔌 Port 3004 is used for this app (main: 3000, hello-world: 3001, cloudinary: 3002)
- 🔄 Proxy configuration routes `/api/videos` to your backend API

---

## Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "start": "PORT=3004 craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "react-scripts eject"
  }
}
```

---

## Step 5: Configure TypeScript

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

---

## Step 6: Configure Tailwind CSS

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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

---

## Step 7: Setup Global CSS

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

---

## Step 8: Install Shadcn/ui Components

```bash
# Initialize Shadcn/ui
npx shadcn@latest init

# Install components you'll need
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add tabs
npx shadcn@latest add skeleton  # For loading states
```

**Note:** After adding Shadcn components, you MUST update `craco.config.js` to add any new `@radix-ui` dependencies to the `shared` section with `eager: true`.

---

## Step 9: Create TypeScript Interfaces

Create `src/types/video.ts`:

```typescript
export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  createdAt: string;
  size?: number;
  format?: string;
  status?: 'processing' | 'ready' | 'failed';
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## Step 10: Create API Service

Create `src/services/videoApi.ts`:

```typescript
import { Video, VideoListResponse } from '../types/video';

const API_BASE_URL = '/api/videos'; // Uses proxy from craco.config.js

export class VideoApiService {
  static async listVideos(page: number = 1, pageSize: number = 20): Promise<VideoListResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}?page=${page}&pageSize=${pageSize}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }

  static async getVideo(id: string): Promise<Video> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  }

  static async deleteVideo(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
}
```

---

## Step 11: Create Main App Component

Create/update `src/App.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Skeleton } from './components/ui/skeleton';
import { Video, Loader2, Search, Play, Trash2 } from 'lucide-react';
import { VideoApiService } from './services/videoApi';
import { Video as VideoType } from './types/video';

function App() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await VideoApiService.listVideos();
      setVideos(response.videos);
    } catch (err) {
      setError('Failed to load videos. Please try again.');
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await VideoApiService.deleteVideo(id);
      // Optimistic update using functional setState
      setVideos(currentVideos => currentVideos.filter(v => v.id !== id));
    } catch (err) {
      alert('Failed to delete video. Please try again.');
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Video className="h-10 w-10 text-primary" />
            Video Asset Manager
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and organize your video assets
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Video List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Videos ({filteredVideos.length})
              </CardTitle>
              <CardDescription>
                Your video library
              </CardDescription>
            </div>
            <Button onClick={fetchVideos} variant="outline" size="sm">
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-20 w-32" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos found</p>
                {searchQuery && (
                  <p className="text-sm mt-2">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: VideoType;
  onDelete: (id: string) => void;
}

function VideoCard({ video, onDelete }: VideoCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(video.id);
    } catch (err) {
      setDeleting(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          {/* Thumbnail */}
          <div className="relative w-32 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {video.status && (
              <Badge
                variant={video.status === 'ready' ? 'default' : 'secondary'}
                className="absolute bottom-1 right-1 text-xs"
              >
                {video.status}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {video.title}
            </h4>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {video.duration && (
                <span>Duration: {formatDuration(video.duration)}</span>
              )}
              {video.size && (
                <span>Size: {formatFileSize(video.size)}</span>
              )}
              {video.format && (
                <Badge variant="outline">{video.format.toUpperCase()}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Created: {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(video.url, '_blank')}
          >
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## Step 12: Create Utility Files

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Step 13: Register Tool in Main Platform

Add the tool to your main platform's database/configuration:

```typescript
// In your main platform's admin panel or database
{
  name: "Video Asset Manager",
  url: "http://localhost:3004",  // Dev URL
  description: "Manage and organize video assets",
  icon: "Video",
  category: "media",
  status: "active"
}
```

---

## Step 14: Update Main Platform Module Federation

Add to `/multi-tenant-platform/craco.config.js`:

```javascript
remotes: {
  helloWorld: "helloWorld@http://localhost:3001/remoteEntry.js",
  cloudinaryTool: "cloudinaryTool@http://localhost:3002/remoteEntry.js",
  videoAssetManager: "videoAssetManager@http://localhost:3004/remoteEntry.js",
},
```

---

## Step 15: Update ToolFrame Component

In `/multi-tenant-platform/src/components/tools/ToolFrame.tsx`, add mapping:

```typescript
if (tool.url.includes('3004') || tool.name.toLowerCase().includes('video asset')) {
  return {
    remoteName: 'videoAssetManager',
    exposedModule: './App',
    remoteUrl: getRemoteEntryUrl(tool.url),
    fallbackUrl: tool.url
  };
}
```

---

## Step 16: Start Development

```bash
# Terminal 1: Start main platform
cd /Users/sean/Projects/SNE\ Projects/multi-tenant-platform
npm start

# Terminal 2: Start your new video asset manager
cd child_apps/video-asset-manager
npm start

# Terminal 3: If you have a backend API
cd child_apps/video-asset-backend
npm start
```

---

## Step 17: Test Your App

1. **Direct access**: Visit `http://localhost:3004`
2. **Via platform**: Login to main platform and navigate to Video Asset Manager tool
3. **Check Module Federation**: Open browser console, verify no "Shared module" errors
4. **Test API**: Verify videos load from your API

---

## Optional: Create Backend API

If you need a simple backend, create `child_apps/video-asset-backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data
const videos = [
  {
    id: '1',
    title: 'Sample Video 1',
    url: 'https://example.com/video1.mp4',
    thumbnail: 'https://via.placeholder.com/320x180',
    duration: 125,
    size: 15728640,
    format: 'mp4',
    status: 'ready',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Sample Video 2',
    url: 'https://example.com/video2.mp4',
    thumbnail: 'https://via.placeholder.com/320x180',
    duration: 240,
    size: 31457280,
    format: 'mp4',
    status: 'ready',
    createdAt: new Date().toISOString()
  },
  // Add more mock videos...
];

app.get('/', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);

  res.json({
    videos: videos.slice(start, end),
    total: videos.length,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

app.get('/:id', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json(video);
});

app.delete('/:id', (req, res) => {
  const index = videos.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Video not found' });
  }
  videos.splice(index, 1);
  res.json({ success: true });
});

app.listen(3005, () => {
  console.log('Video API running on port 3005');
});
```

Backend `package.json`:

```json
{
  "name": "video-asset-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

---

## Troubleshooting

### White Screen Error

**Problem:** App shows white screen when loaded via Module Federation

**Solution:**
1. Check browser console for "Shared module is not available for eager consumption"
2. Ensure ALL shared dependencies in `craco.config.js` have `eager: true`
3. Restart the dev server after changing `craco.config.js`

### Delete Not Working

**Problem:** Optimistic update doesn't remove item from UI

**Solution:**
Use functional setState:
```typescript
// ❌ Wrong - uses stale closure
setVideos(videos.filter(v => v.id !== id));

// ✅ Correct - uses current state
setVideos(currentVideos => currentVideos.filter(v => v.id !== id));
```

### API Not Found (404)

**Problem:** API calls return 404 errors

**Solution:**
1. Verify backend is running on port 3005
2. Check proxy configuration in `craco.config.js`
3. Verify API endpoint paths match

### Module Federation Not Loading

**Problem:** Tool doesn't load in main platform

**Solution:**
1. Verify child app is running on port 3004
2. Check `remoteEntry.js` is accessible: `http://localhost:3004/remoteEntry.js`
3. Verify ToolFrame.tsx has correct mapping
4. Check main platform's craco.config.js includes the remote

---

## Key Points to Remember

1. ✅ **Always add `eager: true`** to Module Federation shared dependencies
2. ✅ **Use Shadcn/ui components** exclusively for UI
3. ✅ **Use functional setState** for optimistic updates: `setState(prev => ...)`
4. ✅ **Unique port** for each child app (3004 in this case)
5. ✅ **Test standalone** first (`localhost:3004`) before integrating
6. ✅ **Check browser console** for Module Federation errors
7. ✅ **Restart dev servers** after changing Module Federation config

---

## Port Assignments

- **3000**: Main Platform (shell)
- **3001**: Hello World Tool
- **3002**: Cloudinary Tool
- **3003**: Cloudinary Backend
- **3004**: Video Asset Manager (this app)
- **3005**: Video Asset Backend (optional)

---

## Next Steps

1. Connect to your actual video asset management API
2. Add authentication/authorization
3. Implement pagination for large video lists
4. Add video upload functionality
5. Add filtering and sorting options
6. Implement video preview/playback
7. Add batch operations (delete multiple, etc.)

Your new video asset manager child app is now ready to integrate with your multi-tenant platform!
