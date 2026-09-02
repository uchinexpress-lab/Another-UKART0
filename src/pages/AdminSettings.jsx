import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/lib/notifications';
import {
  Mail,
  Settings,
  Loader2,
  Lock,
  Save,
  CheckCircle2,
} from 'lucide-react';

const toggleFields = [
  {
    key: 'enable_business_email',
    label: 'Business / Admin Email',
    description: 'Notify the business email when a new order is placed.',
  },
  {
    key: 'enable_customer_confirmation',
    label: 'Customer Order Confirmation',
    description: 'Send a confirmation email to the customer after they order.',
  },
  {
    key: 'enable_customer_status_emails',
    label: 'Customer Status Updates',
    description: 'Email the customer when their order status changes.',
  },
];

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [businessEmail, setBusinessEmail] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await getNotificationSettings();
      setSettings(s);
      setBusinessEmail(s.business_email || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') loadSettings();
    else if (user !== null) setLoading(false);
  }, [user]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateNotificationSettings(settings.id, {
        business_email: businessEmail.trim(),
        enable_business_email: settings.enable_business_email,
        enable_customer_confirmation: settings.enable_customer_confirmation,
        enable_customer_status_emails: settings.enable_customer_status_emails,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32] mx-auto" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Lock className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Admins Only</h2>
        <p className="text-sm text-gray-500 mb-4">
          You need an admin account to access this page.
        </p>
        <Link to="/" className="text-[#2E7D32] font-bold text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Notification Settings</h1>

      {/* Business email */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
            <Mail className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Business Email</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          New order notifications are sent here. This must be a registered Ukart
          user for delivery to work.
        </p>
        <input
          value={businessEmail}
          onChange={(e) => setBusinessEmail(e.target.value)}
          placeholder="ukartfreshventures@gmail.com"
          type="email"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]"
        />
      </div>

      {/* Notification toggles */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Email Notifications</h2>
        </div>
        <div className="space-y-1">
          {toggleFields.map((field) => (
            <div
              key={field.key}
              className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex-1 pr-3">
                <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
              </div>
              <button
                onClick={() => handleToggle(field.key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  settings[field.key] ? 'bg-[#2E7D32]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings[field.key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" /> Settings Saved
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save Settings
          </>
        )}
      </button>
    </div>
  );
}