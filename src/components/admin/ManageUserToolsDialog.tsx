import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfile } from '@/types/user.types';
import { Tool } from '@/types/tool.types';
import { ToolService } from '@/services/tool.service';
import { useAuth } from '@/contexts/AuthContext';

interface ManageUserToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
}

interface ToolPermission extends Tool {
  hasAccess: boolean;
  source: 'company' | 'user' | 'none';
  accessLevel?: 'read' | 'write' | 'admin';
  userAccessLevel?: 'read' | 'write' | 'admin';
}

export const ManageUserToolsDialog: React.FC<ManageUserToolsDialogProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  const { user: currentUser } = useAuth();
  const [tools, setTools] = useState<ToolPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTools();
    }
  }, [open, user.id]);

  const loadTools = async () => {
    try {
      setLoading(true);

      // Get all available tools
      const allTools = await ToolService.getAllTools();

      // Get company tools
      const companyTools = await ToolService.getCompanyTools(user.companyId);
      const companyToolsMap = new Map(companyTools.map(t => [t.id, t]));

      // Get user's explicit tool access
      const userTools = await ToolService.getUserTools(user.id);
      const userToolsMap = new Map(userTools.map(t => [t.id, t]));

      // Merge the data
      const toolPermissions: ToolPermission[] = allTools.map(tool => {
        const hasCompanyAccess = companyToolsMap.has(tool.id);
        const hasUserAccess = userToolsMap.has(tool.id);

        let source: 'company' | 'user' | 'none';
        if (hasUserAccess && !hasCompanyAccess) {
          source = 'user';
        } else if (hasCompanyAccess) {
          source = 'company';
        } else {
          source = 'none';
        }

        return {
          ...tool,
          hasAccess: hasUserAccess || hasCompanyAccess,
          source,
          accessLevel: hasUserAccess
            ? userToolsMap.get(tool.id)?.accessLevels?.[0]?.level
            : hasCompanyAccess
            ? companyToolsMap.get(tool.id)?.accessLevels?.[0]?.level
            : undefined,
          userAccessLevel: hasUserAccess ? userToolsMap.get(tool.id)?.accessLevels?.[0]?.level : undefined,
        };
      });

      setTools(toolPermissions);
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (tool: ToolPermission) => {
    const userId = (currentUser as any)?.uid || (currentUser as any)?.id;
    if (!userId) return;

    try {
      setUpdating(tool.id);

      if (tool.source === 'user') {
        // User has explicit access, revoke it
        await ToolService.revokeToolAccess(user.id, tool.id);
      } else if (tool.source === 'company') {
        // Has company access, explicitly revoke for this user
        await ToolService.revokeToolAccess(user.id, tool.id);
      } else {
        // No access, grant to user
        await ToolService.grantToolAccess(
          user.id,
          tool.id,
          'read',
          userId
        );
      }

      await loadTools();
    } catch (error) {
      console.error('Error toggling tool access:', error);
      alert('Failed to update tool access');
    } finally {
      setUpdating(null);
    }
  };

  const handleChangeAccessLevel = async (
    tool: ToolPermission,
    newLevel: 'read' | 'write' | 'admin'
  ) => {
    const userId = (currentUser as any)?.uid || (currentUser as any)?.id;
    if (!userId || !tool.hasAccess) return;

    try {
      setUpdating(tool.id);

      await ToolService.grantToolAccess(
        user.id,
        tool.id,
        newLevel,
        userId
      );

      await loadTools();
    } catch (error) {
      console.error('Error updating access level:', error);
      alert('Failed to update access level');
    } finally {
      setUpdating(null);
    }
  };

  const getSourceBadge = (source: 'company' | 'user' | 'none') => {
    switch (source) {
      case 'company':
        return <Badge variant="secondary">From Company</Badge>;
      case 'user':
        return <Badge variant="default">User Override</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tool Access</DialogTitle>
          <DialogDescription>
            Configure tool permissions for {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading tools...</p>
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🛠️</div>
              <p>No tools available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tools.map((tool) => (
                <Card key={tool.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {tool.icon && <span className="text-xl">{tool.icon}</span>}
                          <Label htmlFor={`tool-${tool.id}`} className="font-medium text-foreground">
                            {tool.name}
                          </Label>
                          {getSourceBadge(tool.source)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {tool.hasAccess && (
                          <Select
                            value={tool.userAccessLevel || tool.accessLevel || 'read'}
                            onValueChange={(value: 'read' | 'write' | 'admin') =>
                              handleChangeAccessLevel(tool, value)
                            }
                            disabled={updating === tool.id || tool.source === 'company'}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">Read</SelectItem>
                              <SelectItem value="write">Write</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        <Switch
                          id={`tool-${tool.id}`}
                          checked={tool.hasAccess}
                          onCheckedChange={() => handleToggleAccess(tool)}
                          disabled={updating === tool.id || tool.status !== 'active'}
                        />
                      </div>
                    </div>

                    {tool.source === 'company' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Access inherited from company. Toggle off to explicitly revoke.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
