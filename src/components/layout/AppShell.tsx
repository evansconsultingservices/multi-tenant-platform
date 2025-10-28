import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { ToolService } from '@/services/tool.service';
import { MenuLoaderService } from '@/services/menuLoader.service';
import { Tool } from '@/types/tool.types';
import { MenuItem } from '@/types/menu.types';
import {
  Settings,
  LogOut,
  Wrench,
  Home,
  Shield,
  ChevronRight,
  Building2,
  Cog
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar';

export const AppShell: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolMenus, setToolMenus] = useState<Map<string, MenuItem[]>>(new Map());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['admin']));

  // Map tool to Module Federation config
  const getToolConfig = useCallback((tool: Tool): { remoteName: string; remoteUrl: string } | null => {
    const getRemoteEntryUrl = (baseUrl: string): string => {
      const url = new URL(baseUrl);
      return `${url.origin}/remoteEntry.js`;
    };

    if (tool.url.includes('3001') || tool.name.toLowerCase().includes('hello world')) {
      return {
        remoteName: 'helloWorld',
        remoteUrl: getRemoteEntryUrl(tool.url),
      };
    }

    if (tool.url.includes('3002') || tool.name.toLowerCase().includes('cloudinary')) {
      return {
        remoteName: 'cloudinaryTool',
        remoteUrl: getRemoteEntryUrl(tool.url),
      };
    }

    if (tool.url.includes('3004') || tool.name.toLowerCase().includes('video asset')) {
      return {
        remoteName: 'videoAssetManager',
        remoteUrl: getRemoteEntryUrl(tool.url),
      };
    }

    if (tool.url.includes('3005') || tool.url.includes('podcast-manager') || tool.name.toLowerCase().includes('podcast')) {
      return {
        remoteName: 'podcastManager',
        remoteUrl: getRemoteEntryUrl(tool.url),
      };
    }

    return null;
  }, []);

  const loadToolMenus = useCallback(async (tools: Tool[]) => {
    const newToolMenus = new Map<string, MenuItem[]>();
    const toolsWithMenus = new Set<string>();

    for (const tool of tools) {
      const config = getToolConfig(tool);
      if (config) {
        try {
          const menuItems = await MenuLoaderService.loadToolMenu(
            config.remoteName,
            config.remoteUrl
          );
          if (menuItems.length > 0) {
            newToolMenus.set(tool.id, menuItems);
            toolsWithMenus.add(tool.id);
          }
        } catch (error) {
          console.log(`No menu config for ${tool.name}`);
        }
      }
    }

    setToolMenus(newToolMenus);

    // Auto-expand tools that have submenus
    if (toolsWithMenus.size > 0) {
      setExpandedMenus(prev => {
        const next = new Set(prev);
        toolsWithMenus.forEach(id => next.add(id));
        return next;
      });
    }
  }, [getToolConfig]);

  useEffect(() => {
    const loadUserTools = async () => {
      if (!user) return;

      try {
        const userTools = await ToolService.getUserTools(user.id);
        setTools(userTools);

        // Load menu configs for each tool
        loadToolMenus(userTools);
      } catch (error) {
        console.error('Error loading tools:', error);
      }
    };

    loadUserTools();
  }, [user, loadToolMenus]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

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

  // Admin menu items
  const adminMenuItems = [
    { id: 'companies', label: 'Companies', icon: Building2, path: '/admin/companies' },
    { id: 'tools', label: 'Tools', icon: Wrench, path: '/admin/tools' },
    { id: 'settings', label: 'Settings', icon: Cog, path: '/admin/settings' },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center space-x-2 px-2">
            <svg className="h-8 w-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="12" fill="#f97316"/>
              <circle cx="50" cy="15" r="10" fill="#f97316"/>
              <circle cx="85" cy="30" r="10" fill="#f97316"/>
              <circle cx="85" cy="70" r="10" fill="#f97316"/>
              <circle cx="50" cy="85" r="10" fill="#f97316"/>
              <circle cx="15" cy="70" r="10" fill="#f97316"/>
              <circle cx="15" cy="30" r="10" fill="#f97316"/>
              <line x1="50" y1="38" x2="50" y2="25" stroke="#f97316" strokeWidth="4"/>
              <line x1="59" y1="45" x2="75" y2="35" stroke="#f97316" strokeWidth="4"/>
              <line x1="59" y1="55" x2="75" y2="65" stroke="#f97316" strokeWidth="4"/>
              <line x1="50" y1="62" x2="50" y2="75" stroke="#f97316" strokeWidth="4"/>
              <line x1="41" y1="55" x2="25" y2="65" stroke="#f97316" strokeWidth="4"/>
              <line x1="41" y1="45" x2="25" y2="35" stroke="#f97316" strokeWidth="4"/>
            </svg>
            <div>
              <h1 className="text-sm font-semibold">Media Orchestrator</h1>
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
                {/* Home */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/dashboard'}
                    onClick={() => navigate('/dashboard')}
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Admin Menu - Collapsible */}
                {user && (user.role === 'admin' || user.role === 'super_admin') && (
                  <Collapsible
                    open={expandedMenus.has('admin')}
                    onOpenChange={() => toggleMenu('admin')}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={location.pathname.startsWith('/admin')}
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin</span>
                          <ChevronRight
                            className={`ml-auto h-4 w-4 transition-transform ${
                              expandedMenus.has('admin') ? 'rotate-90' : ''
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {adminMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <SidebarMenuSubItem key={item.id}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === item.path}
                                >
                                  <Link to={item.path}>
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {/* Tool Menus - Collapsible */}
                {tools.map(tool => {
                  const hasSubMenu = toolMenus.has(tool.id) && toolMenus.get(tool.id)!.length > 0;

                  if (hasSubMenu) {
                    return (
                      <Collapsible
                        key={tool.id}
                        open={expandedMenus.has(tool.id)}
                        onOpenChange={() => toggleMenu(tool.id)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={location.pathname === `/tools/${tool.id}`}
                            >
                              {tool.icon ? (
                                <span className="text-base">{tool.icon}</span>
                              ) : (
                                <Wrench className="h-4 w-4" />
                              )}
                              <span>{tool.name}</span>
                              <ChevronRight
                                className={`ml-auto h-4 w-4 transition-transform ${
                                  expandedMenus.has(tool.id) ? 'rotate-90' : ''
                                }`}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {toolMenus.get(tool.id)!.map((menuItem) => (
                                <SidebarMenuSubItem key={menuItem.id}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={location.pathname === `/tools/${tool.id}${menuItem.path}`}
                                  >
                                    <Link to={`/tools/${tool.id}${menuItem.path}`}>
                                      <span>{menuItem.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  } else {
                    // Simple menu item without sub-menu
                    return (
                      <SidebarMenuItem key={tool.id}>
                        <SidebarMenuButton
                          isActive={location.pathname === `/tools/${tool.id}`}
                          onClick={() => navigate(`/tools/${tool.id}`)}
                        >
                          {tool.icon ? (
                            <span className="text-base">{tool.icon}</span>
                          ) : (
                            <Wrench className="h-4 w-4" />
                          )}
                          <span>{tool.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
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
