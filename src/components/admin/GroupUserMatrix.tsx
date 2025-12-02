import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Loader2 } from 'lucide-react';
import { Company } from '@/types/company.types';
import { UserProfile } from '@/types/user.types';
import { CompanyService } from '@/services/company.service';
import { UserService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GroupUserMatrixProps {
  currentCompanyId: string;
}

export const GroupUserMatrix: React.FC<GroupUserMatrixProps> = ({ currentCompanyId }) => {
  const { user } = useAuth();
  const [groupCompanies, setGroupCompanies] = useState<Company[]>([]);
  const [groupUsers, setGroupUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    companyId: string;
    isRemoving: boolean;
    userName: string;
    companyName: string;
  } | null>(null);
  const [processingCell, setProcessingCell] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companies, users] = await Promise.all([
        CompanyService.getGroupedCompanies(currentCompanyId),
        CompanyService.getGroupUsers(currentCompanyId),
      ]);
      setGroupCompanies(companies);
      setGroupUsers(users);
    } catch (error) {
      console.error('Error loading group data:', error);
      toast.error('Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (
    userId: string,
    companyId: string,
    isChecked: boolean,
    userName: string,
    companyName: string
  ) => {
    const targetUser = groupUsers.find(u => u.id === userId);
    if (!targetUser) return;

    // Prevent removing last company
    if (!isChecked && targetUser.companies.length === 1) {
      toast.error(`${userName} only belongs to this company. They must belong to at least one company. Consider deleting the user instead.`);
      return;
    }

    // Show confirmation dialog for removal
    if (!isChecked) {
      setConfirmDialog({
        open: true,
        userId,
        companyId,
        isRemoving: true,
        userName,
        companyName,
      });
      return;
    }

    // Add user directly (no confirmation needed)
    await performToggle(userId, companyId, true);
  };

  const performToggle = async (userId: string, companyId: string, isAdding: boolean) => {
    if (!user) return;

    const cellKey = `${userId}-${companyId}`;
    setProcessingCell(cellKey);

    try {
      if (isAdding) {
        await UserService.addUserToCompany(userId, companyId, user.id);
        toast.success('User has been added to the company successfully.');
      } else {
        await UserService.removeUserFromCompany(userId, companyId, user.id);
        toast.success('User has been removed from the company successfully.');
      }
      await loadData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isAdding ? 'add' : 'remove'} user.`);
      await loadData(); // Refresh to revert optimistic update
    } finally {
      setProcessingCell(null);
      setConfirmDialog(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!confirmDialog) return;
    await performToggle(confirmDialog.userId, confirmDialog.companyId, false);
  };

  const filteredUsers = groupUsers.filter(user =>
    searchTerm === '' ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading group data...</p>
      </div>
    );
  }

  if (groupCompanies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏢</div>
        <h3 className="text-lg font-semibold mb-2">No Grouped Companies</h3>
        <p className="text-muted-foreground">
          This company is not part of a group yet.
        </p>
      </div>
    );
  }

  if (groupUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-semibold mb-2">No Users in Group</h3>
        <p className="text-muted-foreground">
          Invite users to get started with shared access management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Matrix Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-[250px]">
                User
              </TableHead>
              {groupCompanies.map(company => (
                <TableHead key={company.id} className="text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">{company.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {groupUsers.filter(u => u.companies.includes(company.id)).length} users
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={groupCompanies.length + 1} className="text-center py-8">
                  <p className="text-muted-foreground">No users match your search criteria</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((userProfile) => (
                <TableRow key={userProfile.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile.avatarUrl} />
                        <AvatarFallback>
                          {userProfile.firstName[0]}{userProfile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {userProfile.firstName} {userProfile.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {userProfile.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {groupCompanies.map(company => {
                    const isChecked = userProfile.companies.includes(company.id);
                    const cellKey = `${userProfile.id}-${company.id}`;
                    const isProcessing = processingCell === cellKey;
                    const isActiveCompany = userProfile.companyId === company.id;

                    return (
                      <TableCell key={company.id} className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(
                                  userProfile.id,
                                  company.id,
                                  checked as boolean,
                                  `${userProfile.firstName} ${userProfile.lastName}`,
                                  company.name
                                )
                              }
                              disabled={isProcessing}
                            />
                          )}
                          {isActiveCompany && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove User from Company?</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{confirmDialog.userName}</strong> from{' '}
                <strong>{confirmDialog.companyName}</strong>?
              </DialogDescription>
            </DialogHeader>
            {confirmDialog.userId && (() => {
              const targetUser = groupUsers.find(u => u.id === confirmDialog.userId);
              const isActiveCompany = targetUser?.companyId === confirmDialog.companyId;
              const remainingCompanies = groupCompanies.filter(
                c => c.id !== confirmDialog.companyId && targetUser?.companies.includes(c.id)
              );

              return isActiveCompany && remainingCompanies.length > 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm">
                  <p className="text-amber-900 dark:text-amber-100">
                    This is {confirmDialog.userName}'s active company. They will be automatically
                    switched to <strong>{remainingCompanies[0].name}</strong>.
                  </p>
                </div>
              ) : null;
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmRemove}>
                Remove User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
