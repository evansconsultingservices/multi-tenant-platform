import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyService } from '@/services/company.service';
import { Company } from '@/types/company.types';
import { CompanySettingsTab } from './CompanySettingsTab';
import { CompanyAPIKeysTab } from './CompanyAPIKeysTab';
import { CompanyUsersTab } from './CompanyUsersTab';
import { CompanyToolsTab } from './CompanyToolsTab';
import { CompanyWebhooksTab } from './CompanyWebhooksTab';

export const CompanyDetailsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const companyData = await CompanyService.getCompanyById(companyId);
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading company:', error);
      alert('Failed to load company details');
      navigate('/admin?tab=companies');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (updates: any) => {
    if (!companyId) return;

    try {
      await CompanyService.updateCompany(companyId, updates);
      await loadCompany();
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>Company not found</p>
              <Button
                variant="outline"
                className="mt-4 text-foreground"
                onClick={() => navigate('/admin?tab=companies')}
              >
                Back to Companies
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Simplified Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin?tab=companies')}>
            ← Back to Companies
          </Button>
          <div className="mt-2">
            <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
            <p className="text-muted-foreground">
              {company.slug} • {company.subscription.tier}
            </p>
          </div>
        </div>

        {/* Tabbed Content */}
        <Card className="mt-6">
          <Tabs defaultValue="settings">
            <CardHeader className="pb-3">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
                <TabsTrigger value="users">👥 Users</TabsTrigger>
                <TabsTrigger value="tools">🛠️ Tools</TabsTrigger>
                <TabsTrigger value="api-keys">🔑 API Keys</TabsTrigger>
                <TabsTrigger value="webhooks">🔗 Webhooks</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-0">
              <TabsContent value="settings">
                <CompanySettingsTab
                  company={company}
                  onUpdateCompany={handleUpdateCompany}
                />
              </TabsContent>

              <TabsContent value="users">
                <CompanyUsersTab company={company} />
              </TabsContent>

              <TabsContent value="tools">
                <CompanyToolsTab company={company} />
              </TabsContent>

              <TabsContent value="api-keys">
                <CompanyAPIKeysTab company={company} />
              </TabsContent>

              <TabsContent value="webhooks">
                <CompanyWebhooksTab
                  company={company}
                  onUpdateCompany={handleUpdateCompany}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
