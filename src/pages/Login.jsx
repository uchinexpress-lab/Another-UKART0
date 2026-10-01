import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import AuthShell from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const { enterGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
  }, []);

  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      localStorage.removeItem("ukart_guest");
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    localStorage.removeItem("ukart_guest");
    base44.auth.loginWithProvider("google", returnTo);
  };

  const handleApple = () => {
    localStorage.removeItem("ukart_guest");
    base44.auth.loginWithProvider("apple", returnTo);
  };

  const handleGuest = () => {
    enterGuest();
    navigate("/");
  };

  return (
    <AuthShell
      title="Welcome back 👋"
      subtitle="Fresh groceries are just a few taps away."
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {isIOS && (
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium rounded-xl mb-3"
          onClick={handleApple}
        >
          <AppleIcon className="w-5 h-5 mr-2" />
          Continue with Apple
        </Button>
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
        <div>
          <Label className="mb-1.5 block">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
          <div className="flex items-center justify-between mb-1.5">
            <Label>Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary font-medium hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
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
        <Button
          type="submit"
          className="w-full h-12 font-semibold rounded-xl text-base"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Log In <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-primary font-semibold hover:underline"
        >
          Create Account
        </Link>
      </p>

      <button
        onClick={handleGuest}
        className="w-full mt-3 flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        Continue as Guest <ChevronRight className="w-4 h-4" />
      </button>
    </AuthShell>
  );
}