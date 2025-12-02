import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { CompanyManagement } from '@/components/admin/CompanyManagement';
import { ToolManagement } from '@/components/admin/ToolManagement';
import { CompanyDetailsPage } from '@/components/admin/CompanyDetailsPage';
import { GroupManagement } from '@/components/admin/GroupManagement';
import { AppShell } from '@/components/layout/AppShell';
import { ToolPage } from '@/components/tools/ToolFrame';
import { NotFound } from '@/components/common/NotFound';
import { Toaster } from '@/components/ui/sonner';

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Apply theme to parent app wrapper
  React.useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.classList.remove('light', 'dark');
      wrapperRef.current.classList.add(theme);
    }
  }, [theme]);

  return (
    <div ref={wrapperRef} className="parent-app-scope min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tools/:toolId/*" element={<ToolPage />} />

          {/* Admin routes with nested children */}
          <Route path="admin" element={<AdminPanel />}>
            <Route index element={<Navigate to="companies" replace />} />
            <Route path="companies" element={<CompanyManagement />} />
            <Route path="groups" element={<GroupManagement />} />
            <Route path="tools" element={<ToolManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Company details page */}
          <Route path="admin/company/:companyId" element={<CompanyDetailsPage />} />

          {/* 404 catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;