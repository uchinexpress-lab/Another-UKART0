import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, LogOut, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await base44.auth.logout('/');
    } catch {
      window.location.href = '/';
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await base44.auth.updateMe({ deletion_requested: true });
    } catch {}
    try {
      await base44.auth.logout('/');
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-card rounded-2xl border border-border divide-y divide-gray-50">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sun className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Appearance</p>
              <p className="text-xs text-muted-foreground">Choose light, dark, or system theme</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'light', label: 'Light', icon: Sun },
              { key: 'dark', label: 'Dark', icon: Moon },
              { key: 'system', label: 'System', icon: Monitor },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = (theme || 'system') === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border active:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="bg-card rounded-2xl border border-border divide-y divide-gray-50">
        <button
          onClick={logout}
          disabled={busy}
          className="w-full flex items-center gap-3 p-4 active:bg-muted/50 disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <LogOut className="w-5 h-5 text-gray-700" />
          </div>
          <span className="text-sm font-semibold text-foreground flex-1 text-left">Log Out</span>
          {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 p-4 active:bg-muted/50">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm font-semibold text-red-600 flex-1 text-left">
                Delete Account
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md mx-auto rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will submit a deletion request and log you out. Your data will be reviewed
                and removed by our team. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAccount}
                disabled={busy}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {busy ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

    </div>
  );
}