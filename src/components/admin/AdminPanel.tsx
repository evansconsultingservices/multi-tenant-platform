import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();

  // Only admins and super admins can access this panel
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <Outlet />
    </div>
  );
};
