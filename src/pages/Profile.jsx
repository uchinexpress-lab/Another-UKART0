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
import AdminEntry from '@/components/staff/AdminEntry';
import ReferEarn from '@/components/profile/ReferEarn';
import { Image } from '@/components/ui/image';
import { toast } from '@/components/ui/use-toast';

function MenuSection({ items, showAddresses, setShowAddresses, navigate }) {
  return (
    <div className="uk-card overflow-hidden divide-y divide-border">
      {items.map((item, i) => (
        <div key={i}>
          {item.toggle ? (
            <motion.button
              whileTap={{ scale: 0.995 }}
              className="uk-row"
              onClick={() => setShowAddresses((v) => !v)}
            >
              <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="w-[18px] h-[18px] text-[#2E7D32]" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-medium text-foreground flex-1 text-left">
                {item.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${showAddresses ? 'rotate-180' : ''}`}
              />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.995 }}
              className="uk-row"
              onClick={() => navigate(item.to)}
            >
              <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="w-[18px] h-[18px] text-[#2E7D32]" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-medium text-foreground flex-1 text-left">
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
    <div className="uk-page space-y-5">
      {/* Profile header */}
      <motion.button
        whileTap={{ scale: 0.995 }}
        onClick={() => navigate('/account')}
        className="w-full uk-card p-4 flex items-center gap-3.5"
      >
        {user?.avatar_url ? (
          <Image
            src={user.avatar_url}
            fittingType="fill"
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2E7D32] flex items-center justify-center text-white">
            <UserIcon className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <h2 className="text-[15px] font-bold text-foreground truncate">
            {user?.full_name || 'Welcome to Ukart'}
          </h2>
          <p className="text-[12px] text-muted-foreground truncate">
            {user?.email || 'No Market Wahala'}
          </p>
          <span className="text-[11px] text-[#2E7D32] font-bold">Edit profile</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.button>

      <AdminEntry />
      <ReferEarn />

      <div>
        <h2 className="uk-section-label mb-2 px-1">Account</h2>
        <MenuSection
          items={accountItems}
          showAddresses={showAddresses}
          setShowAddresses={setShowAddresses}
          navigate={navigate}
        />
      </div>

      <div>
        <h2 className="uk-section-label mb-2 px-1">Support</h2>
        <MenuSection
          items={supportItems}
          showAddresses={showAddresses}
          setShowAddresses={setShowAddresses}
          navigate={navigate}
        />
      </div>

      {isAdmin && (
        <div>
          <h2 className="uk-section-label mb-2 px-1">Admin</h2>
          <div className="uk-card overflow-hidden divide-y divide-border">
            <motion.button whileTap={{ scale: 0.995 }} className="uk-row" onClick={() => navigate('/admin/orders')}>
              <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <ClipboardList className="w-[18px] h-[18px] text-[#2E7D32]" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-medium text-foreground flex-1 text-left">Manage Orders</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.995 }} className="uk-row" onClick={() => navigate('/admin/tickets')}>
              <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <HelpCircle className="w-[18px] h-[18px] text-[#2E7D32]" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-medium text-foreground flex-1 text-left">Support Tickets</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.995 }} className="uk-row" onClick={() => navigate('/admin/settings')}>
              <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Settings className="w-[18px] h-[18px] text-[#2E7D32]" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-medium text-foreground flex-1 text-left">Notification Settings</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="w-full uk-card p-4 flex items-center gap-3 active:bg-red-50 transition-colors"
      >
        <span className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <LogOut className="w-[18px] h-[18px] text-red-500" />
        </span>
        <span className="text-[13px] font-semibold text-red-500">Log Out</span>
      </button>
    </div>
  );
}