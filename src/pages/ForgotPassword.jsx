import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthShell
      showBack
      icon={Mail}
      title="Forgot your password?"
      subtitle="No worries. Enter your email and we'll send you a secure reset link."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-[#2E7D32] font-medium hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-14 h-14 rounded-full bg-[#EEF8EE] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-[#2E7D32]" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
            If an account exists with that email, you'll receive a password
            reset link shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 font-semibold rounded-xl text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send reset link <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}