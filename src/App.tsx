import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { CompanyManagement } from '@/components/admin/CompanyManagement';
import { ToolManagement } from '@/components/admin/ToolManagement';
import { CompanyDetailsPage } from '@/components/admin/CompanyDetailsPage';
import { AppShell } from '@/components/layout/AppShell';
import { ToolPage } from '@/components/tools/ToolFrame';
import { NotFound } from '@/components/common/NotFound';

function App() {
  return (
    <div className="dark">
      <Router>
        <AuthProvider>
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
              <Route path="tools/:toolId" element={<ToolPage />} />

              {/* Admin routes with nested children */}
              <Route path="admin" element={<AdminPanel />}>
                <Route index element={<Navigate to="companies" replace />} />
                <Route path="companies" element={<CompanyManagement />} />
                <Route path="tools" element={<ToolManagement />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Company details page */}
              <Route path="admin/company/:companyId" element={<CompanyDetailsPage />} />

              {/* 404 catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;