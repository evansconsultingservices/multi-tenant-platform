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
import { SubscriptionTier } from '@/types/company.types';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCompany: (data: {
    name: string;
    slug?: string;
    description?: string;
    contactEmail: string;
    website?: string;
    subscriptionTier?: SubscriptionTier;
  }) => Promise<void>;
}

export const CreateCompanyDialog: React.FC<CreateCompanyDialogProps> = ({
  open,
  onOpenChange,
  onCreateCompany,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    contactEmail: '',
    website: '',
    subscriptionTier: SubscriptionTier.FREE,
  });

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

      await onCreateCompany({
        ...formData,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        website: formData.website || undefined,
      });

      // Reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        contactEmail: '',
        website: '',
        subscriptionTier: SubscriptionTier.FREE,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Add a new company to the platform. A unique slug will be generated automatically if not provided.
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
              placeholder="Acme Corporation"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium text-foreground">
              Slug (URL-friendly identifier)
            </label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="acme-corp (auto-generated if empty)"
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs and database identifiers. Leave empty to auto-generate.
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
              placeholder="admin@acme.com"
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
              placeholder="https://acme.com"
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
            <label htmlFor="subscriptionTier" className="text-sm font-medium text-foreground">
              Subscription Tier
            </label>
            <select
              id="subscriptionTier"
              value={formData.subscriptionTier}
              onChange={(e) => handleChange('subscriptionTier', e.target.value as SubscriptionTier)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={SubscriptionTier.FREE}>Free (5 users, 5GB)</option>
              <option value={SubscriptionTier.PRO}>Pro (50 users, 100GB)</option>
              <option value={SubscriptionTier.ENTERPRISE}>Enterprise (1000 users, 1TB)</option>
            </select>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
