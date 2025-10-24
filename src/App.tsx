import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { CompanyDetailsPage } from '@/components/admin/CompanyDetailsPage';
import { AppShell } from '@/components/layout/AppShell';
import { ToolPage } from '@/components/tools/ToolFrame';

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
              <Route path="admin" element={<AdminPanel />} />
              <Route path="admin/company/:companyId" element={<CompanyDetailsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;