import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ArrowRight,
  Sparkles,
  Clock,
  User
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null; // This shouldn't happen due to ProtectedRoute, but good to be safe
  }

  // Available tools for quick access
  const availableTools = [
    {
      id: 'hello-world',
      name: 'Hello World Tool',
      description: 'Basic tool for testing platform integration and functionality',
      icon: Wrench,
      path: '/tools/hello-world',
      status: 'Available' as const,
      category: 'Development'
    }
    // Add more tools here as they become available
  ];

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Good {getTimeOfDay()}, {user?.firstName}!
          <Sparkles className="inline-block ml-2 h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome to your multi-tenant platform. Select a tool from the sidebar to get started, or explore what's available below.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableTools.length}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user?.role.replace('_', ' ')}</div>
            <p className="text-xs text-muted-foreground">Access level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">Platform access</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Tools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Available Tools</h2>
          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
            {availableTools.length} Active
          </Badge>
        </div>

        {availableTools.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {tool.category}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                        {tool.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription>{tool.description}</CardDescription>
                    <Button
                      className="w-full"
                      onClick={() => navigate(tool.path)}
                    >
                      Open Tool
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Wrench className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tools available</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                Contact your administrator to get access to tools, or if you're an admin, configure them in the admin panel.
              </p>
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Button onClick={() => navigate('/admin')}>
                  Configure Tools
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Here are some tips to help you make the most of your platform experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              1
            </div>
            <div>
              <p className="font-medium">Browse Available Tools</p>
              <p className="text-sm text-muted-foreground">
                Use the sidebar navigation to explore and access your available tools
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              2
            </div>
            <div>
              <p className="font-medium">Access Tools Seamlessly</p>
              <p className="text-sm text-muted-foreground">
                Tools are embedded within the platform for a seamless experience
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              3
            </div>
            <div>
              <p className="font-medium">Manage Your Account</p>
              <p className="text-sm text-muted-foreground">
                Use the user menu at the bottom of the sidebar to access settings and sign out
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};