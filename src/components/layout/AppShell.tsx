import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ToolService } from '@/services/tool.service';
import { Tool } from '@/types/tool.types';
import {
  Settings,
  LogOut,
  Wrench,
  Home,
  Shield
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar';

export const AppShell: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    const loadUserTools = async () => {
      if (!user) return;

      try {
        const userTools = await ToolService.getUserTools(user.id);
        setTools(userTools);
      } catch (error) {
        console.error('Error loading tools:', error);
      }
    };

    loadUserTools();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  if (!user) {
    return null;
  }

  // Navigation items
  const navigationItems = [
    {
      name: 'Home',
      icon: Home,
      path: '/dashboard',
      isActive: location.pathname === '/dashboard'
    },
    ...tools.map(tool => ({
      name: tool.name,
      icon: Wrench, // Use same icon for all tools
      path: `/tools/${tool.id}`,
      isActive: location.pathname === `/tools/${tool.id}`
    }))
  ];

  // Add admin link for admins
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    navigationItems.push({
      name: 'Admin',
      icon: Shield,
      path: '/admin',
      isActive: location.pathname.startsWith('/admin')
    });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center space-x-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">MT</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold">Multi-Tenant Platform</h1>
              <p className="text-xs text-muted-foreground">Tools & Applications</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={item.isActive}
                        onClick={() => navigate(item.path)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex items-center space-x-3 mb-3 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || ''} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/settings')}
                    disabled
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};