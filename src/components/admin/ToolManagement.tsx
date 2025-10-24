import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToolService } from '@/services/tool.service';
import { Tool } from '@/types/tool.types';
import { useAuth } from '@/contexts/AuthContext';
import { CreateToolDialog } from './CreateToolDialog';
import { EditToolDialog } from './EditToolDialog';

export const ToolManagement: React.FC = () => {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const toolsList = await ToolService.getAllTools();
      setTools(toolsList);
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTool = async (toolData: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      await ToolService.createTool(toolData, user.id);
      await loadTools();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating tool:', error);
    }
  };

  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool);
    setShowEditDialog(true);
  };

  const handleUpdateTool = async (toolId: string, updates: Partial<Tool>) => {
    try {
      await ToolService.updateTool(toolId, updates);
      await loadTools();
    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!window.confirm('Are you sure you want to delete this tool? This will remove access for all users.')) {
      return;
    }

    try {
      await ToolService.deleteTool(toolId);
      await loadTools();
    } catch (error) {
      console.error('Error deleting tool:', error);
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
      case 'inactive': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Tool Management</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tools...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tool Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage and configure tools available on the platform
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          Add New Tool
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Tools</CardTitle>
          <CardDescription>
            Configure tools, manage access, and monitor usage
          </CardDescription>
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
          {filteredTools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🛠️</div>
              <p>No tools found</p>
              <p className="text-sm mt-2">
                {searchTerm ? 'Try adjusting your search criteria' : 'Add your first tool to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {tool.icon && <span>{tool.icon}</span>}
                          {tool.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tool.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tool.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tool.status)}>
                        {tool.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {tool.url}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tool.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEditTool(tool)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTool(tool.id)}
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

      <CreateToolDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTool={handleCreateTool}
      />

      <EditToolDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        tool={selectedTool}
        onUpdateTool={handleUpdateTool}
      />
    </div>
  );
};