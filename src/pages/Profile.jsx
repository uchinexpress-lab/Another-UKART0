import React from 'react';
import { User, Package, MapPin, CreditCard, HelpCircle, Info, ChevronRight, Bell } from 'lucide-react';

export default function Profile() {
  const menuItems = [
    { icon: Package, label: 'My Orders' },
    { icon: MapPin, label: 'Delivery Addresses' },
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
          <button key={i} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50">
            <item.icon className="w-5 h-5 text-[#2E7D32]" />
            <span className="text-sm font-medium text-gray-900 flex-1 text-left">
              {item.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}