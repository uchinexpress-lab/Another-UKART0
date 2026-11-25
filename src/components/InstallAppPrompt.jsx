import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

const DISMISS_KEY = 'ukart_install_prompt_dismissed_at';
const DISMISS_DAYS = 7;

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Hide if already installed as standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // 2. Hide if dismissed within the last 7 days
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400000) {
        return;
      }
    } catch {}

    // 3. Only show on mobile/tablet screens
    const ua = window.navigator.userAgent || '';
    const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/i.test(ua);
    if (!isIos && !isAndroid) return;

    // Android / Chrome native install event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Safari fallback banner after 2.5 seconds
    let iosTimer;
    if (isIos) {
      iosTimer = setTimeout(() => {
        setShowIosGuide(true);
        setVisible(true);
      }, 2500);
    }

    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed left-3 right-3 bottom-20 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xl flex items-start gap-3">
        <img
          src="/ukart-logo.webp"
          alt="Ukart"
          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-border"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">
                Install the Ukart App
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Faster checkout, live rider tracking &amp; instant order alerts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close install banner"
              className="p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {showIosGuide ? (
            <div className="mt-2.5 bg-secondary/70 rounded-xl px-2.5 py-2 text-[11px] text-foreground flex items-center flex-wrap gap-1.5">
              <span>Tap</span>
              <span className="inline-flex items-center gap-0.5 font-bold text-[#2E7D32]">
                <Share className="w-3.5 h-3.5" /> Share
              </span>
              <span>then</span>
              <span className="inline-flex items-center gap-0.5 font-bold text-[#2E7D32]">
                <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="mt-2.5 w-full py-2 px-3 rounded-xl bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
            >
              <Download className="w-3.5 h-3.5" /> Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
