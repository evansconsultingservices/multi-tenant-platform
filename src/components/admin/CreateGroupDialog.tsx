import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { GroupService } from '@/services/group.service';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (data: {
    groupId: string;
    name: string;
    description?: string;
  }) => Promise<void>;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  open,
  onOpenChange,
  onCreateGroup,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [formData, setFormData] = useState({
    groupId: '',
    name: '',
    description: '',
  });

  const validateGroupId = async (groupId: string) => {
    if (!groupId.trim()) {
      return;
    }

    setValidating(true);
    try {
      const validation = await GroupService.validateGroupId(groupId);
      if (!validation.valid) {
        setError(validation.error || 'Invalid group ID');
      } else {
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate group ID');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.groupId.trim()) {
        throw new Error('Group ID is required');
      }
      if (!formData.name.trim()) {
        throw new Error('Group name is required');
      }

      // Validate groupId format
      const formatRegex = /^[a-z0-9-]+$/;
      if (!formatRegex.test(formData.groupId)) {
        throw new Error('Group ID must contain only lowercase letters, numbers, and hyphens');
      }

      await onCreateGroup({
        groupId: formData.groupId,
        name: formData.name,
        description: formData.description || undefined,
      });

      // Reset form
      setFormData({
        groupId: '',
        name: '',
        description: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);

    // Real-time validation for groupId
    if (field === 'groupId') {
      const timeoutId = setTimeout(() => {
        validateGroupId(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a group to organize related companies. Companies in the same group can share users.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Group Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Acme Media Group"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="groupId" className="text-sm font-medium text-foreground">
              Group ID *
            </label>
            <Input
              id="groupId"
              value={formData.groupId}
              onChange={(e) => handleChange('groupId', e.target.value.toLowerCase())}
              placeholder="acme-group"
              required
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only. Must be unique.
            </p>
            {validating && (
              <p className="text-xs text-blue-500">Checking availability...</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the group"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || validating}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
