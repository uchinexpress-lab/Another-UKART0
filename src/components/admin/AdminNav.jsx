import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Boxes, ImagePlus, ClipboardList, Settings, LayoutDashboard, Home, UtensilsCrossed } from 'lucide-react';

const TABS = [
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/meal-kits', label: 'Meal Kits', icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Categories', icon: Boxes },
  { to: '/admin/homepage', label: 'Homepage', icon: Home },
  { to: '/admin/banners', label: 'Banners', icon: LayoutDashboard },
  { to: '/admin/bulk-images', label: 'Photos', icon: ImagePlus },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 mb-3 sticky top-14 z-30 bg-background/95 backdrop-blur py-2">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.to);
        const Icon = t.icon;
        return (
          <button
            key={t.to}
            onClick={() => navigate(t.to)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              active ? 'bg-[#2E7D32] text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        );
      })}
    </div>
  );
}