import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Company } from '@/types/company.types';
import { Tool } from '@/types/tool.types';
import { ToolService } from '@/services/tool.service';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyToolsTabProps {
  company: Company;
}

interface ToolWithAccess extends Tool {
  hasAccess: boolean;
  accessLevel?: 'read' | 'write' | 'admin';
  grantedAt?: Date;
}

export const CompanyToolsTab: React.FC<CompanyToolsTabProps> = ({ company }) => {
  const { user } = useAuth();
  const [tools, setTools] = useState<ToolWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadTools();
  }, [company.id]);

  const loadTools = async () => {
    try {
      setLoading(true);
      // Get all available tools
      const allTools = await ToolService.getAllTools();

      // Get tools the company has access to
      const companyTools = await ToolService.getCompanyTools(company.id);
      const companyToolIds = new Set(companyTools.map(t => t.id));

      // Merge the data
      const toolsWithAccess: ToolWithAccess[] = allTools.map(tool => ({
        ...tool,
        hasAccess: companyToolIds.has(tool.id),
        accessLevel: companyTools.find(ct => ct.id === tool.id)?.accessLevels?.[0]?.level,
      }));

      setTools(toolsWithAccess);
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (tool: ToolWithAccess) => {
    const userId = (user as any)?.uid || (user as any)?.id;
    if (!userId) return;

    try {
      setUpdating(tool.id);

      if (tool.hasAccess) {
        // Revoke access
        await ToolService.revokeCompanyToolAccess(company.id, tool.id);
      } else {
        // Grant access with default 'read' level
        await ToolService.grantCompanyToolAccess(
          company.id,
          tool.id,
          'read',
          userId
        );
      }

      // Reload tools
      await loadTools();
    } catch (error) {
      console.error('Error toggling tool access:', error);
      alert('Failed to update tool access');
    } finally {
      setUpdating(null);
    }
  };

  const handleChangeAccessLevel = async (tool: ToolWithAccess, newLevel: 'read' | 'write' | 'admin') => {
    const userId = (user as any)?.uid || (user as any)?.id;
    if (!userId || !tool.hasAccess) return;

    try {
      setUpdating(tool.id);

      await ToolService.grantCompanyToolAccess(
        company.id,
        tool.id,
        newLevel,
        userId
      );

      // Reload tools
      await loadTools();
    } catch (error) {
      console.error('Error updating access level:', error);
      alert('Failed to update access level');
    } finally {
      setUpdating(null);
    }
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'maintenance': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tools Access</CardTitle>
            <CardDescription>
              Manage which tools {company.name} has access to. All users in this company will inherit these permissions.
            </CardDescription>
          </div>
          <div className="pt-4">
            <Input
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tools...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🛠️</div>
              <p>No tools found</p>
              <p className="text-sm mt-2">
                {searchTerm ? 'Try adjusting your search criteria' : 'No tools are available yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead className="text-right">Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {tool.icon && (
                          <div className="text-2xl">{tool.icon}</div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">
                            {tool.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tool.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tool.status)}>
                        {tool.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tool.hasAccess ? (
                        <Select
                          value={tool.accessLevel || 'read'}
                          onValueChange={(value: 'read' | 'write' | 'admin') =>
                            handleChangeAccessLevel(tool, value)
                          }
                          disabled={updating === tool.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="write">Write</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={tool.hasAccess}
                        onCheckedChange={() => handleToggleAccess(tool)}
                        disabled={updating === tool.id || tool.status !== 'active'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
