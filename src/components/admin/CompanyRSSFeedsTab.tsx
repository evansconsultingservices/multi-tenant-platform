import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Company, RSSFeed } from '@/types/company.types';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, X, Check } from 'lucide-react';

interface CompanyRSSFeedsTabProps {
  company: Company;
  onUpdateCompany: (updates: { rssFeeds: RSSFeed[] }) => Promise<void>;
}

const MAX_FEEDS = 6;

export const CompanyRSSFeedsTab: React.FC<CompanyRSSFeedsTabProps> = ({
  company,
  onUpdateCompany,
}) => {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    url: '',
    label: '',
  });

  useEffect(() => {
    setFeeds(company.rssFeeds || []);
  }, [company]);

  /**
   * SECURITY: Validate RSS feed URL to prevent SSRF attacks
   * Blocks: private IPs, localhost, cloud metadata endpoints, non-HTTP protocols
   */
  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);

      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        console.warn('SECURITY: Blocked non-HTTP(S) protocol:', parsed.protocol);
        return false;
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block localhost variants
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.warn('SECURITY: Blocked localhost access');
        return false;
      }

      // Block cloud metadata endpoint (AWS/GCP/Azure)
      if (hostname === '169.254.169.254') {
        console.warn('SECURITY: Blocked cloud metadata endpoint access');
        return false;
      }

      // Block private IP ranges (RFC 1918)
      const privateIpPatterns = [
        /^127\./,           // Loopback (127.0.0.0/8)
        /^10\./,            // Private class A (10.0.0.0/8)
        /^192\.168\./,      // Private class C (192.168.0.0/16)
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B (172.16.0.0/12)
        /^169\.254\./,      // Link-local (169.254.0.0/16)
        /^0\./,             // Reserved (0.0.0.0/8)
      ];

      for (const pattern of privateIpPatterns) {
        if (pattern.test(hostname)) {
          console.warn('SECURITY: Blocked private IP address:', hostname);
          return false;
        }
      }

      // Block raw IP addresses (require domain names for better traceability)
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        console.warn('SECURITY: Blocked raw IP address. Please use a domain name.');
        return false;
      }

      // Require fully qualified domain name
      if (!hostname.includes('.')) {
        console.warn('SECURITY: Hostname must be a fully qualified domain name');
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async (feed: RSSFeed) => {
    if (!feed.url.trim() || !feed.label.trim()) {
      setError('URL and Label are required');
      return;
    }

    if (!validateUrl(feed.url)) {
      setError('Invalid RSS feed URL. Only public HTTP/HTTPS URLs with domain names are allowed. Private IPs, localhost, and cloud metadata endpoints are blocked for security.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updatedFeeds = feeds.map(f => f.id === feed.id ? feed : f);
      await onUpdateCompany({ rssFeeds: updatedFeeds });
      setFeeds(updatedFeeds);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update feed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.url.trim() || !formData.label.trim()) {
      setError('URL and Label are required');
      return;
    }

    if (!validateUrl(formData.url)) {
      setError('Invalid RSS feed URL. Only public HTTP/HTTPS URLs with domain names are allowed. Private IPs, localhost, and cloud metadata endpoints are blocked for security.');
      return;
    }

    if (feeds.length >= MAX_FEEDS) {
      setError(`Maximum ${MAX_FEEDS} RSS feeds allowed`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const newFeed: RSSFeed = {
        id: `feed-${Date.now()}`,
        url: formData.url.trim(),
        label: formData.label.trim(),
        enabled: true,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user', // Will be set by backend
      };

      const updatedFeeds = [...feeds, newFeed];
      await onUpdateCompany({ rssFeeds: updatedFeeds });
      setFeeds(updatedFeeds);
      setFormData({ url: '', label: '' });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add feed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedId: string) => {
    if (!window.confirm('Are you sure you want to delete this RSS feed?')) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updatedFeeds = feeds.filter(f => f.id !== feedId);
      await onUpdateCompany({ rssFeeds: updatedFeeds });
      setFeeds(updatedFeeds);
    } catch (err: any) {
      setError(err.message || 'Failed to delete feed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (feed: RSSFeed) => {
    // Only confirm when disabling a feed
    if (feed.enabled && !window.confirm(`Are you sure you want to disable "${feed.label}"? Articles from this feed will no longer be fetched.`)) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updatedFeeds = feeds.map(f =>
        f.id === feed.id ? { ...f, enabled: !f.enabled } : f
      );
      await onUpdateCompany({ rssFeeds: updatedFeeds });
      setFeeds(updatedFeeds);
    } catch (err: any) {
      setError(err.message || 'Failed to update feed');
    } finally {
      setLoading(false);
    }
  };

  const FeedRow: React.FC<{ feed: RSSFeed }> = ({ feed }) => {
    const [editData, setEditData] = useState({ url: feed.url, label: feed.label });
    const isEditing = editingId === feed.id;

    if (isEditing) {
      return (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
          <div className="space-y-2">
            <label className="text-sm font-medium">Feed Label</label>
            <Input
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              placeholder="e.g., MDJ Online - Local News"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Feed URL</label>
            <Input
              value={editData.url}
              onChange={(e) => setEditData({ ...editData, url: e.target.value })}
              placeholder="https://example.com/rss"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleSave({ ...feed, ...editData })}
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingId(null)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground">{feed.label}</h4>
            <Badge variant={feed.enabled ? 'default' : 'secondary'}>
              {feed.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{feed.url}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleEnabled(feed)}
            disabled={loading}
          >
            {feed.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingId(feed.id);
              setError(null);
            }}
            disabled={loading}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(feed.id)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>RSS Feeds</CardTitle>
              <CardDescription>
                Configure RSS feeds for the Podcast Manager to fetch articles
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setShowAddForm(true);
                setError(null);
              }}
              disabled={feeds.length >= MAX_FEEDS || showAddForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Add Feed Form */}
          {showAddForm && (
            <div className="border-2 border-primary rounded-lg p-4 space-y-3 bg-primary/5">
              <h4 className="font-medium text-foreground">Add New RSS Feed</h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">Feed Label *</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., MDJ Online - Local News"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Feed URL *</label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/rss"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAdd}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Add Feed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ url: '', label: '' });
                    setError(null);
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Feeds List */}
          {feeds.length === 0 && !showAddForm && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No RSS feeds configured</p>
              <p className="text-sm">Click "Add Feed" to get started</p>
            </div>
          )}

          {feeds.length > 0 && (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <FeedRow key={feed.id} feed={feed} />
              ))}
            </div>
          )}

          {/* Feed Count Info */}
          {feeds.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {feeds.length} of {MAX_FEEDS} feeds configured
              </p>
              <p className="text-sm text-muted-foreground">
                {feeds.filter(f => f.enabled).length} enabled
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RSS Feed Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">How it works:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>RSS feeds are fetched automatically by the Podcast Manager</li>
              <li>Articles from enabled feeds will appear in the Dashboard</li>
              <li>You can enable/disable feeds without deleting them</li>
              <li>Up to {MAX_FEEDS} feeds can be configured per company</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Best practices:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use descriptive labels to identify your feeds</li>
              <li>Ensure RSS feed URLs are publicly accessible</li>
              <li>Disable feeds you're not currently using to improve performance</li>
              <li>Test new feeds in the Podcast Manager Dashboard after adding</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
