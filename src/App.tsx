import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MyTripsPage } from './pages/trips/MyTripsPage';
import { CreateTripPage } from './pages/trips/CreateTripPage';
import { TripDetailPage } from './pages/trips/TripDetailPage';
import { ItineraryBuilderPage } from './pages/itinerary/ItineraryBuilderPage';
import { BudgetPage } from './pages/budget/BudgetPage';
import { CalendarTimelinePage } from './pages/calendar/CalendarTimelinePage';
import { CityExplorePage } from './pages/explore/CityExplorePage';
import { ActivityExplorePage } from './pages/explore/ActivityExplorePage';
import { CommunityPage } from './pages/community/CommunityPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SharedTripPage } from './pages/shared/SharedTripPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public Read-Only Share Link */}
            <Route path="/shared/:shareToken" element={<SharedTripPage />} />

            {/* Authenticated Application Routes with AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/trips" element={<MyTripsPage />} />
              <Route path="/trips/new" element={<CreateTripPage />} />
              <Route path="/trips/:id" element={<TripDetailPage />} />
              <Route path="/trips/:id/itinerary" element={<ItineraryBuilderPage />} />
              <Route path="/trips/:id/budget" element={<BudgetPage />} />
              <Route path="/trips/:id/calendar" element={<CalendarTimelinePage />} />
              <Route path="/explore/cities" element={<CityExplorePage />} />
              <Route path="/explore/activities" element={<ActivityExplorePage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
