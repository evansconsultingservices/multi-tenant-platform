import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Company, CompanyStatus, UpdateCompanyInput } from '@/types/company.types';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyService } from '@/services/company.service';

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onUpdateCompany: (companyId: string, updates: UpdateCompanyInput) => Promise<void>;
}

export const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({
  open,
  onOpenChange,
  company,
  onUpdateCompany,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupedCompanies, setGroupedCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    website: '',
    phone: '',
    status: CompanyStatus.ACTIVE,
    groupId: '',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        description: company.description || '',
        contactEmail: company.contactEmail,
        website: company.website || '',
        phone: company.phone || '',
        status: company.status,
        groupId: company.groupId || '',
      });

      // Load other companies in the same group
      if (company.groupId) {
        loadGroupedCompanies(company.id);
      } else {
        setGroupedCompanies([]);
      }
    }
  }, [company]);

  const loadGroupedCompanies = async (companyId: string) => {
    try {
      const companies = await CompanyService.getGroupedCompanies(companyId);
      setGroupedCompanies(companies.filter(c => c.id !== companyId));
    } catch (error) {
      console.error('Error loading grouped companies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Company name is required');
      }
      if (!formData.contactEmail.trim()) {
        throw new Error('Contact email is required');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        throw new Error('Please enter a valid email address');
      }

      const updates: UpdateCompanyInput = {
        name: formData.name,
        description: formData.description || undefined,
        contactEmail: formData.contactEmail,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
        status: formData.status,
      };

      // Only super admins can update groupId
      if (user?.role === 'super_admin') {
        (updates as any).groupId = formData.groupId || undefined;
      }

      await onUpdateCompany(company.id, updates);
    } catch (err: any) {
      setError(err.message || 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update company information and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Company Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Slug (cannot be changed)
            </label>
            <Input
              value={company.slug}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Slug cannot be modified after creation
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="contactEmail" className="text-sm font-medium text-foreground">
              Contact Email *
            </label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium text-foreground">
              Website
            </label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://company.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the company"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as CompanyStatus)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={CompanyStatus.ACTIVE}>Active</option>
              <option value={CompanyStatus.INACTIVE}>Inactive</option>
              <option value={CompanyStatus.SUSPENDED}>Suspended</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Inactive or suspended companies cannot access the platform
            </p>
          </div>

          {user?.role === 'super_admin' && (
            <div className="space-y-2">
              <label htmlFor="groupId" className="text-sm font-medium text-foreground">
                Company Group ID (optional)
              </label>
              <Input
                id="groupId"
                value={formData.groupId}
                onChange={(e) => handleChange('groupId', e.target.value)}
                placeholder="e.g., acme-group"
              />
              <p className="text-xs text-muted-foreground">
                Link this company to others in the same group for shared user management.
                Companies with the same Group ID share a user pool.
              </p>

              {formData.groupId && groupedCompanies.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Linked Companies</AlertTitle>
                  <AlertDescription>
                    Other companies in "{formData.groupId}": {groupedCompanies.map(c => c.name).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

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
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
