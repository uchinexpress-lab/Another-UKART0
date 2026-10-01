import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getAccessiblePages, getRoleLabel } from '@/lib/staffRoles';
import {
  LayoutDashboard, ShoppingCart, Ticket as TicketIcon, Bike, Truck,
  Package, FolderTree, UtensilsCrossed, Image as ImageIcon, Upload, Users,
  BarChart3, Bell, Settings as SettingsIcon, Search, Menu, LogOut, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { key: 'tickets', label: 'Tickets', path: '/admin/tickets', icon: TicketIcon },
  { key: 'riders', label: 'Riders', path: '/admin/riders', icon: Bike },
  { key: 'live-deliveries', label: 'Live Deliveries', path: '/admin/live-deliveries', icon: Truck },
  { key: 'products', label: 'Products', path: '/admin/products', icon: Package },
  { key: 'categories', label: 'Categories', path: '/admin/categories', icon: FolderTree },
  { key: 'meal-kits', label: 'Meal Kits', path: '/admin/meal-kits', icon: UtensilsCrossed },
  { key: 'banners', label: 'Banners', path: '/admin/banners', icon: ImageIcon },
  { key: 'bulk-images', label: 'Bulk Images', path: '/admin/bulk-images', icon: Upload },
  { key: 'homepage', label: 'Homepage', path: '/admin/homepage', icon: LayoutDashboard },
  { key: 'customers', label: 'Customers', path: '/admin/customers', icon: Users },
  { key: 'reports', label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { key: 'notifications', label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { key: 'settings', label: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

export default function StaffLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const accessiblePages = getAccessiblePages(user?.role);
  const visibleNav = NAV_ITEMS.filter(
    (item) => item.key === 'dashboard' || accessiblePages.includes(item.key)
  );

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  const initials = (user?.full_name || user?.email || 'S')[0].toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1B4332] text-white flex-col transition-transform duration-200 ${
          sidebarOpen ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/10 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#5FCF65] flex items-center justify-center font-bold text-[#1B4332] text-lg">
            U
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Ukart Staff</p>
            <p className="text-[10px] text-white/50">Operations Admin</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {user?.full_name || user?.email}
              </p>
              <p className="text-[10px] text-white/50">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 max-w-md mx-auto lg:mx-0">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, tickets, customers..."
                className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 bg-gray-50 outline-none focus:border-[#2E7D32] focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/admin/orders?search=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/admin/notifications"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              to="/admin/settings"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}