import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { PortfolioPage } from './pages/dashboard/PortfolioPage';
import { ServicesPage } from './pages/dashboard/ServicesPage';
import { AvailabilityPage } from './pages/dashboard/AvailabilityPage';
import { BookingsPage } from './pages/dashboard/BookingsPage';
import { PhotographerPublicPage } from './pages/public/PhotographerPublicPage';
import { BookingConfirmationPage } from './pages/public/BookingConfirmationPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/p/:slug" element={<PhotographerPublicPage />} />
              <Route path="/photographer/:slug" element={<PhotographerPublicPage />} />
              <Route path="/booking/success/:reference" element={<BookingConfirmationPage />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverviewPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="portfolio" element={<PortfolioPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="calendar" element={<AvailabilityPage />} />
                <Route path="availability" element={<Navigate to="/dashboard/calendar" replace />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="settings" element={<Navigate to="/dashboard/profile" replace />} />
                
                {/* Fallback for any other dashboard subpaths */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
