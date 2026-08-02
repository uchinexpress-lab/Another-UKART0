import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Package, MapPin, CreditCard, HelpCircle, Info, ChevronRight, Bell, Settings, ClipboardList, ChevronDown } from 'lucide-react';
import SavedAddresses from '@/components/profile/SavedAddresses';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showAddresses, setShowAddresses] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: Package, label: 'My Orders' },
    { icon: MapPin, label: 'Delivery Addresses', toggle: true },
    { icon: CreditCard, label: 'Payment Methods' },
    { icon: Bell, label: 'Notifications' },
    { icon: HelpCircle, label: 'Help & Support' },
    { icon: Info, label: 'About Ukart' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #76C237, #2E7D32)' }}
        >
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Welcome to Ukart</h2>
          <p className="text-sm text-gray-500">No Market Wahala</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {menuItems.map((item, i) => (
          <div key={i}>
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50"
              onClick={() => item.toggle && setShowAddresses((v) => !v)}
            >
              <item.icon className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-gray-900 flex-1 text-left">
                {item.label}
              </span>
              {item.toggle ? (
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${showAddresses ? 'rotate-180' : ''}`}
                />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {item.toggle && showAddresses && (
              <div className="px-4 pb-3">
                <SavedAddresses />
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 px-1">Admin</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            <Link to="/admin/orders" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50">
              <ClipboardList className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-gray-900 flex-1 text-left">Manage Orders</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link to="/admin/settings" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50">
              <Settings className="w-5 h-5 text-[#2E7D32]" />
              <span className="text-sm font-medium text-gray-900 flex-1 text-left">Notification Settings</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}