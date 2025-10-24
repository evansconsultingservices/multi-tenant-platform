import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Company, CompanyStatus, UpdateCompanyInput } from '@/types/company.types';
import { Badge } from '@/components/ui/badge';

interface CompanySettingsTabProps {
  company: Company;
  onUpdateCompany: (updates: UpdateCompanyInput) => Promise<void>;
}

export const CompanySettingsTab: React.FC<CompanySettingsTabProps> = ({
  company,
  onUpdateCompany,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    website: '',
    phone: '',
    status: CompanyStatus.ACTIVE,
  });

  useEffect(() => {
    setFormData({
      name: company.name,
      description: company.description || '',
      contactEmail: company.contactEmail,
      website: company.website || '',
      phone: company.phone || '',
      status: company.status,
    });
  }, [company]);

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

      await onUpdateCompany({
        name: formData.name,
        description: formData.description || undefined,
        contactEmail: formData.contactEmail,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
        status: formData.status,
      });

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
