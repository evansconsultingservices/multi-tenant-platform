import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowLeft } from 'lucide-react';
import { CompanyService } from '@/services/company.service';
import { Company } from '@/types/company.types';
import { CompanySettingsTab } from './CompanySettingsTab';
import { CompanyAPIKeysTab } from './CompanyAPIKeysTab';
import { CompanyUsersTab } from './CompanyUsersTab';
import { CompanyToolsTab } from './CompanyToolsTab';

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
        {/* Header */}
        <div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin?tab=companies')}
              className="gap-2 text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
              <p className="text-muted-foreground">
                {company.slug} • {company.subscription.tier}
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <Breadcrumb className="mt-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin?tab=companies">Companies</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{company.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Tabbed Content */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="settings" className="flex">
              <div className="p-6">
                <TabsList className="flex flex-col h-fit w-48 bg-card gap-4">
                  <TabsTrigger value="settings" className="w-full justify-start">⚙️ Settings</TabsTrigger>
                  <TabsTrigger value="users" className="w-full justify-start">👥 Users</TabsTrigger>
                  <TabsTrigger value="tools" className="w-full justify-start">🛠️ Tools</TabsTrigger>
                  <TabsTrigger value="api-keys" className="w-full justify-start">🔑 API Keys</TabsTrigger>
                </TabsList>
              </div>

              <Separator orientation="vertical" className="h-auto" />

              <div className="flex-1 p-6">
                <TabsContent value="settings" className="mt-0">
                  <CompanySettingsTab
                    company={company}
                    onUpdateCompany={handleUpdateCompany}
                  />
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  <CompanyUsersTab company={company} />
                </TabsContent>

                <TabsContent value="tools" className="mt-0">
                  <CompanyToolsTab company={company} />
                </TabsContent>

                <TabsContent value="api-keys" className="mt-0">
                  <CompanyAPIKeysTab company={company} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
