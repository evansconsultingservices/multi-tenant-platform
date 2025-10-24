import { useEffect, useState } from 'react';
import { ToolService } from '@/services/tool.service';
import { useAuth } from '@/contexts/AuthContext';
import { Tool } from '@/types/tool.types';

export const InitializeHelloWorldTool: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'adding' | 'success' | 'error' | 'exists'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const addHelloWorldTool = async () => {
      if (!user) {
        setStatus('error');
        setMessage('No user logged in');
        return;
      }

      try {
        setStatus('adding');
        setMessage('Checking if Hello World Tool already exists...');

        // Check if tool already exists (handle error if tools collection doesn't exist yet)
        let helloWorldExists = false;
        try {
          const existingTools = await ToolService.getAllTools();
          helloWorldExists = existingTools.some(tool =>
            tool.name === 'Hello World Tool' || tool.url === 'http://localhost:3001'
          );
        } catch (fetchError) {
          // Tools collection might not exist yet - that's okay, we'll create it
          console.log('Tools collection not found, will create first tool');
        }

        if (helloWorldExists) {
          setStatus('exists');
          setMessage('Hello World Tool already exists in the database');
          return;
        }

        setMessage('Adding Hello World Tool...');

        const toolData: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'> = {
          name: 'Hello World Tool',
          description: 'A simple demonstration tool that displays a hello world message using Module Federation',
          icon: '👋',
          url: 'http://localhost:3001',
          status: 'active',
          category: 'Demo Tools',
          version: '1.0.0',
          createdBy: user.id,

          // Access configuration
          accessLevels: [
            {
              level: 'read',
              description: 'View-only access to the tool',
              permissions: ['view'],
            },
            {
              level: 'write',
              description: 'Standard usage permissions',
              permissions: ['view', 'use', 'edit'],
            },
            {
              level: 'admin',
              description: 'Full administrative control',
              permissions: ['view', 'use', 'edit', 'delete', 'configure'],
            },
          ],
          requiredRole: 'user',
          isPublic: false, // Not used - all access controlled via Access Control panel

          // Technical details
          subdomain: 'hello-world',
          port: 3001,
          healthCheckUrl: 'http://localhost:3001',

          // UI configuration
          displayOrder: 0,
          featured: true,
          tags: ['demo', 'starter', 'module-federation'],
        };

        const toolId = await ToolService.createTool(toolData, user.id);

        setStatus('success');
        setMessage(`✅ Hello World Tool added successfully! Tool ID: ${toolId}`);

      } catch (error: any) {
        setStatus('error');
        setMessage(`❌ Error: ${error.message}`);
        console.error('Error adding Hello World Tool:', error);
      }
    };

    addHelloWorldTool();
  }, [user]);

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-semibold mb-2">Initialize Hello World Tool</h3>
      <p className="text-sm">
        Status: <span className={`font-medium ${
          status === 'success' ? 'text-green-600 dark:text-green-400' :
          status === 'error' ? 'text-red-600 dark:text-red-400' :
          status === 'exists' ? 'text-yellow-600 dark:text-yellow-400' :
          'text-blue-600 dark:text-blue-400'
        }`}>{status}</span>
      </p>
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
};
