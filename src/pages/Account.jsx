import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  User,
  Phone,
  Mail,
  Camera,
  Calendar,
  Loader2,
  KeyRound,
  Save,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';
import { toast } from '@/components/ui/use-toast';
import OrderHistory from '@/components/account/OrderHistory';
import BirthdayReward from '@/components/account/BirthdayReward';

export default function Account() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dobLocked, setDobLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setFullName(u?.full_name || '');
        setPhone(u?.phone || '');
        setEmail(u?.email || '');
        setDateOfBirth(u?.date_of_birth || '');
        // Lock DOB if a birthday reward exists
        try {
          const rewards = await base44.entities.BirthdayReward.filter({}, { limit: 1 });
          if (rewards.items && rewards.items.length > 0) {
            setDobLocked(true);
          }
        } catch {}
      } catch {}
    })();
  }, []);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const prevAvatar = user.avatar_url;
    const preview = URL.createObjectURL(file);
    setUser((u) => ({ ...u, avatar_url: preview }));
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const u = await base44.auth.updateMe({ avatar_url: file_url });
      setUser(u);
      toast({ title: 'Profile photo updated' });
    } catch {
      setUser((u) => ({ ...u, avatar_url: prevAvatar }));
      toast({ title: 'Could not upload photo', variant: 'destructive' });
    }
    setUploading(false);
  };

  const save = async () => {
    if (!fullName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const u = await base44.auth.updateMe({
        full_name: fullName.trim(),
        phone: phone.trim(),
        date_of_birth: dateOfBirth || undefined,
      });
      setUser(u);
      // Sync CustomerDOB for birthday rewards
      if (dateOfBirth && !dobLocked) {
        try {
          const existing = await base44.entities.CustomerDOB.filter(
            { customer_id: u.id },
            { limit: 1 }
          );
          if (existing.items && existing.items.length > 0) {
            await base44.entities.CustomerDOB.update(existing.items[0].id, {
              date_of_birth: dateOfBirth,
              customer_name: fullName.trim(),
            });
          } else {
            await base44.entities.CustomerDOB.create({
              customer_id: u.id,
              customer_email: u.email,
              customer_name: fullName.trim(),
              date_of_birth: dateOfBirth,
            });
          }
        } catch {}
      }
      toast({ title: 'Profile updated' });
    } catch {
      toast({ title: 'Could not update profile', variant: 'destructive' });
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!email) return;
    try {
      await base44.auth.resetPasswordRequest(email);
      toast({
        title: 'Password reset link sent',
        description: `Check ${email} to reset your password.`,
      });
    } catch {
      toast({ title: 'Could not send reset link', variant: 'destructive' });
    }
  };

  if (!user)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  const fieldLabel = 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';

  return (
    <div className="uk-page space-y-5">
      {/* Profile header */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              fittingType="fill"
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-retail">
              <User className="w-6 h-6" />
            </div>
          )}
          <label className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-retail flex items-center justify-center cursor-pointer active:scale-90 transition-transform ring-2 ring-card">
            {uploading ? (
              <Loader2 className="w-3 h-3 text-retail-foreground animate-spin" />
            ) : (
              <Camera className="w-3 h-3 text-retail-foreground" />
            )}
            <input type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-foreground truncate">
            {user.full_name || 'Ukart User'}
          </p>
          <p className="uk-sub truncate">{user.email}</p>
        </div>
      </div>

      {/* Personal details */}
      <div>
        <p className="uk-section-label mb-2">Personal details</p>
        <div className="space-y-3">
          <div>
            <Label className={fieldLabel}>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 h-10 rounded-lg"
              placeholder="Your full name"
            />
          </div>
          <div>
            <Label className={fieldLabel}>Email address</Label>
            <Input
              value={email}
              disabled
              className="mt-1.5 h-10 rounded-lg bg-muted/50 text-muted-foreground"
            />
          </div>
          <div>
            <Label className={fieldLabel}>Phone number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="mt-1.5 h-10 rounded-lg"
              placeholder="e.g. 0803 123 4567"
            />
          </div>
          <div>
            <Label className={fieldLabel}>Date of birth</Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={dobLocked}
              className="mt-1.5 h-10 rounded-lg"
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {dobLocked
                ? 'Date of birth is locked after a birthday reward has been issued.'
                : 'Used to send you a birthday reward.'}
            </p>
          </div>

          <button onClick={save} disabled={saving} className="uk-btn !h-11 !rounded-lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Account actions */}
      <div>
        <p className="uk-section-label mb-2">Account</p>
        <div className="uk-card divide-y divide-border overflow-hidden">
          <button onClick={changePassword} className="uk-row">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-retail" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold text-foreground">Change password</p>
              <p className="uk-list-sub">We&apos;ll email you a reset link</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </div>
      </div>

      <BirthdayReward />

      <div>
        <p className="uk-section-label mb-2">Order history</p>
        <OrderHistory />
      </div>
    </div>
  );
}