import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { PredictPage } from './pages/PredictPage';
import { BatchManagementPage } from './pages/BatchManagementPage';
import { BulkPredictionPage } from './pages/BulkPredictionPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';

const queryClient = new QueryClient();

const PAGE_INFO: Record<string, { title: string; subtitle: string }> = {
  '/home': { title: 'Home', subtitle: 'Welcome to YarnInsight Quality Platform' },
  '/dashboard': { title: 'Executive Dashboard', subtitle: 'Production-level KPIs, trends and grade distribution' },
  '/predict': { title: 'Predict Strength & Grade', subtitle: 'Single-sample physio-chemical quality analysis' },
  '/batches': { title: 'Batch Management', subtitle: 'Search, review and manage yarn batch inventory' },
  '/bulk': { title: 'Bulk Prediction', subtitle: 'Process multiple batches via CSV upload' },
  '/reports': { title: 'Reports & Certificates', subtitle: 'Generate quality certificates and export batch data' },
  '/admin': { title: 'Admin Control Panel', subtitle: 'User management, audit logs and data operations' },
};

function ShellRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const info = PAGE_INFO[path];
  return (
    <ProtectedRoute>
      <AppShell title={info.title} subtitle={info.subtitle}>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/home' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/home" element={<ShellRoute path="/home"><HomePage /></ShellRoute>} />
      <Route path="/dashboard" element={<ShellRoute path="/dashboard"><DashboardPage /></ShellRoute>} />
      <Route path="/predict" element={<ShellRoute path="/predict"><PredictPage /></ShellRoute>} />
      <Route path="/batches" element={<ShellRoute path="/batches"><BatchManagementPage /></ShellRoute>} />
      <Route path="/bulk" element={<ShellRoute path="/bulk"><BulkPredictionPage /></ShellRoute>} />
      <Route path="/reports" element={<ShellRoute path="/reports"><ReportsPage /></ShellRoute>} />
      <Route path="/admin" element={<ShellRoute path="/admin"><AdminPage /></ShellRoute>} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
