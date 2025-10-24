import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserService } from '@/services/user.service';
import { ToolService } from '@/services/tool.service';
import { UserProfile } from '@/types/user.types';
import { Tool } from '@/types/tool.types';

interface GrantAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGrantAccess: (userId: string, toolId: string, accessLevel: 'read' | 'write' | 'admin') => Promise<void>;
  preselectedToolId?: string;
}

export const GrantAccessDialog: React.FC<GrantAccessDialogProps> = ({
  open,
  onOpenChange,
  onGrantAccess,
  preselectedToolId,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedToolId, setSelectedToolId] = useState(preselectedToolId || '');
  const [accessLevel, setAccessLevel] = useState<'read' | 'write' | 'admin'>('read');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (preselectedToolId) {
      setSelectedToolId(preselectedToolId);
    }
  }, [preselectedToolId]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [usersData, toolsData] = await Promise.all([
        UserService.getAllUsers(),
        ToolService.getAllTools(),
      ]);
      setUsers(usersData);
      setTools(toolsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !selectedToolId) {
      alert('Please select both a user and a tool');
      return;
    }

    try {
      setLoading(true);
      await onGrantAccess(selectedUserId, selectedToolId, accessLevel);

      // Reset form
      setSelectedUserId('');
      if (!preselectedToolId) {
        setSelectedToolId('');
      }
      setAccessLevel('read');
      onOpenChange(false);
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Failed to grant access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Grant Tool Access</DialogTitle>
          <DialogDescription>
            Assign a user access to a tool with specific permissions
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select User *</label>
              <select
                value={selectedUserId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Tool *</label>
              <select
                value={selectedToolId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedToolId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                required
                disabled={!!preselectedToolId}
              >
                <option value="">Choose a tool...</option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.icon} {tool.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Access Level *</label>
              <select
                value={accessLevel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setAccessLevel(e.target.value as 'read' | 'write' | 'admin')
                }
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                <option value="read">Read - View-only access</option>
                <option value="write">Write - Read and write access</option>
                <option value="admin">Admin - Full administrative access</option>
              </select>
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Access Level Descriptions:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong>Read:</strong> View tool content only</li>
                <li><strong>Write:</strong> View and modify content</li>
                <li><strong>Admin:</strong> Full control including settings</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || loadingData}>
                {loading ? 'Granting...' : 'Grant Access'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
