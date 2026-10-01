import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isStaffRole } from '@/lib/staffRoles';

const StaffLogin = lazy(() => import('@/pages/staff/StaffLogin'));
const StaffLayout = lazy(() => import('@/components/staff/StaffLayout'));
const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'));
const StaffOrders = lazy(() => import('@/pages/staff/StaffOrders'));
const StaffTickets = lazy(() => import('@/pages/staff/StaffTickets'));
const StaffTicketDetail = lazy(() => import('@/pages/staff/StaffTicketDetail'));
const StaffRiders = lazy(() => import('@/pages/staff/StaffRiders'));
const StaffLiveDeliveries = lazy(() => import('@/pages/staff/StaffLiveDeliveries'));
const StaffProducts = lazy(() => import('@/pages/staff/StaffProducts'));
const StaffCategories = lazy(() => import('@/pages/staff/StaffCategories'));
const StaffMealKits = lazy(() => import('@/pages/staff/StaffMealKits'));
const StaffBanners = lazy(() => import('@/pages/staff/StaffBanners'));
const StaffBulkImages = lazy(() => import('@/pages/staff/StaffBulkImages'));
const StaffCustomers = lazy(() => import('@/pages/staff/StaffCustomers'));
const StaffReports = lazy(() => import('@/pages/staff/StaffReports'));
const StaffNotifications = lazy(() => import('@/pages/staff/StaffNotifications'));
const StaffSettings = lazy(() => import('@/pages/staff/StaffSettings'));

function StaffLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
    </div>
  );
}

function StaffNotAuthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-600 mb-4">You don't have permission to access the Ukart Staff Admin portal.</p>
        <a href="/" className="text-[#2E7D32] font-semibold underline">Back to Ukart</a>
      </div>
    </div>
  );
}

export default function StaffApp() {
  const { isLoadingAuth, user } = useAuth();
  const location = useLocation();
  const isLoginRoute = location.pathname === '/staff/login';

  if (isLoadingAuth) return <StaffLoading />;

  if (isLoginRoute) {
    if (user && isStaffRole(user.role)) return <Navigate to="/staff" replace />;
    return (
      <Suspense fallback={<StaffLoading />}>
        <StaffLogin />
      </Suspense>
    );
  }

  if (!user) return <Navigate to="/staff/login?returnTo=/staff" replace />;
  if (!isStaffRole(user.role)) return <StaffNotAuthorized />;

  return (
    <Suspense fallback={<StaffLoading />}>
      <Routes>
        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/orders" element={<StaffOrders />} />
          <Route path="/staff/tickets" element={<StaffTickets />} />
          <Route path="/staff/tickets/:id" element={<StaffTicketDetail />} />
          <Route path="/staff/riders" element={<StaffRiders />} />
          <Route path="/staff/live-deliveries" element={<StaffLiveDeliveries />} />
          <Route path="/staff/products" element={<StaffProducts />} />
          <Route path="/staff/categories" element={<StaffCategories />} />
          <Route path="/staff/meal-kits" element={<StaffMealKits />} />
          <Route path="/staff/banners" element={<StaffBanners />} />
          <Route path="/staff/bulk-images" element={<StaffBulkImages />} />
          <Route path="/staff/customers" element={<StaffCustomers />} />
          <Route path="/staff/reports" element={<StaffReports />} />
          <Route path="/staff/notifications" element={<StaffNotifications />} />
          <Route path="/staff/settings" element={<StaffSettings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}