import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useTheme } from 'next-themes';
import { Moon, Sun, Globe, LogOut, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
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

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'pid', label: 'Pidgin' },
  { value: 'ha', label: 'Hausa' },
  { value: 'ig', label: 'Igbo' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const [lang, setLang] = useState(() => localStorage.getItem('ukart_lang') || 'en');
  const [busy, setBusy] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const changeLang = async (value) => {
    setLang(value);
    localStorage.setItem('ukart_lang', value);
    try {
      await base44.auth.updateMe({ language: value });
    } catch {}
  };

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
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
            {dark ? <Moon className="w-5 h-5 text-[#2E7D32]" /> : <Sun className="w-5 h-5 text-[#2E7D32]" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Dark Mode</p>
            <p className="text-xs text-gray-500">Switch between light and dark themes</p>
          </div>
          <Switch checked={dark} onCheckedChange={() => setTheme(dark ? 'light' : 'dark')} />
        </div>

        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#2E7D32]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Language</p>
            <p className="text-xs text-gray-500">Choose your preferred language</p>
          </div>
          <Drawer open={langOpen} onOpenChange={setLangOpen}>
            <DrawerTrigger asChild>
              <button className="flex items-center gap-1 text-sm font-medium text-gray-900 px-3 h-9 rounded-xl border border-gray-100 active:scale-95 transition-transform">
                {LANGUAGES.find((l) => l.value === lang)?.label || 'English'}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>Choose language</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8 space-y-1">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { changeLang(l.value); setLangOpen(false); }}
                    className={`w-full text-left text-sm px-4 py-3 rounded-xl ${lang === l.value ? 'bg-[#2E9E44]/10 font-semibold text-[#1B7F3A]' : 'text-gray-700 active:bg-gray-50'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <button
          onClick={logout}
          disabled={busy}
          className="w-full flex items-center gap-3 p-4 active:bg-gray-50 disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-gray-700" />
          </div>
          <span className="text-sm font-semibold text-gray-900 flex-1 text-left">Log Out</span>
          {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 p-4 active:bg-gray-50">
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

      <p className="text-center text-xs text-gray-400 px-6">
        Language translation is being rolled out gradually. Your preference is saved for when it
        becomes available.
      </p>
    </div>
  );
}