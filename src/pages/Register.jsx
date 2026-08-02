import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Gift,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agree) {
      setError("Please accept the Terms & Conditions and Privacy Policy");
      return;
    }
    if (phone && !/^\+?[0-9\s-]{7,}$/.test(phone)) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      localStorage.removeItem("ukart_guest");
      await base44.auth.register({ email, password, full_name: fullName });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      try {
        await base44.auth.updateMe({
          phone,
          referral_code: referralCode || undefined,
        });
      } catch {}
      try {
        const ref = localStorage.getItem('ukart_ref');
        if (ref) {
          const me = await base44.auth.me();
          const existing = await base44.entities.Referral.filter({ referred_user_id: me.id });
          if (existing.length === 0) {
            await base44.entities.Referral.create({
              referrer_id: ref,
              referred_user_id: me.id,
              referred_email: me.email,
              status: 'pending',
              reward_amount: 1000,
            });
          }
          localStorage.removeItem('ukart_ref');
        }
      } catch {}
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    localStorage.removeItem("ukart_guest");
    base44.auth.loginWithProvider("google", returnTo);
  };

  if (showOtp) {
    return (
      <div className="min-h-screen flex flex-col bg-white max-w-md mx-auto">
        <div className="bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65] px-6 pt-14 pb-12 rounded-b-[2.5rem] shadow-lg">
          <div className="flex flex-col items-center text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-4">
              <Mail className="w-8 h-8 text-[#1B5E20]" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="text-sm text-white/90 mt-1.5">We sent a code to {email}</p>
          </div>
        </div>
        <div className="flex-1 px-6 -mt-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            )}
            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                autoFocus
                autoComplete="one-time-code"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              className="w-full h-12 font-semibold rounded-xl"
              onClick={handleVerify}
              disabled={loading || otpCode.length < 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Didn't receive the code?{" "}
              <button
                onClick={handleResend}
                className="text-[#2E7D32] font-medium hover:underline"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-md mx-auto">
      <div className="bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65] px-6 pt-14 pb-12 rounded-b-[2.5rem] shadow-lg">
        <div className="flex flex-col items-center text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8 text-[#1B5E20]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-white/90 mt-1.5">Join Ukart. No Market Wahala.</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium rounded-xl"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 uppercase">or</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullname">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="fullname"
                  placeholder="e.g. Adaeze Okafor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0803 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referral">Referral Code (optional)</Label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="referral"
                  placeholder="Enter code if you have one"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="terms"
                checked={agree}
                onCheckedChange={setAgree}
                className="mt-0.5 data-[state=checked]:bg-[#2E7D32] data-[state=checked]:border-[#2E7D32]"
              />
              <Label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                I agree to the{" "}
                <span className="text-[#2E7D32] font-medium">Terms & Conditions</span> and{" "}
                <span className="text-[#2E7D32] font-medium">Privacy Policy</span>.
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full h-12 font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#2E7D32] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}