import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isStaffMember, canAccessPage } from '@/lib/staffRoles';

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
const AdminSettings = lazy(() => import('@/pages/AdminSettings'));
// Legacy admin pages — full management UIs rendered inside the StaffLayout
const AdminProductEdit = lazy(() => import('@/pages/AdminProductEdit'));
const AdminMealKitEdit = lazy(() => import('@/pages/AdminMealKitEdit'));
const AdminBanners = lazy(() => import('@/pages/AdminBanners'));
const AdminBulkImages = lazy(() => import('@/pages/AdminBulkImages'));
const AdminHomepage = lazy(() => import('@/pages/AdminHomepage'));
const AdminRiderProfile = lazy(() => import('@/pages/AdminRiderProfile'));

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

export default function StaffApp({ dashboardOnly = false }) {
  const { isLoadingAuth, user } = useAuth();
  const location = useLocation();
  const isLoginRoute = location.pathname === '/admin/login';

  if (isLoadingAuth) return <StaffLoading />;

  if (isLoginRoute) {
    if (user && isStaffMember(user)) return <Navigate to="/admin" replace />;
    return (
      <Suspense fallback={<StaffLoading />}>
        <StaffLogin />
      </Suspense>
    );
  }

  if (!user) return <Navigate to={`/admin/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  const section = location.pathname.split('/')[2] || 'dashboard';
  if (!isStaffMember(user) || !canAccessPage(user, section)) return <StaffNotAuthorized />;

  if (dashboardOnly) return <Suspense fallback={<StaffLoading />}><StaffLayout><StaffDashboard /></StaffLayout></Suspense>;

  return (
    <Suspense fallback={<StaffLoading />}>
      <Routes>
        <Route element={<StaffLayout />}>
          <Route index element={<StaffDashboard />} />
          <Route path="orders" element={<StaffOrders />} />
          <Route path="tickets" element={<StaffTickets />} />
          <Route path="tickets/:id" element={<StaffTicketDetail />} />
          <Route path="riders" element={<StaffRiders />} />
          <Route path="riders/:id" element={<AdminRiderProfile />} />
          <Route path="live-deliveries" element={<StaffLiveDeliveries />} />
          <Route path="products" element={<StaffProducts />} />
          <Route path="products/new" element={<AdminProductEdit />} />
          <Route path="products/:id" element={<AdminProductEdit />} />
          <Route path="categories" element={<StaffCategories />} />
          <Route path="meal-kits" element={<StaffMealKits />} />
          <Route path="meal-kits/new" element={<AdminMealKitEdit />} />
          <Route path="meal-kits/:id" element={<AdminMealKitEdit />} />
          <Route path="banners" element={<StaffBanners />} />
          <Route path="banners/manage" element={<AdminBanners />} />
          <Route path="bulk-images" element={<StaffBulkImages />} />
          <Route path="bulk-images/manage" element={<AdminBulkImages />} />
          <Route path="homepage" element={<AdminHomepage />} />
          <Route path="customers" element={<StaffCustomers />} />
          <Route path="reports" element={<StaffReports />} />
          <Route path="notifications" element={<StaffNotifications />} />
          <Route path="settings" element={<StaffSettings />} />
          <Route path="settings/notifications" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}