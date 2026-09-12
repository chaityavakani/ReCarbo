import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import { AppShell } from './layouts/AppShell';
import { PublicLayout } from './layouts/PublicLayout';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Authenticated Pages
import { DashboardDispatcher } from './pages/dashboards/DashboardDispatcher';
import { MarketplacePage } from './pages/marketplace/MarketplacePage';
import { ListingsPage } from './pages/listings/ListingsPage';
import { RequirementsPage } from './pages/requirements/RequirementsPage';
import { QuoteRequestsPage } from './pages/quotes/QuoteRequestsPage';
import { CalculatorPage } from './pages/calculator/CalculatorPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { LogisticsPage } from './pages/logistics/LogisticsPage';
import { AssistantPage } from './pages/assistant/AssistantPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { CompanyProfilePage } from './pages/profile/CompanyProfilePage';
import { SustainabilityPage } from './pages/sustainability/SustainabilityPage';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Authenticated Application Shell Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardDispatcher />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/requirements" element={<RequirementsPage />} />
                <Route path="/quote-requests" element={<QuoteRequestsPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/logistics" element={<LogisticsPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/sustainability" element={<SustainabilityPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<CompanyProfilePage />} />

                {/* Admin Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/admin/overview" element={<AdminOverviewPage />} />
                  <Route path="/admin/companies" element={<AdminOverviewPage />} />
                  <Route path="/admin/settings" element={<AdminSettingsPage />} />
                  <Route path="/admin/audit-logs" element={<AdminOverviewPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
