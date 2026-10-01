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

  return (
    <div className="p-4 space-y-5">
      {/* Profile photo */}
      <div className="bg-card rounded-2xl border border-border p-5 flex flex-col items-center">
        <div className="relative">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              fittingType="fill"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#2E7D32] flex items-center justify-center text-white">
              <User className="w-10 h-10" />
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center shadow-md cursor-pointer active:scale-90 transition-transform ring-2 ring-white">
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-white" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm font-bold text-[#1a2238] mt-3">
          {user.full_name || 'Ukart User'}
        </p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <p className="text-[11px] text-gray-400 mt-1">JPG, PNG (Max 5MB)</p>
      </div>

      {/* Personal information */}
      <div>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Personal Information
        </h2>
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div>
            <Label className="mb-1.5 block">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 h-12 rounded-xl"
                placeholder="Your full name"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={email}
                disabled
                className="pl-10 h-12 rounded-xl bg-muted/50 text-muted-foreground"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Email cannot be changed. Contact support to update.
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="pl-10 h-12 rounded-xl"
                placeholder="e.g. 0803 123 4567"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Date of Birth</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={dobLocked}
                className="pl-10 h-12 rounded-xl"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {dobLocked
                ? '🔒 Date of birth cannot be changed after a birthday reward has been issued.'
                : 'Used to celebrate your birthday with a special Ukart reward. 🎁'}
            </p>
          </div>
        </div>
      </div>

      {/* Birthday Reward */}
      <BirthdayReward />

      {/* Order history */}
      <div>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Order History
        </h2>
        <OrderHistory />
      </div>

      {/* Change password */}
      <button
        onClick={changePassword}
        className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 active:bg-muted/50"
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-gray-700" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Change Password</p>
          <p className="text-xs text-muted-foreground">We'll email you a reset link</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      <Button
        className="w-full h-12 rounded-xl font-semibold"
        onClick={save}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </>
        )}
      </Button>
    </div>
  );
}