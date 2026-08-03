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
} from 'lucide-react';
import SavedAddresses from '@/components/profile/SavedAddresses';
import ReferEarn from '@/components/profile/ReferEarn';
import { Image } from '@/components/ui/image';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showAddresses, setShowAddresses] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: Package, label: 'My Orders', to: '/orders' },
    { icon: MapPin, label: 'Delivery Addresses', toggle: true },
    { icon: CreditCard, label: 'Payment Methods', to: '/payment-methods' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
    { icon: HelpCircle, label: 'Help & Support', to: '/support' },
    { icon: Info, label: 'About Ukart', to: '/about' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/account')}
        className="w-full bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 mb-6 active:bg-gray-50"
      >
        {user?.avatar_url ? (
          <Image
            src={user.avatar_url}
            fittingType="fill"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #76C237, #2E7D32)' }}
          >
            <UserIcon className="w-8 h-8" />
          </div>
        )}
        <div className="flex-1 text-left">
          <h2 className="font-bold text-gray-900">{user?.full_name || 'Welcome to Ukart'}</h2>
          <p className="text-sm text-gray-500">{user?.email || 'No Market Wahala'}</p>
          <span className="text-[11px] text-[#2E7D32] font-semibold">Edit profile →</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </motion.button>

      <ReferEarn />

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {menuItems.map((item, i) => (
          <div key={i}>
            {item.toggle ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-4 active:bg-gray-50"
                onClick={() => setShowAddresses((v) => !v)}
              >
                <item.icon className="w-5 h-5 text-[#2E7D32]" />
                <span className="text-sm font-medium text-gray-900 flex-1 text-left">
                  {item.label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${showAddresses ? 'rotate-180' : ''}`}
                />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-4 active:bg-gray-50"
                onClick={() => navigate(item.to)}
              >
                <item.icon className="w-5 h-5 text-[#2E7D32]" />
                <span className="text-sm font-medium text-gray-900 flex-1 text-left">
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

      {isAdmin && (
        <div className="mt-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 px-1">Admin</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 active:bg-gray-50"
              onClick={() => navigate('/admin/orders')}
            >
              <ClipboardList className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-gray-900 flex-1 text-left">Manage Orders</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 active:bg-gray-50"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-gray-900 flex-1 text-left">Notification Settings</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}