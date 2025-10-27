import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CompanyService } from '@/services/company.service';
import { Company, CompanyStatus } from '@/types/company.types';
import { CreateCompanyDialog } from './CreateCompanyDialog';
import { useAuth } from '@/contexts/AuthContext';

export const CompanyManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const companiesList = await CompanyService.getAllCompanies();
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (data: {
    name: string;
    slug?: string;
    description?: string;
    contactEmail: string;
    website?: string;
    subscriptionTier?: any;
  }) => {
    try {
      if (!user) throw new Error('User not authenticated');

      await CompanyService.createCompany(data, user.id);
      await loadCompanies();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  };

  const handleEditCompany = (companyId: string) => {
    navigate(`/admin/company/${companyId}`);
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      if (company.status === CompanyStatus.ACTIVE) {
        await CompanyService.disableCompany(company.id);
      } else {
        await CompanyService.enableCompany(company.id);
      }
      await loadCompanies();
    } catch (error) {
      console.error('Error toggling company status:', error);
      alert('Failed to update company status');
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await CompanyService.deleteCompany(companyId);
      await loadCompanies();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      alert(error.message || 'Failed to delete company');
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: CompanyStatus) => {
    switch (status) {
      case CompanyStatus.ACTIVE:
        return 'default';
      case CompanyStatus.INACTIVE:
        return 'secondary';
      case CompanyStatus.SUSPENDED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'default';
      case 'pro':
        return 'secondary';
      case 'free':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading companies...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Companies</CardTitle>
              <CardDescription>
                View and manage all companies on the platform
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              Add Company
            </Button>
          </div>
          <div className="pt-4">
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🏢</div>
              <p>No companies found</p>
              <p className="text-sm mt-2">
                {searchTerm ? 'Try adjusting your search criteria' : 'Create your first company to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {company.slug}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {company.contactEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(company.status)}>
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTierBadgeVariant(company.subscription.tier)}>
                        {company.subscription.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {company.userCount || 0} users
                    </TableCell>
                    <TableCell className="text-sm">
                      {company.toolsCount || 0} tools
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCompany(company.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(company)}
                        >
                          {company.status === CompanyStatus.ACTIVE ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCompany={handleCreateCompany}
      />
    </>
  );
};
