import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Lock,
  User,
  Phone,
  Gift,
  Calendar,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const returnTo =
    new URLSearchParams(window.location.search).get("returnTo") || "/";
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim()) {
      setError("Enter your first name");
      return;
    }
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
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        setError("Enter a valid date of birth");
        return;
      }
      if (dob > new Date()) {
        setError("Date of birth cannot be in the future");
        return;
      }
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
          date_of_birth: dateOfBirth || undefined,
          referral_code: referralCode || undefined,
        });
      } catch {}
      try {
        if (dateOfBirth) {
          const me = await base44.auth.me();
          const existing = await base44.entities.CustomerDOB.filter(
            { customer_id: me.id },
            { limit: 1 }
          );
          if (existing.items && existing.items.length > 0) {
            await base44.entities.CustomerDOB.update(existing.items[0].id, {
              date_of_birth: dateOfBirth,
              customer_name: me.full_name,
            });
          } else {
            await base44.entities.CustomerDOB.create({
              customer_id: me.id,
              customer_email: me.email,
              customer_name: me.full_name,
              date_of_birth: dateOfBirth,
            });
          }
        }
      } catch {}
      try {
        const ref = localStorage.getItem("ukart_ref");
        if (ref) {
          await base44.functions.invoke("recordReferral", { referrerId: ref });
          localStorage.removeItem("ukart_ref");
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
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
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
      <AuthShell
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
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
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button
            onClick={handleResend}
            className="text-primary font-medium hover:underline"
          >
            Resend
          </button>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      showBack
      title="Create your Ukart account"
      subtitle="Let's get you shopping."
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium rounded-xl mb-4"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground uppercase tracking-wide">
            or
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Adaeze"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-9 h-12 rounded-xl"
                required
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Last Name</Label>
            <Input
              placeholder="Okafor"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="e.g. 0803 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Date of Birth</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              max={todayStr}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Used to celebrate your birthday with a special Ukart reward. 🎁
          </p>
        </div>
        <div>
          <Label className="mb-1.5 block">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Toggle password"
            >
              {showPwd ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Referral Code (optional)</Label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
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
            className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label
            htmlFor="terms"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            I agree to the{" "}
            <span className="text-primary font-medium">
              Terms & Conditions
            </span>{" "}
            and{" "}
            <span className="text-primary font-medium">Privacy Policy</span>.
          </Label>
        </div>
        <Button
          type="submit"
          className="w-full h-12 font-semibold rounded-xl text-base"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}