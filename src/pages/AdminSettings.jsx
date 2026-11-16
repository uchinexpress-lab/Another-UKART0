import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
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
  Megaphone,
  Send,
  Trash2,
  Tag,
  Percent,
    Upload,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AdminNav from '@/components/admin/AdminNav';
import DeliveryPricingSettings from '@/components/admin/DeliveryPricingSettings';

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
  const DEFAULT_TEMPLATES = {
  new: {
    subject: 'Your Ukart Order #{{order_number}} is Confirmed!',
    body: 'Hi {{customer_name}}, we have received your order #{{order_number}} ({{total}}) and are getting your groceries ready.',
  },
  processing: {
    subject: 'Ukart Order #{{order_number}} — Being Prepared',
    body: 'Hi {{customer_name}}, our team is carefully packing your items for order #{{order_number}}.',
  },
  ready: {
    subject: 'Ukart Order #{{order_number}} — Ready for Delivery',
    body: 'Hi {{customer_name}}, your order #{{order_number}} is packed and ready for dispatch.',
  },
  on_the_way: {
    subject: 'Ukart Order #{{order_number}} — Out for Delivery!',
    body: 'Hi {{customer_name}}, your Ukart rider is on the way to {{address}} with order #{{order_number}}!',
  },
  delivered: {
    subject: 'Ukart Order #{{order_number}} — Delivered',
    body: 'Hi {{customer_name}}, your order #{{order_number}} has been delivered. Thank you for shopping with Ukart!',
  },
};

const [headerImageUrl, setHeaderImageUrl] = useState('');
const [attachmentUrl, setAttachmentUrl] = useState('');
const [attachmentName, setAttachmentName] = useState('');
const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
const [activeStage, setActiveStage] = useState('new');
const [uploadingAsset, setUploadingAsset] = useState(null);

const uploadEmailAsset = async (file, kind) => {
  if (!file) return;
  setUploadingAsset(kind);
  try {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `email-assets/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    if (data?.publicUrl) {
      if (kind === 'banner') setHeaderImageUrl(data.publicUrl);
      if (kind === 'attachment') {
        setAttachmentUrl(data.publicUrl);
        setAttachmentName(file.name);
      }
    }
  } catch (err) {
    alert('Upload failed: ' + (err?.message || 'Unknown error'));
  } finally {
    setUploadingAsset(null);
  }
};
  const [alerts, setAlerts] = useState([]);
  const [alertForm, setAlertForm] = useState({
    title: '',
    body: '',
    type: 'announcement',
    voucher_code: '',
    discount_percent: '',
  });
  const [sendingAlert, setSendingAlert] = useState(false);
  const [promoSettings, setPromoSettings] = useState(null);
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoSaved, setPromoSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const loadAlerts = async () => {
    try {
      const list = await base44.entities.DealAlert.list('-created_date', 20);
      setAlerts(list);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') loadAlerts();
  }, [user]);

  const broadcastAlert = async () => {
    if (!alertForm.title.trim() || !alertForm.body.trim()) {
      toast({ title: 'Title and message are required', variant: 'destructive' });
      return;
    }
    setSendingAlert(true);
    try {
      const payload = {
        title: alertForm.title.trim(),
        body: alertForm.body.trim(),
        type: alertForm.type,
        active: true,
      };
      if (alertForm.type === 'discount_code') {
        payload.voucher_code = alertForm.voucher_code.trim().toUpperCase();
        payload.discount_percent = Number(alertForm.discount_percent) || 10;
      }
      await base44.entities.DealAlert.create(payload);
            base44.functions.invoke('sendPushBroadcast', {
        title: alertForm.title.trim(),
        body: alertForm.body.trim(),
        url: 'https://ukartapp.com',
      }).catch((err) => console.warn('Push broadcast skipped:', err));
      toast({ title: 'Deal alert broadcast to all users' });
      setAlertForm({ title: '', body: '', type: 'announcement', voucher_code: '', discount_percent: '' });
      loadAlerts();
    } catch (e) {
      toast({ title: 'Could not broadcast alert', variant: 'destructive' });
    }
    setSendingAlert(false);
  };

  const deleteAlert = async (id) => {
    try {
      await base44.entities.DealAlert.delete(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Alert removed' });
    } catch {
      toast({ title: 'Could not remove alert', variant: 'destructive' });
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await getNotificationSettings();
      setSettings(s);
      setBusinessEmail(s.business_email || '');
          setHeaderImageUrl(s.header_image_url || '');
    setAttachmentUrl(s.attachment_url || '');
    setAttachmentName(s.attachment_name || '');
    setTemplates({ ...DEFAULT_TEMPLATES, ...(s.templates || {}) });
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

  useEffect(() => {
    if (user?.role === 'admin') {
      base44.entities.PromotionSetting.filter({}, { limit: 1 })
        .then((res) => setPromoSettings(res.items?.[0] || null))
        .catch(() => {});
    }
  }, [user]);

  const handleSavePromo = async () => {
    if (!promoSettings) return;
    setSavingPromo(true);
    setPromoSaved(false);
    try {
      const payload = {
        first_order_enabled: promoSettings.first_order_enabled !== false,
        first_order_discount: Number(promoSettings.first_order_discount) || 0,
      };
      if (promoSettings.id) {
        await base44.entities.PromotionSetting.update(promoSettings.id, payload);
      } else {
        const created = await base44.entities.PromotionSetting.create(payload);
        setPromoSettings(created);
      }
      setPromoSaved(true);
      setTimeout(() => setPromoSaved(false), 3000);
    } catch (e) {
      toast({ title: 'Failed to save promotion settings', variant: 'destructive' });
    }
    setSavingPromo(false);
  };

    const handleToggle = async (key) => {
    const nextValue = !settings?.[key];
    const nextSettings = { ...(settings || {}), [key]: nextValue };
    setSettings(nextSettings);
    try {
      const payload = {
        business_email: businessEmail.trim() || 'ukartfreshventures@gmail.com',
        enable_business_email: nextSettings.enable_business_email ?? true,
        enable_customer_confirmation: nextSettings.enable_customer_confirmation ?? true,
        enable_customer_status_emails: nextSettings.enable_customer_status_emails ?? true,
        header_image_url: headerImageUrl.trim() || null,
        attachment_url: attachmentUrl.trim() || null,
        attachment_name: attachmentName.trim() || null,
        templates,
      };
      if (settings?.id) {
        const updated = await updateNotificationSettings(settings.id, payload);
        setSettings(updated);
      } else {
        const created = await base44.entities.NotificationSetting.create(payload);
        setSettings(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Toggle save error:', e);
      alert('Could not save toggle: ' + (e?.message || 'Please try again.'));
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
        <h2 className="text-lg font-bold text-foreground mb-1">Admins Only</h2>
        <p className="text-sm text-muted-foreground mb-4">
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
      <AdminNav />
      <h1 className="text-xl font-bold text-foreground mb-6">Notification Settings</h1>

      {/* Business email */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Business Email</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
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
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Email Notifications</h2>
        </div>
        <div className="space-y-1">
          {toggleFields.map((field) => (
            <div
              key={field.key}
              className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex-1 pr-3">
                <p className="text-sm font-semibold text-foreground">{field.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
              </div>
              <button
                onClick={() => handleToggle(field.key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  settings[field.key] ? 'bg-[#2E7D32]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
                    settings[field.key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Email Branding, Attachment & Templates */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Email Banner, Attachment & Templates</h2>
            <p className="text-xs text-muted-foreground">Customize pictures, attachments, and messages sent to customers.</p>
          </div>
        </div>

        {/* Header Banner Upload */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-foreground block">Header Banner Picture</label>
          <div className="flex items-center gap-2">
            <label className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
              {uploadingAsset === 'banner' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Banner Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadEmailAsset(e.target.files && e.target.files[0], 'banner')}
              />
            </label>
            {headerImageUrl && (
              <button
                type="button"
                onClick={() => setHeaderImageUrl('')}
                className="text-xs text-red-500 font-semibold"
              >
                Remove
              </button>
            )}
          </div>
          {headerImageUrl && (
            <img src={headerImageUrl} alt="Email banner" className="w-full max-h-36 object-cover rounded-xl border border-gray-200" />
          )}
        </div>

        {/* File Attachment Upload */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-foreground block">Default Email Attachment (PDF Flyer, Menu, or Image)</label>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
              {uploadingAsset === 'attachment' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
              Upload Attachment
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => uploadEmailAsset(e.target.files && e.target.files[0], 'attachment')}
              />
            </label>
            {attachmentUrl && (
              <div className="flex items-center gap-2 text-xs bg-green-50 text-[#2E7D32] px-2.5 py-1.5 rounded-lg font-medium">
                <span>{attachmentName || 'Attached file'}</span>
                <button type="button" onClick={() => { setAttachmentUrl(''); setAttachmentName(''); }} className="text-red-500 font-bold">×</button>
              </div>
            )}
          </div>
        </div>

        {/* Stage Selector & Message Editor */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: 'new', label: 'Order Confirmed' },
              { key: 'processing', label: 'Preparing' },
              { key: 'ready', label: 'Ready' },
              { key: 'on_the_way', label: 'Out for Delivery' },
              { key: 'delivered', label: 'Delivered' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setActiveStage(st.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                  activeStage === st.key ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Email Subject</label>
            <input
              value={templates[activeStage]?.subject || ''}
              onChange={(e) =>
                setTemplates((prev) => ({
                  ...prev,
                  [activeStage]: { ...prev[activeStage], subject: e.target.value },
                }))
              }
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#2E7D32] mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Message Body (Tags: {'{{customer_name}}'}, {'{{order_number}}'}, {'{{total}}'}, {'{{address}}'})
            </label>
            <textarea
              rows={3}
              value={templates[activeStage]?.body || ''}
              onChange={(e) =>
                setTemplates((prev) => ({
                  ...prev,
                  [activeStage]: { ...prev[activeStage], body: e.target.value },
                }))
              }
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#2E7D32] mt-1"
            />
          </div>
        </div>
      </div>
<ReviewModerationCard />
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

      {/* First Order Promotion Settings */}
      <div className="mt-8">
        <h1 className="text-xl font-bold text-foreground mb-4">First Order Promotion</h1>
        <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-[#2E7D32]" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Promotion Settings</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure the first-order discount for new customers.
          </p>

          {/* Enable/disable toggle */}
          <div className="flex items-start justify-between py-2 border-b border-gray-50">
            <div className="flex-1 pr-3">
              <p className="text-sm font-semibold text-foreground">First Order Discount</p>
              <p className="text-xs text-muted-foreground mt-0.5">Apply a discount to a customer's first order</p>
            </div>
            <button
              onClick={() => setPromoSettings((p) => ({ ...p, first_order_enabled: !(p?.first_order_enabled !== false) }))}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                promoSettings?.first_order_enabled !== false ? 'bg-[#2E7D32]' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
                promoSettings?.first_order_enabled !== false ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Discount amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">First-order discount (₦)</label>
            <input
              type="number"
              value={promoSettings?.first_order_discount ?? 500}
              onChange={(e) => setPromoSettings((p) => ({ ...p, first_order_discount: parseFloat(e.target.value) || 0 }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSavePromo}
            disabled={savingPromo || !promoSettings}
            className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50"
          >
            {savingPromo ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : promoSaved ? (
              <><CheckCircle2 className="w-4 h-4" /> Settings Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save Promotion Settings</>
            )}
          </button>
        </div>
      </div>

      {/* Delivery fees by area & delivery discounts */}
      <div className="mt-8">
        <h1 className="text-xl font-bold text-foreground mb-4">Delivery Fees & Discounts</h1>
        <DeliveryPricingSettings />
      </div>

      {/* Deal & Discount Broadcast */}
      <div className="mt-8">
        <h1 className="text-xl font-bold text-foreground mb-4">Deal & Discount Broadcasts</h1>

        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-[#2E7D32]" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Broadcast New Alert</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Publish a deal or discount code alert. All users with push notifications enabled will receive it instantly.
          </p>

          {/* Alert type selector */}
          <div className="flex gap-2 mb-3">
            {[
              { key: 'weekly_deal', label: 'Weekly Deal', icon: Tag },
              { key: 'discount_code', label: 'Discount Code', icon: Percent },
              { key: 'announcement', label: 'Announcement', icon: Megaphone },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = alertForm.type === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setAlertForm((f) => ({ ...f, type: opt.key }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                      : 'bg-card text-muted-foreground border-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <input
              value={alertForm.title}
              onChange={(e) => setAlertForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Alert title (e.g. 'Fresh Tomatoes Week Deal!')"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]"
            />
            <textarea
              value={alertForm.body}
              onChange={(e) => setAlertForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Message (e.g. 'Get fresh tomatoes at 20% off this week only!')"
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32] resize-none"
            />
            {alertForm.type === 'discount_code' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={alertForm.voucher_code}
                  onChange={(e) => setAlertForm((f) => ({ ...f, voucher_code: e.target.value }))}
                  placeholder="Code (e.g. FRESH20)"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32] uppercase"
                />
                <input
                  value={alertForm.discount_percent}
                  onChange={(e) => setAlertForm((f) => ({ ...f, discount_percent: e.target.value }))}
                  type="number"
                  placeholder="% off (e.g. 20)"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]"
                />
              </div>
            )}
            <button
              onClick={broadcastAlert}
              disabled={sendingAlert}
              className="w-full h-11 rounded-xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50"
            >
              {sendingAlert ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Broadcast Alert
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing alerts */}
        {alerts.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h2 className="text-sm font-bold text-foreground mb-3">Published Alerts</h2>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-[#2E7D32]/10 flex items-center justify-center shrink-0">
                    {a.type === 'discount_code' ? (
                      <Percent className="w-4 h-4 text-[#2E7D32]" />
                    ) : a.type === 'weekly_deal' ? (
                      <Tag className="w-4 h-4 text-[#2E7D32]" />
                    ) : (
                      <Megaphone className="w-4 h-4 text-[#2E7D32]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{a.body}</p>
                    {a.voucher_code && (
                      <p className="text-[11px] font-bold text-[#2E7D32] mt-0.5">
                        Code: {a.voucher_code} · {a.discount_percent}% off
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAlert(a.id)}
                    className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewModerationCard() {
  const [reviews, setReviews] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editText, setEditText] = React.useState('');

  const loadReviews = async () => {
    const { data } = await supabase
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (Array.isArray(data)) setReviews(data);
  };

  React.useEffect(() => {
    loadReviews();
  }, []);

  const toggleApprove = async (rev) => {
    await supabase
      .from('customer_reviews')
      .update({ is_approved: !rev.is_approved })
      .eq('id', rev.id);
    loadReviews();
  };

  const saveEdit = async (id) => {
    await supabase.from('customer_reviews').update({ text: editText.trim() }).eq('id', id);
    setEditingId(null);
    loadReviews();
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    await supabase.from('customer_reviews').delete().eq('id', id);
    loadReviews();
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Customer Reviews Moderation</h2>
          <p className="text-xs text-muted-foreground">
            Approve, edit, or delete verified buyer reviews before they appear on the Home page.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted">
          {reviews.length} total
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">No submitted reviews yet.</p>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto">
          {reviews.map((r) => (
            <div key={r.id} className="p-3 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-900">{r.customer_name}</span>
                  {r.order_number && (
                    <span className="ml-1.5 text-[11px] font-semibold text-[#2E7D32] bg-green-50 px-2 py-0.5 rounded-full">
                      Order #{r.order_number}
                    </span>
                  )}
                  <div className="text-[11px] text-gray-500">
                    {r.location} · {r.rating}★ {r.customer_contact ? `· ${r.customer_contact}` : ''}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    r.is_approved ? 'bg-green-100 text-[#2E7D32]' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r.is_approved ? 'Visible' : 'Pending'}
                </span>
              </div>

              {editingId === r.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(r.id)}
                      className="px-3 py-1 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold"
                    >
                      Save Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 rounded-lg border text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-700">&ldquo;{r.text}&rdquo;</p>
              )}

              {r.photo_url && (
                <img src={r.photo_url} alt="" className="w-20 h-20 object-cover rounded-lg border" />
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => toggleApprove(r)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold"
                >
                  {r.is_approved ? 'Hide' : 'Approve & Show'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(r.id);
                    setEditText(r.text || '');
                  }}
                  className="px-2.5 py-1 rounded-lg border text-xs font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteReview(r.id)}
                  className="px-2.5 py-1 rounded-lg text-red-600 text-xs font-semibold ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}