import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ToolService } from '@/services/tool.service';
import { Tool } from '@/types/tool.types';
import { UserProfile } from '@/types/user.types';
import { GrantAccessDialog } from './GrantAccessDialog';
import { useAuth } from '@/contexts/AuthContext';

export const ToolAccessManagement: React.FC = () => {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolUsers, setToolUsers] = useState<(UserProfile & { accessLevel: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantAccessDialog, setShowGrantAccessDialog] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    if (selectedTool) {
      loadToolUsers(selectedTool.id);
    }
  }, [selectedTool]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const toolsList = await ToolService.getAllTools();
      setTools(toolsList);
      if (toolsList.length > 0) {
        setSelectedTool(toolsList[0]);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadToolUsers = async (toolId: string) => {
    try {
      const users = await ToolService.getToolUsers(toolId);
      setToolUsers(users);
    } catch (error) {
      console.error('Error loading tool users:', error);
    }
  };

  const handleGrantAccess = async (userId: string, toolId: string, accessLevel: 'read' | 'write' | 'admin') => {
    if (!user) return;

    try {
      await ToolService.grantToolAccess(userId, toolId, accessLevel, user.id);
      if (selectedTool) {
        await loadToolUsers(selectedTool.id);
      }
    } catch (error) {
      console.error('Error granting access:', error);
      throw error;
    }
  };

  const handleRevokeAccess = async (userId: string, toolId: string) => {
    if (!window.confirm('Are you sure you want to revoke access for this user?')) {
      return;
    }

    try {
      await ToolService.revokeToolAccess(userId, toolId);
      if (selectedTool) {
        await loadToolUsers(selectedTool.id);
      }
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const getAccessLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'admin': return 'destructive';
      case 'write': return 'default';
      case 'read': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Access Control</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading access control...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Access Control</h2>
          <p className="text-muted-foreground text-sm">
            Manage user access to tools and configure permissions
          </p>
        </div>
        <Button onClick={() => setShowGrantAccessDialog(true)}>
          Grant Access
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
            <CardDescription>
              Select a tool to manage its access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">🛠️</div>
                <p>No tools available</p>
                <p className="text-sm mt-2">
                  Add tools first to manage access
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={selectedTool?.id === tool.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedTool(tool)}
                  >
                    <span className="mr-2">{tool.icon || '🛠️'}</span>
                    {tool.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Access for Selected Tool */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedTool ? `Access for ${selectedTool.name}` : 'Select a Tool'}
            </CardTitle>
            <CardDescription>
              {selectedTool
                ? 'Users who have access to this tool'
                : 'Choose a tool from the left to view its access permissions'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTool ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">👈</div>
                <p>Select a tool to view access</p>
              </div>
            ) : toolUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">🔒</div>
                <p>No users have access</p>
                <p className="text-sm mt-2">
                  Grant access to users to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatarUrl && (
                            <img
                              src={user.avatarUrl}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAccessLevelBadgeVariant(user.accessLevel)}>
                          {user.accessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeAccess(user.id, selectedTool!.id)}
                          >
                            Revoke
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <GrantAccessDialog
        open={showGrantAccessDialog}
        onOpenChange={setShowGrantAccessDialog}
        onGrantAccess={handleGrantAccess}
        preselectedToolId={selectedTool?.id}
      />
    </div>
  );
};