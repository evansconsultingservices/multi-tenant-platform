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
import { UserProfile, UserRole } from '@/types/user.types';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUpdateUser,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user' as UserRole,
    companyId: '',
    department: '',
    phoneNumber: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId || '',
        department: user.department || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await onUpdateUser(user.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user profile and role information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">First Name *</label>
              <Input
                value={formData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('firstName', e.target.value)}
                placeholder="First name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Last Name *</label>
              <Input
                value={formData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('lastName', e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email *</label>
            <Input
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
              type="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <Input
              value={formData.phoneNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+1 (555) 123-4567"
              type="tel"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role *</label>
            <select
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleInputChange('role', e.target.value as UserRole)
              }
              className="w-full p-2 border rounded-md bg-background"
              required
            >
              <option value={UserRole.USER}>User</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company ID *</label>
            <Input
              value={formData.companyId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('companyId', e.target.value)
              }
              placeholder="company-123"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Department</label>
            <Input
              value={formData.department}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('department', e.target.value)}
              placeholder="Engineering, Sales, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
