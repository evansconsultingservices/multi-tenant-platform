import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Company } from '@/types/company.types';
import { Check, AlertCircle } from 'lucide-react';

interface CompanyWebhooksTabProps {
  company: Company;
  onUpdateCompany: (updates: any) => Promise<void>;
}

export const CompanyWebhooksTab: React.FC<CompanyWebhooksTabProps> = ({
  company,
  onUpdateCompany
}) => {
  const [scriptBuilderUrl, setScriptBuilderUrl] = useState('');
  const [automationApiKey, setAutomationApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current values when component mounts or company changes
  useEffect(() => {
    setScriptBuilderUrl(company.settings?.pipedreamWebhooks?.scriptBuilderUrl || '');
    setAutomationApiKey(company.automationApiKey || '');
  }, [company]);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    setError(null);
    setShowSuccess(false);

    // Validate Script Builder URL
    if (scriptBuilderUrl && !validateUrl(scriptBuilderUrl)) {
      setError('Please enter a valid URL for the Script Builder webhook');
      return;
    }

    try {
      setSaving(true);

      const updates: any = {
        automationApiKey: automationApiKey || null,
        settings: {
          ...company.settings,
          pipedreamWebhooks: {
            scriptBuilderUrl: scriptBuilderUrl || null,
          },
        },
      };

      await onUpdateCompany(updates);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving webhooks:', err);
      setError(err instanceof Error ? err.message : 'Failed to save webhook configuration');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const currentScriptUrl = company.settings?.pipedreamWebhooks?.scriptBuilderUrl || '';
    const currentApiKey = company.automationApiKey || '';

    return scriptBuilderUrl !== currentScriptUrl || automationApiKey !== currentApiKey;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure webhook URLs for Pipedream automation workflows. These webhooks are triggered
            automatically when creating episodes from articles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          {showSuccess && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Webhook configuration saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Script Builder URL Field */}
          <div className="space-y-2">
            <Label htmlFor="scriptBuilderUrl">
              Script Builder URL
            </Label>
            <Input
              id="scriptBuilderUrl"
              type="url"
              placeholder="https://your-pipedream-workflow.m.pipedream.net"
              value={scriptBuilderUrl}
              onChange={(e) => setScriptBuilderUrl(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Webhook URL for the script generation workflow. Leave empty to disable automatic script generation.
            </p>
          </div>

          {/* Automation API Key Field */}
          <div className="space-y-2">
            <Label htmlFor="automationApiKey">
              Automation API Key
            </Label>
            <Input
              id="automationApiKey"
              type="password"
              placeholder="sk_live_..."
              value={automationApiKey}
              onChange={(e) => setAutomationApiKey(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Bearer token used for outbound automation calls to Pipedream workflows.
              This key is sent in the Authorization header.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {hasChanges() && (
              <Button
                variant="outline"
                onClick={() => {
                  setScriptBuilderUrl(company.settings?.pipedreamWebhooks?.scriptBuilderUrl || '');
                  setAutomationApiKey(company.automationApiKey || '');
                  setError(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              How It Works
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>When an article is converted to an episode, a POST request is sent to the Script Builder URL</li>
              <li>The request includes article data (title, content, author, etc.)</li>
              <li>The Automation API Key is included as a Bearer token in the Authorization header</li>
              <li>Episodes with webhook configured start with status='processing' instead of 'draft'</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
