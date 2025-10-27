# Child Application Development Guide

> **⚠️ DEPRECATED - Use [BUILDING_CHILD_APPS.md](/BUILDING_CHILD_APPS.md) instead**
>
> This guide is outdated and missing critical features:
> - ❌ Menu configuration system not documented
> - ❌ Version tracking system not documented
> - ❌ Latest Module Federation patterns missing
>
> **Please refer to [BUILDING_CHILD_APPS.md](/BUILDING_CHILD_APPS.md) for the complete, up-to-date guide.**

---

# Original Guide (Deprecated)

This guide will help you build and integrate tool applications with the multi-tenant platform using the **Shadcn/ui component framework**.

## Overview

Each tool application is a standalone React application that integrates with the parent platform for authentication and user management. The platform handles user authentication, role-based access control, and routing while your tool focuses on its core functionality.

**Important**: All child applications must use **Shadcn/ui** as the component framework to maintain consistency with the parent platform's design system.

## Getting Started

### 1. Create a New React Project

```bash
# Create a new React app with TypeScript
npx create-react-app my-tool --template typescript
cd my-tool

# Install required dependencies
npm install firebase
npm install @types/jsonwebtoken

# Install Shadcn/ui and Tailwind CSS
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install Shadcn/ui CLI and core dependencies
npx shadcn-ui@latest init
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

### 2. Configure Shadcn/ui

Initialize Shadcn/ui in your project:

```bash
# Initialize Shadcn/ui with recommended settings
npx shadcn-ui@latest init

# When prompted, use these settings:
# - TypeScript: Yes
# - Style: Default
# - Tailwind CSS: Yes
# - Import alias: @/components
# - Configure path mapping: Yes
```

Update your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
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
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 3. Install Common Shadcn/ui Components

Install the most commonly used components:

```bash
# Core UI components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
```

### 4. Environment Configuration

Create a `.env.local` file:

```
REACT_APP_PARENT_PLATFORM_URL=https://your-platform.vercel.app
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project
REACT_APP_ALLOWED_ORIGINS=https://your-platform.vercel.app,http://localhost:3000
```

### 5. Setup Global CSS

Update your `src/index.css` to include Tailwind CSS and Shadcn/ui styles:

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
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
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

## Authentication Integration

### 1. JWT Validation Service

Create `src/services/auth.service.ts`:

```typescript
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

export class AuthService {
  private static user: PlatformUser | null = null;

  static async validateToken(): Promise<PlatformUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch(`${process.env.REACT_APP_PARENT_PLATFORM_URL}/api/validate-user`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const userData = await response.json();
              this.user = userData;
              resolve(userData);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
        unsubscribe();
      });
    });
  }

  static getUser(): PlatformUser | null {
    return this.user;
  }

  static redirectToLogin(): void {
    window.location.href = process.env.REACT_APP_PARENT_PLATFORM_URL || '';
  }
}
```

### 2. Protected Route Component

Create `src/components/ProtectedRoute.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    validateUser();
  }, []);

  const validateUser = async () => {
    try {
      const userData = await AuthService.validateToken();
      if (!userData) {
        AuthService.redirectToLogin();
        return;
      }

      // Check role permissions
      const roleHierarchy = { user: 1, admin: 2, super_admin: 3 };
      const userLevel = roleHierarchy[userData.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 1;

      if (userLevel < requiredLevel) {
        AuthService.redirectToLogin();
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Authentication failed:', error);
      AuthService.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Validating access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
};
```

## Building Your Tool Interface

### 1. Example Tool Component

Create `src/components/MyTool.tsx`:

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AuthService } from '../services/auth.service';

export const MyTool: React.FC = () => {
  const [data, setData] = useState('');
  const user = AuthService.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Tool</h1>
            <p className="text-muted-foreground text-sm">Welcome, {user?.firstName}!</p>
          </div>
          <Badge variant="secondary">
            {user?.role?.replace('_', ' ')}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Dashboard</CardTitle>
              <CardDescription>
                This is your tool's main interface using Shadcn/ui components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter some data..."
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => console.log('Processing:', data)}>
                    Process
                  </Button>
                </div>

                {data && (
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <p className="text-sm">
                        Processing: <span className="font-mono">{data}</span>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
```

### 2. Update App.tsx

```typescript
import React from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MyTool } from './components/MyTool';
import './App.css';

function App() {
  return (
    <div className="App">
      <ProtectedRoute requiredRole="user">
        <MyTool />
      </ProtectedRoute>
    </div>
  );
}

export default App;
```

## Design System Guidelines

### Using Shadcn/ui Components

**Always use Shadcn/ui components** instead of native HTML elements or other libraries:

✅ **Correct:**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="Search..." />
    <Button>Save Changes</Button>
  </CardContent>
</Card>
```

❌ **Incorrect:**
```typescript
<div className="border rounded-lg p-4">
  <h2>Settings</h2>
  <input type="text" placeholder="Search..." />
  <button>Save Changes</button>
</div>
```

### Color Usage

Use semantic color tokens instead of hardcoded colors:

✅ **Correct:**
```typescript
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Subtitle</p>
  <Button variant="destructive">Delete</Button>
</div>
```

❌ **Incorrect:**
```typescript
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  <p className="text-gray-500">Subtitle</p>
  <button className="bg-red-500 text-white">Delete</button>
</div>
```

### Common Component Patterns

1. **Data Display:**
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>
        <Badge variant="default">Active</Badge>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

2. **Forms:**
```typescript
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="Enter email" />
  </div>
  <Button type="submit">Submit</Button>
</form>
```

3. **Dialogs:**
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to perform this action?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Deployment

### 1. Build Configuration

Update your `package.json`:

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:vercel": "REACT_APP_PARENT_PLATFORM_URL=$PARENT_PLATFORM_URL npm run build"
  }
}
```

### 2. Vercel Configuration

Create `vercel.json`:

```json
{
  "functions": {
    "src/pages/api/**/*.ts": {
      "runtime": "@vercel/node"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://*.vercel.app"
        }
      ]
    }
  ]
}
```

### 3. Environment Variables

Set these in Vercel dashboard:
- `PARENT_PLATFORM_URL`: Your platform's URL
- `REACT_APP_FIREBASE_PROJECT_ID`: Firebase project ID

## Testing

Create `src/components/__tests__/MyTool.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyTool } from '../MyTool';

// Mock the auth service
jest.mock('../services/auth.service', () => ({
  AuthService: {
    getUser: () => ({
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    })
  }
}));

test('renders tool dashboard', () => {
  render(<MyTool />);
  expect(screen.getByText('Tool Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Welcome, Test!')).toBeInTheDocument();
});
```

## Security Considerations

1. **Always validate tokens** on component mount
2. **Use HTTPS** in production
3. **Implement proper CORS** headers
4. **Never store sensitive data** in localStorage
5. **Validate user permissions** for each protected action

## Support

For issues or questions:
1. Check the Shadcn/ui documentation: https://ui.shadcn.com/
2. Review the parent platform's admin panel for tool configuration
3. Ensure your tool is properly registered in the platform

Remember: **Always use Shadcn/ui components** to maintain design consistency with the parent platform!