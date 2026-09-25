import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  User as UserIcon,
  Package,
  MapPin,
  CreditCard,
  HelpCircle,
  Info,
  ChevronRight,
  Bell,
  Settings,
  ClipboardList,
  ChevronDown,
  Heart,
  LogOut,
} from 'lucide-react';
import SavedAddresses from '@/components/profile/SavedAddresses';
import ReferEarn from '@/components/profile/ReferEarn';
import { Image } from '@/components/ui/image';
import { toast } from '@/components/ui/use-toast';

function MenuSection({ items, showAddresses, setShowAddresses, navigate }) {
  return (
    <div className="bg-card rounded-2xl border border-border divide-y divide-gray-50">
      {items.map((item, i) => (
        <div key={i}>
          {item.toggle ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 active:bg-muted/50"
              onClick={() => setShowAddresses((v) => !v)}
            >
              <item.icon className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-foreground flex-1 text-left">
                {item.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showAddresses ? 'rotate-180' : ''}`}
              />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 active:bg-muted/50"
              onClick={() => navigate(item.to)}
            >
              <item.icon className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-foreground flex-1 text-left">
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
          {item.toggle && (
            <AnimatePresence>
              {showAddresses && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3">
                    <SavedAddresses />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showAddresses, setShowAddresses] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    try {
      await base44.auth.logout('/');
    } catch {
      toast({ title: 'Could not log out', variant: 'destructive' });
    }
  };

  const accountItems = [
    { icon: Package, label: 'My Orders', to: '/orders' },
    { icon: MapPin, label: 'Delivery Addresses', toggle: true },
    { icon: CreditCard, label: 'Payment Methods', to: '/payment-methods' },
    { icon: Heart, label: 'Wishlist', to: '/wishlist' },
  ];

  const supportItems = [
    { icon: HelpCircle, label: 'Help & Support', to: '/support' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
    { icon: Settings, label: 'Settings', to: '/settings' },
    { icon: Info, label: 'About Ukart', to: '/about' },
  ];

  return (
    <div className="p-4 space-y-5">
      {/* Profile card */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/account')}
        className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3.5 active:bg-muted/50"
      >
        {user?.avatar_url ? (
          <Image
            src={user.avatar_url}
            fittingType="fill"
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2E7D32] flex items-center justify-center text-white">
            <UserIcon className="w-7 h-7" />
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <h2 className="font-bold text-[#1a2238] truncate">
            {user?.full_name || 'Welcome to Ukart'}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email || 'No Market Wahala'}
          </p>
          <span className="text-[11px] text-[#2E7D32] font-semibold">
            Edit Profile →
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </motion.button>

      <ReferEarn />

      <div>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Account
        </h2>
        <MenuSection
          items={accountItems}
          showAddresses={showAddresses}
          setShowAddresses={setShowAddresses}
          navigate={navigate}
        />
      </div>

      <div>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Support
        </h2>
        <MenuSection
          items={supportItems}
          showAddresses={showAddresses}
          setShowAddresses={setShowAddresses}
          navigate={navigate}
        />
      </div>

      {isAdmin && (
        <div>
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Admin
          </h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-gray-50">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 active:bg-muted/50"
              onClick={() => navigate('/admin/orders')}
            >
              <ClipboardList className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-foreground flex-1 text-left">
                Manage Orders
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 active:bg-muted/50"
              onClick={() => navigate('/admin/tickets')}
            >
              <HelpCircle className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-foreground flex-1 text-left">
                Support Tickets
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 active:bg-muted/50"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-foreground flex-1 text-left">
                Notification Settings
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.button>
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 active:bg-red-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <LogOut className="w-5 h-5 text-red-500" />
        </div>
        <span className="text-sm font-semibold text-red-500">Log Out</span>
      </button>
    </div>
  );
}