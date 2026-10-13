import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AdminAISettingsPage } from './pages/AdminAISettingsPage';
import { AdminDeptsPage } from './pages/AdminDeptsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { FeedbackDetailPage } from './pages/FeedbackDetailPage';
import { FeedbackListPage } from './pages/FeedbackListPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PublicSubmitPage } from './pages/PublicSubmitPage';
import { PublicTrackPage } from './pages/PublicTrackPage';
import { SubmissionSuccessPage } from './pages/SubmissionSuccessPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/submit" element={<PublicSubmitPage />} />
                <Route path="/submit/success" element={<SubmissionSuccessPage />} />
                <Route path="/track" element={<PublicTrackPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Authenticated Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/feedbacks"
                  element={
                    <ProtectedRoute>
                      <FeedbackListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/feedbacks/:id"
                  element={
                    <ProtectedRoute>
                      <FeedbackDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Only Routes */}
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['administrator']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/departments"
                  element={
                    <ProtectedRoute allowedRoles={['administrator']}>
                      <AdminDeptsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/ai-settings"
                  element={
                    <ProtectedRoute allowedRoles={['administrator']}>
                      <AdminAISettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
