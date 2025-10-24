import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ToolManagement } from './ToolManagement';
import { ToolAccessManagement } from './ToolAccessManagement';
import { InitializeHelloWorldTool } from './InitializeHelloWorldTool';
import { CompanyManagement } from './CompanyManagement';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    navigate(`/admin?tab=${value}`);
  };

  // Only admins and super admins can access this panel
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administration Panel</h1>
            <p className="text-muted-foreground text-sm">
              Manage users, tools, and platform settings
            </p>
          </div>
          <Breadcrumb className="mt-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="companies">🏢 Companies</TabsTrigger>
            <TabsTrigger value="tools">🛠️ Tools</TabsTrigger>
            <TabsTrigger value="access">🔒 Access Control</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            <CompanyManagement />
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <ToolManagement />
          </TabsContent>

          <TabsContent value="access" className="mt-6">
            <ToolAccessManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const AdminOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <InitializeHelloWorldTool />

      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1</div>
              <p className="text-xs text-muted-foreground">+0 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Active Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">Ready to add tools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Tool Access Grants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">Configure access below</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-20 flex-col">
            <div className="text-2xl mb-2">🛠️</div>
            Add New Tool
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <div className="text-2xl mb-2">👤</div>
            Invite User
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <div className="text-2xl mb-2">🔑</div>
            Manage Access
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <div className="text-2xl mb-2">📊</div>
            View Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Platform Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure platform-wide settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">⚙️</div>
            <p>Settings panel coming soon</p>
            <p className="text-sm mt-2">
              This will include platform configuration, security settings, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};