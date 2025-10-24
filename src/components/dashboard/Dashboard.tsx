import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, ArrowRight } from 'lucide-react';
import { ToolService } from '@/services/tool.service';
import { Tool } from '@/types/tool.types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserTools = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userTools = await ToolService.getUserTools(user.id);
        setTools(userTools);
      } catch (error) {
        console.error('Error loading tools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserTools();
  }, [user]);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome back, {user.firstName}
          </h2>
          <p className="text-lg text-muted-foreground">
            Select a tool to get started
          </p>
        </div>

        {/* Tools Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tools.length === 0 ? (
          <Card className="p-12 text-center bg-card">
            <div className="space-y-3">
              <p className="text-xl font-medium text-foreground">No tools available</p>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Add tools in the admin panel and grant yourself access to get started"
                  : "Contact your administrator to get access to tools"}
              </p>
              {isAdmin && (
                <Link to="/admin" className="inline-block pt-4">
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Card
                key={tool.id}
                className="p-6 h-full transition-all hover:shadow-lg hover:scale-105 bg-card cursor-pointer group"
                onClick={() => navigate(`/tools/${tool.id}`)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                      {tool.icon || '🛠️'}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    {tool.description}
                  </p>
                  {tool.featured && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-xs font-medium text-primary">Featured</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
