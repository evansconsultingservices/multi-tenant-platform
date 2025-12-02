import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info, Users } from 'lucide-react';
import { Company } from '@/types/company.types';
import { UserProfile, UserRole } from '@/types/user.types';
import { UserService } from '@/services/user.service';
import { InviteUserDialog } from './InviteUserDialog';
import { EditUserWithToolsDialog } from './EditUserWithToolsDialog';
import { GroupUserMatrix } from './GroupUserMatrix';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CompanyUsersTabProps {
  company: Company;
}

export const CompanyUsersTab: React.FC<CompanyUsersTabProps> = ({ company }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    user: UserProfile | null;
  }>({ open: false, user: null });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const companyUsers = await UserService.getUsersByCompany(company.id);
      setUsers(companyUsers);
    } catch (error) {
      console.error('Error loading company users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    companyId: string;
    department?: string;
  }) => {
    try {
      await UserService.createUser({
        ...userData,
        companies: [userData.companyId], // User belongs to this company
        assignedTools: [],
        theme: 'dark',
        timezone: 'UTC',
        language: 'en',
      });
      await loadUsers();
      setShowInviteDialog(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await UserService.updateUser(userId, updates);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    const userToRemove = users.find(u => u.id === userId);
    if (!userToRemove) return;

    setRemoveDialog({ open: true, user: userToRemove });
  };

  const confirmRemoveUser = async () => {
    if (!removeDialog.user || !currentUser) return;

    const userToRemove = removeDialog.user;
    const userName = `${userToRemove.firstName} ${userToRemove.lastName}`;

    try {
      if (userToRemove.companies.length === 1) {
        // Last company - delete user entirely
        await UserService.deleteUser(userToRemove.id);
        toast.success(`${userName} has been deleted successfully.`);
      } else {
        // Multiple companies - remove from this one
        await UserService.removeUserFromCompany(userToRemove.id, company.id, currentUser.id);
        toast.success(`${userName} has been removed from ${company.name}.`);
      }
      await loadUsers();
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast.error(error.message || 'Failed to remove user');
    } finally {
      setRemoveDialog({ open: false, user: null });
    }
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  // Check if company is part of a group
  const hasGroup = !!company.groupId;

  // If company has a group, show the matrix view
  if (hasGroup) {
    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Grouped Company</AlertTitle>
          <AlertDescription>
            This company is part of the "{company.groupId}" group.
            Users are managed across all companies in the group using the matrix below.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Group User Management
                </CardTitle>
                <CardDescription>
                  Manage user access across all companies in the "{company.groupId}" group
                </CardDescription>
              </div>
              <Button onClick={() => setShowInviteDialog(true)}>
                Invite User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GroupUserMatrix currentCompanyId={company.id} />
          </CardContent>
        </Card>

        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          onInviteUser={handleInviteUser}
          defaultCompanyId={company.id}
        />
      </div>
    );
  }

  // Standard single-company view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage users for {company.name}
              </CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              Invite User
            </Button>
          </div>
          <div className="pt-4">
            <Input
              placeholder="Search users..."
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
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">👥</div>
              <p>No users found</p>
              <p className="text-sm mt-2">
                {searchTerm ? 'Try adjusting your search criteria' : 'Invite your first user to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-foreground">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.department || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditDialog(true);
                        }}
                      >
                        Edit User
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InviteUserDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInviteUser={handleInviteUser}
        defaultCompanyId={company.id}
      />

      <EditUserWithToolsDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={selectedUser}
        onUpdateUser={handleUpdateUser}
        onRemoveUser={handleRemoveUser}
      />

      {/* Remove User Confirmation Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => !open && setRemoveDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {removeDialog.user?.companies.length === 1 ? 'Delete User?' : 'Remove User from Company?'}
            </DialogTitle>
            <DialogDescription>
              {removeDialog.user?.companies.length === 1 ? (
                <>
                  <strong>{removeDialog.user?.firstName} {removeDialog.user?.lastName}</strong> only belongs to{' '}
                  <strong>{company.name}</strong>. Removing them will delete their account entirely.
                  <br /><br />
                  Are you sure you want to continue?
                </>
              ) : (
                <>
                  Remove <strong>{removeDialog.user?.firstName} {removeDialog.user?.lastName}</strong> from{' '}
                  <strong>{company.name}</strong>? They will still have access to their other companies.
                  {removeDialog.user?.companyId === company.id && (
                    <div className="mt-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm">
                      <p className="text-amber-900 dark:text-amber-100">
                        This is {removeDialog.user?.firstName}'s active company. They will be automatically
                        switched to another company they belong to.
                      </p>
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveUser}
            >
              {removeDialog.user?.companies.length === 1 ? 'Delete User' : 'Remove from Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
