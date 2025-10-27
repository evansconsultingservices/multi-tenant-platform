import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdateToolUrlsButton } from './UpdateToolUrlsButton';
import { FixOrphanedUsersButton } from './FixOrphanedUsersButton';

export const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Platform Settings</h2>
      </div>

      <UpdateToolUrlsButton />

      <FixOrphanedUsersButton />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure platform-wide settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">⚙️</div>
            <p>Settings panel coming soon</p>
            <p className="text-sm mt-2">
              This will include platform configuration, security settings, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
