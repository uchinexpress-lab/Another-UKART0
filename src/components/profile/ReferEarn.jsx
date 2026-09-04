import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Copy, Share2, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function ReferEarn() {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => {
        if (u?.id) setLink(`${window.location.origin}/?ref=${u.id}`);
      })
      .catch(() => {});
  }, []);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const share = async () => {
    if (!link) return;
    const text = `Shop groceries on Ukart and we both get ₦1,000 off our next order! Use my link: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ukart Referral", text, url: link });
      } catch {}
    } else {
      copy();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 p-4 text-white shadow-sm" style={{ background: "linear-gradient(135deg, #1B7F3A, #2E9E44)" }}>
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-10 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5" />
          <h2 className="font-bold text-base">Refer & Earn</h2>
        </div>
        <p className="text-xs text-white/90 leading-relaxed mb-3">
          Share your link with friends. When they place their first order, you{" "}
          <span className="font-bold">both get ₦1,000 off</span> your next purchase.
        </p>
        <div className="flex items-center gap-2 bg-white/15 rounded-xl p-1.5 backdrop-blur-sm">
          <input
            readOnly
            value={link}
            placeholder="Generating your link…"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/70 outline-none truncate px-1"
          />
          <button
            onClick={copy}
            disabled={!link}
            className="shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            aria-label="Copy link"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={share}
          disabled={!link}
          className="w-full mt-2 bg-white text-[#2E7D32] text-sm font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
        >
          <Share2 className="w-4 h-4" /> Share Link
        </button>
      </div>
    </div>
  );
}