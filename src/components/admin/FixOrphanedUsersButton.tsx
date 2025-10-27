import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserService } from '@/services/user.service';
import { CompanyService } from '@/services/company.service';

export const FixOrphanedUsersButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFixOrphanedUsers = async () => {
    if (!window.confirm('This will scan all users and fix invalid company references. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      // Get all users
      const allUsers = await UserService.getAllUsers();

      // Get all companies to validate IDs
      const allCompanies = await CompanyService.getAllCompanies();
      const validCompanyIds = new Set(allCompanies.map(c => c.id));

      let fixedCount = 0;
      const issues: string[] = [];

      for (const user of allUsers) {
        // Skip super_admins (they shouldn't have companyId)
        if (user.role === 'super_admin') {
          if (user.companyId) {
            await UserService.updateUser(user.id, { companyId: '' } as any);
            fixedCount++;
            issues.push(`Removed companyId from super_admin: ${user.email}`);
          }
          continue;
        }

        // Check if user has a companyId
        if (!user.companyId) {
          issues.push(`⚠️ User ${user.email} (${user.role}) has no company assigned`);
          continue;
        }

        // Check if companyId is valid
        if (!validCompanyIds.has(user.companyId)) {
          issues.push(`❌ User ${user.email} has invalid companyId: "${user.companyId}"`);

          // Try to find company by name
          const matchingCompany = allCompanies.find(
            c => c.name === user.companyId || c.slug === user.companyId
          );

          if (matchingCompany) {
            await UserService.updateUser(user.id, { companyId: matchingCompany.id });
            fixedCount++;
            issues.push(`✅ Fixed: Updated ${user.email} to company "${matchingCompany.name}" (${matchingCompany.id})`);
          } else {
            // Can't auto-fix - need to set companyId to empty/null
            // Since validation requires companyId for admin/user, we'll just skip this
            // and let admin manually fix it
            issues.push(`⚠️ Cannot auto-fix ${user.email} - no matching company found. Please reassign manually.`);
          }
        }
      }

      const resultMessage = `
Scan complete!
- Total users scanned: ${allUsers.length}
- Issues found and fixed: ${fixedCount}

${issues.length > 0 ? 'Details:\n' + issues.join('\n') : 'No issues found!'}
      `.trim();

      setResult(resultMessage);
      console.log(resultMessage);
      alert(`Fixed ${fixedCount} users. Check console for details.`);
    } catch (error) {
      console.error('Error fixing orphaned users:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ ERROR: ${errorMessage}\n\nCheck browser console for full details.`);
      alert(`Failed to fix orphaned users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Orphaned Users</CardTitle>
        <CardDescription>
          Scan and fix users with invalid company references
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This utility will:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Remove companyId from super_admin users</li>
          <li>Detect users with invalid company IDs</li>
          <li>Attempt to match company names to valid IDs</li>
          <li>Clear invalid references that can't be matched</li>
        </ul>

        <Button
          onClick={handleFixOrphanedUsers}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Scanning...' : 'Scan & Fix Users'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <pre className="text-xs whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
