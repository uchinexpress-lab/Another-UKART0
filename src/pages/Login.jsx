import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ShoppingBag, ChevronRight } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { enterGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
  }, []);

  const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";

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
    <div className="min-h-screen flex flex-col bg-white max-w-md mx-auto">
      <div className="bg-gradient-to-br from-[#1B7F3A] via-[#2E9E44] to-[#5FCF65] px-6 pt-14 pb-12 rounded-b-[2.5rem] shadow-lg">
        <div className="flex flex-col items-center text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8 text-[#1B5E20]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Ukart</h1>
          <p className="text-sm text-white/90 mt-1.5 max-w-xs">
            No Market Wahala. Fresh groceries delivered to your doorstep.
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-3">
          {isIOS && (
            <Button
              variant="outline"
              className="w-full h-12 text-sm font-medium rounded-xl"
              onClick={handleApple}
            >
              <AppleIcon className="w-5 h-5 mr-2" />
              Continue with Apple
            </Button>
          )}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#2E7D32] font-medium hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
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
            <Button
              type="submit"
              className="w-full h-12 font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#2E7D32] font-semibold hover:underline">
            Create Account
          </Link>
        </p>

        <button
          onClick={handleGuest}
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm font-medium text-gray-500 hover:text-[#2E7D32] transition-colors"
        >
          Continue as Guest <ChevronRight className="w-4 h-4" />
        </button>
        <p className="text-center text-xs text-gray-400 mt-1.5 px-4">
          Browse products freely. Sign in to place an order.
        </p>
      </div>
    </div>
  );
}