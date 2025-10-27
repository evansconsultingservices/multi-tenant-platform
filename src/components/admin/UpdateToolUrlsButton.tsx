import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { updateToolUrls } from '@/scripts/update-tool-urls';

export const UpdateToolUrlsButton: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ updated: number; skipped: number } | null>(null);

  const handleUpdate = async () => {
    try {
      setStatus('updating');
      setMessage('Updating tool URLs in database...');

      const result = await updateToolUrls();

      setStatus('success');
      setMessage('✅ Tool URLs updated successfully!');
      setResult(result);
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
      console.error('Error updating tool URLs:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Update Tool URLs</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will update all tools with localhost URLs to use production Vercel URLs.
          Run this once after deploying to production.
        </p>

        <Button
          onClick={handleUpdate}
          disabled={status === 'updating'}
          variant={status === 'success' ? 'outline' : 'default'}
        >
          {status === 'updating' ? 'Updating...' : status === 'success' ? 'Update Again' : 'Update Tool URLs'}
        </Button>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            status === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
            status === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          }`}>
            {message}
            {result && (
              <div className="mt-2">
                <div>Updated: {result.updated} tools</div>
                <div>Skipped: {result.skipped} tools (already correct)</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
