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
import { UserRole } from '@/types/user.types';
import { CompanyService } from '@/services/company.service';
import { Company } from '@/types/company.types';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteUser: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    companyId: string;
    department?: string;
  }) => Promise<void>;
  defaultCompanyId?: string;
}

export const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  open,
  onOpenChange,
  onInviteUser,
  defaultCompanyId,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.USER,
    companyId: '',
    department: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesList = await CompanyService.getAllCompanies();
      setCompanies(companiesList);
      // Use defaultCompanyId if provided, otherwise auto-select first company
      if (defaultCompanyId) {
        setFormData(prev => ({ ...prev, companyId: defaultCompanyId }));
      } else if (companiesList.length > 0 && !formData.companyId) {
        setFormData(prev => ({ ...prev, companyId: companiesList[0].id }));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await onInviteUser(formData);

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: UserRole.USER,
        companyId: companies.length > 0 ? companies[0].id : '',
        department: '',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to invite user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. The user will need to sign in with Google OAuth using the email address you provide.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">First Name *</label>
              <Input
                value={formData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Last Name *</label>
              <Input
                value={formData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email *</label>
            <Input
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
              placeholder="john.doe@example.com"
              type="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role *</label>
            <select
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleInputChange('role', e.target.value as UserRole)
              }
              className="w-full p-2 border border-input rounded-md bg-background text-foreground"
              required
            >
              <option value={UserRole.USER}>User - Standard access</option>
              <option value={UserRole.ADMIN}>Admin - Manage organization</option>
              <option value={UserRole.SUPER_ADMIN}>Super Admin - Full system access</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company *</label>
            {loadingCompanies ? (
              <div className="p-2 text-sm text-muted-foreground">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="p-2 text-sm text-destructive">
                No companies available. Please create a company first.
              </div>
            ) : (
              <select
                value={formData.companyId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleInputChange('companyId', e.target.value)
                }
                className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                required
                disabled={!!defaultCompanyId}
              >
                <option value="">Select a company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.slug})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Department (Optional)</label>
            <Input
              value={formData.department}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('department', e.target.value)}
              placeholder="Engineering, Sales, etc."
            />
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Note:</p>
            <p className="text-muted-foreground">
              The user will need to sign in with Google OAuth using the email address provided above.
              Make sure they have access to this email account.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
