import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/staffRoles';
import { Loader2, Save, Bell, Mail } from 'lucide-react';

export default function StaffNotifications() {
  const { user } = useAuth();
  const canManage = canAccessPage(user, 'notifications');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await base44.entities.NotificationSetting.filter({}, { limit: 1 });
      if (res.items?.length > 0) {
        setSettings(res.items[0]);
      } else {
        const created = await base44.entities.NotificationSetting.create({
          business_email: 'ukartfreshventures@gmail.com',
          enable_business_email: true,
          enable_customer_confirmation: true,
          enable_customer_status_emails: true,
        });
        setSettings(created);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.NotificationSetting.update(settings.id, {
        business_email: settings.business_email,
        enable_business_email: settings.enable_business_email,
        enable_customer_confirmation: settings.enable_customer_confirmation,
        enable_customer_status_emails: settings.enable_customer_status_emails,
      });
      alert('Settings saved');
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-16 text-sm text-gray-400">No settings found</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500">Email notification settings</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-2xl">
        <div>
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
            <Mail className="w-4 h-4 text-gray-400" /> Business Email
          </label>
          <input
            value={settings.business_email || ''}
            onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
            disabled={!canManage}
            className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32] disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">New order notifications are sent to this email</p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_business_email !== false}
              onChange={(e) => setSettings({ ...settings, enable_business_email: e.target.checked })}
              disabled={!canManage}
              className="w-4 h-4 rounded accent-[#2E7D32]"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Business email notifications</p>
              <p className="text-xs text-gray-500">Send new order alerts to the business email</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_customer_confirmation !== false}
              onChange={(e) => setSettings({ ...settings, enable_customer_confirmation: e.target.checked })}
              disabled={!canManage}
              className="w-4 h-4 rounded accent-[#2E7D32]"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Customer confirmation emails</p>
              <p className="text-xs text-gray-500">Send order confirmation to customers</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_customer_status_emails !== false}
              onChange={(e) => setSettings({ ...settings, enable_customer_status_emails: e.target.checked })}
              disabled={!canManage}
              className="w-4 h-4 rounded accent-[#2E7D32]"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Customer status update emails</p>
              <p className="text-xs text-gray-500">Send status updates when order status changes</p>
            </div>
          </label>
        </div>

        {canManage && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        )}
      </div>
    </div>
  );
}