import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tool } from '@/types/tool.types';

interface EditToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool | null;
  onUpdateTool: (toolId: string, updates: Partial<Tool>) => Promise<void>;
}

export const EditToolDialog: React.FC<EditToolDialogProps> = ({
  open,
  onOpenChange,
  tool,
  onUpdateTool,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    url: '',
    category: '',
    version: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance',
    requiredRole: 'user' as 'user' | 'admin' | 'super_admin',
    displayOrder: 0,
    featured: false,
    tags: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description,
        icon: tool.icon || '',
        url: tool.url,
        category: tool.category,
        version: tool.version,
        status: tool.status,
        requiredRole: tool.requiredRole,
        displayOrder: tool.displayOrder,
        featured: tool.featured,
        tags: tool.tags.join(', '),
      });
    }
  }, [tool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tool) return;

    if (!formData.name || !formData.description || !formData.url || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const updates: Partial<Tool> = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      await onUpdateTool(tool.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating tool:', error);
      alert('Failed to update tool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription>
            Update tool configuration and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                placeholder="Tool name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category *</label>
              <Input
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('category', e.target.value)}
                placeholder="e.g., Analytics, Development"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description *</label>
            <Input
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the tool"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">URL *</label>
            <Input
              value={formData.url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('url', e.target.value)}
              placeholder="https://example.com or http://localhost:3001"
              required
              type="url"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Icon (Emoji)</label>
              <Input
                value={formData.icon}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('icon', e.target.value)}
                placeholder="🛠️"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Version</label>
              <Input
                value={formData.version}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('version', e.target.value)}
                placeholder="1.0.0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Display Order</label>
              <Input
                value={formData.displayOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('displayOrder', parseInt(e.target.value) || 0)
                }
                placeholder="0"
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tags</label>
            <Input
              value={formData.tags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('tags', e.target.value)}
              placeholder="analytics, dashboard, reporting (comma-separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('status', e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Required Role</label>
              <select
                value={formData.requiredRole}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('requiredRole', e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('featured', e.target.checked)}
              />
              <span className="text-sm">Featured</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Tool'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
