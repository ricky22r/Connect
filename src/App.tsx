import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import FieldBoyDashboard from './pages/FieldBoy/FieldBoyDashboard';
import EmployeeManagement from './pages/Admin/EmployeeManagement';
import LeadManagement from './pages/Admin/LeadManagement';
import FakeCallsPanel from './pages/Admin/FakeCallsPanel';
import ReportsPage from './pages/Admin/ReportsPage';
import BackupPage from './pages/Admin/BackupPage';
import DashboardLayout from './components/layout/DashboardLayout';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import EmployeeLeadsPage from './pages/Employee/EmployeeLeadsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ExpensesPage from './pages/Admin/ExpensesPage';
import MyConveyancePage from './pages/FieldBoy/MyConveyancePage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-slate-600">Loading...</p></div></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RoleRedirect = () => {
  const { profile, user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-slate-600">Loading...</p></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;

  switch (profile.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'field_boy':
      return <Navigate to="/field-boy" replace />;
    case 'employee':
      return <Navigate to="/employee" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Login Route - NOT protected */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Root redirect - checks user role and redirects */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="leads" element={<LeadManagement />} />
              <Route path="fake-calls" element={<FakeCallsPanel />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="backup" element={<BackupPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
            </Route>

            {/* Employee Routes */}
            <Route path="/employee" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<EmployeeDashboard />} />
              <Route path="leads" element={<EmployeeLeadsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
            </Route>

            {/* Field Boy Routes */}
            <Route path="/field-boy" element={
              <ProtectedRoute allowedRoles={['field_boy']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<FieldBoyDashboard />} />
              <Route path="conveyance" element={<MyConveyancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
