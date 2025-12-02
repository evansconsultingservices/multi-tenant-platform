import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Company, CompanyStatus, UpdateCompanyInput } from '@/types/company.types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyService } from '@/services/company.service';
import { GroupService } from '@/services/group.service';
import { CompanyGroup } from '@/types/group.types';

interface CompanySettingsTabProps {
  company: Company;
  onUpdateCompany: (updates: UpdateCompanyInput) => Promise<void>;
}

export const CompanySettingsTab: React.FC<CompanySettingsTabProps> = ({
  company,
  onUpdateCompany,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupedCompanies, setGroupedCompanies] = useState<Company[]>([]);
  const [availableGroups, setAvailableGroups] = useState<CompanyGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
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
    setFormData({
      name: company.name,
      description: company.description || '',
      contactEmail: company.contactEmail,
      website: company.website || '',
      phone: company.phone || '',
      status: company.status,
      groupId: company.groupId || '',
    });

    // Load available groups if super admin
    if (user?.role === 'super_admin') {
      loadAvailableGroups();
    }

    // Load other companies in the same group
    if (company.groupId) {
      loadGroupedCompanies(company.id);
    } else {
      setGroupedCompanies([]);
    }
  }, [company, user]);

  const loadAvailableGroups = async () => {
    try {
      setLoadingGroups(true);
      const groups = await GroupService.getAllGroups();
      setAvailableGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

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
        contactEmail: formData.contactEmail,
        status: formData.status,
      };

      // Only include optional fields if they have values
      if (formData.description) {
        updates.description = formData.description;
      }
      if (formData.website) {
        updates.website = formData.website;
      }
      if (formData.phone) {
        updates.phone = formData.phone;
      }

      // Only super admins can update groupId
      if (user?.role === 'super_admin') {
        if (formData.groupId) {
          (updates as any).groupId = formData.groupId;
        } else {
          // Explicitly set to null to clear the groupId
          (updates as any).groupId = null;
        }
      }

      await onUpdateCompany(updates);

      alert('Company settings updated successfully');
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company's basic information and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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

              <div className="space-y-2 md:col-span-2">
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

              <div className="space-y-2 md:col-span-2">
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

              {user?.role === 'super_admin' && (
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="groupId" className="text-sm font-medium text-foreground">
                    Company Group (optional)
                  </label>
                  <Select
                    value={formData.groupId === '' ? 'none' : formData.groupId}
                    onValueChange={(value) => handleChange('groupId', value === 'none' ? '' : value)}
                    disabled={loadingGroups}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select a group..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Group</SelectItem>
                      {/* If current groupId exists but is not in the groups list, show it for backwards compatibility */}
                      {formData.groupId && !availableGroups.find(g => g.groupId === formData.groupId) && (
                        <SelectItem value={formData.groupId}>
                          {formData.groupId} (Group Not Found - May Need to Create)
                        </SelectItem>
                      )}
                      {availableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.groupId}>
                          {group.name} ({group.groupId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link this company to a group for shared user management.
                    Companies in the same group share a user pool.
                  </p>

                  {formData.groupId && groupedCompanies.length > 0 && (
                    <Alert className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Linked Companies</AlertTitle>
                      <AlertDescription>
                        Other companies in this group: {groupedCompanies.map(c => c.name).join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {formData.groupId && !availableGroups.find(g => g.groupId === formData.groupId) && (
                    <Alert className="mt-2" variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        Group ID "{formData.groupId}" does not match any existing group.
                        Consider creating this group or selecting an existing one.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

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
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Current subscription plan and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Plan</p>
                <p className="text-sm text-muted-foreground">
                  {company.subscription.tier}
                </p>
              </div>
              <Badge>
                {company.subscription.tier}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Max Users</p>
                <p className="text-2xl font-bold text-foreground">
                  {company.settings.maxUsers}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Max Storage</p>
                <p className="text-2xl font-bold text-foreground">
                  {company.settings.maxStorageGB} GB
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Features</p>
                <p className="text-sm text-muted-foreground">
                  {company.settings.featuresEnabled.length} enabled
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
