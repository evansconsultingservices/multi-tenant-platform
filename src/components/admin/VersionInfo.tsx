import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VersionService, VersionInfo as VersionInfoType, ChildAppVersion } from '@/services/version.service';
import { Copy, CheckCircle } from 'lucide-react';

export const VersionInfo: React.FC = () => {
  const [parentVersion, setParentVersion] = useState<VersionInfoType | null>(null);
  const [childVersions, setChildVersions] = useState<ChildAppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadVersions = async () => {
      try {
        // Load parent version
        const parent = VersionService.getVersion();
        setParentVersion(parent);

        // Load child app versions
        const children = await VersionService.getAllChildAppVersions();
        setChildVersions(children);
      } catch (error) {
        console.error('Failed to load version information:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, []);

  const handleCopyVersionInfo = () => {
    if (!parentVersion) return;

    let versionText = `Platform Version Information\n\n`;
    versionText += `Parent App (Shell):\n`;
    versionText += `  Version: ${parentVersion.version}\n`;
    versionText += `  Build: ${VersionService.formatBuildTime(parentVersion.buildTimestamp)}\n`;
    versionText += `  Commit: ${parentVersion.gitCommit}\n`;
    versionText += `  Branch: ${parentVersion.gitBranch}\n`;
    versionText += `  Environment: ${parentVersion.environment}\n\n`;

    if (childVersions.length > 0) {
      versionText += `Child Applications:\n`;
      childVersions.forEach((child) => {
        versionText += `\n${child.appName}:\n`;
        versionText += `  Version: ${child.version}\n`;
        versionText += `  Build: ${VersionService.formatBuildTime(child.buildTimestamp)}\n`;
        versionText += `  Commit: ${child.gitCommit}\n`;
        versionText += `  Branch: ${child.gitBranch}\n`;
        versionText += `  Environment: ${child.environment}\n`;
      });
    }

    navigator.clipboard.writeText(versionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version Information</CardTitle>
          <CardDescription>Loading version information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Version Information</CardTitle>
            <CardDescription>
              Build and version details for all platform components
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyVersionInfo}
            disabled={!parentVersion}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Info
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Parent App Version */}
          {parentVersion && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Parent Application (Shell)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Property</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Version</TableCell>
                    <TableCell>{parentVersion.version}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Build Time</TableCell>
                    <TableCell>{VersionService.formatBuildTime(parentVersion.buildTimestamp)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Git Commit</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{parentVersion.gitCommit}</code>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Git Branch</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{parentVersion.gitBranch}</code>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Environment</TableCell>
                    <TableCell>
                      <Badge variant={VersionService.getEnvironmentBadge(parentVersion.environment).variant}>
                        {VersionService.getEnvironmentBadge(parentVersion.environment).label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Build Number</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{parentVersion.buildNumber}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Child App Versions */}
          {childVersions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Child Applications</h3>
              {childVersions.map((child) => (
                <div key={child.appName} className="mb-6 last:mb-0">
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground">{child.appName}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Property</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Version</TableCell>
                        <TableCell>{child.version}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Build Time</TableCell>
                        <TableCell>{VersionService.formatBuildTime(child.buildTimestamp)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Git Commit</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{child.gitCommit}</code>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Git Branch</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{child.gitBranch}</code>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Environment</TableCell>
                        <TableCell>
                          <Badge variant={VersionService.getEnvironmentBadge(child.environment).variant}>
                            {VersionService.getEnvironmentBadge(child.environment).label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Build Number</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{child.buildNumber}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}

          {/* No child versions available */}
          {childVersions.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No child application versions available. Ensure child apps are running and properly configured.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
