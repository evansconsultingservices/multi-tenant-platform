import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GroupService } from '@/services/group.service';
import { CompanyGroup } from '@/types/group.types';
import { CreateGroupDialog } from './CreateGroupDialog';
import { EditGroupDialog } from './EditGroupDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const GroupManagement: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CompanyGroup | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const groupsList = await GroupService.getAllGroups();
      setGroups(groupsList);
    } catch (error: any) {
      console.error('Error loading groups:', error);
      toast.error(error.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (data: {
    groupId: string;
    name: string;
    description?: string;
  }) => {
    try {
      if (!user) throw new Error('User not authenticated');

      await GroupService.createGroup(data, user.id);
      await loadGroups();
      setShowCreateDialog(false);
      toast.success('Group created successfully');
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group');
      throw error;
    }
  };

  const handleUpdateGroup = async (
    groupId: string,
    updates: { name?: string; description?: string }
  ) => {
    try {
      if (!user) throw new Error('User not authenticated');

      await GroupService.updateGroup(groupId, updates, user.id);
      await loadGroups();
      setEditingGroup(null);
      toast.success('Group updated successfully');
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error(error.message || 'Failed to update group');
      throw error;
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${groupName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      if (!user) throw new Error('User not authenticated');

      await GroupService.deleteGroup(groupId, user.id);
      await loadGroups();
      toast.success('Group deleted successfully');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.groupId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading groups...</p>
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
              <CardTitle>Company Groups</CardTitle>
              <CardDescription>
                Manage company groups for organizing related companies
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>Add Group</Button>
          </div>
          <div className="pt-4">
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">📁</div>
              <p>No groups found</p>
              <p className="text-sm mt-2">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Create your first group to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Group ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="font-medium">{group.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.groupId}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {group.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{group.companyCount || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {group.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingGroup(group)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          disabled={!!group.companyCount && group.companyCount > 0}
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

      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateGroup={handleCreateGroup}
      />

      {editingGroup && (
        <EditGroupDialog
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          group={editingGroup}
          onUpdateGroup={handleUpdateGroup}
        />
      )}
    </>
  );
};
