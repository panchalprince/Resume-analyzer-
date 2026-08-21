import React, { useState } from "react";
import {
  X,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { UserProfile } from "../types.js";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialTab?: "login" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = "login",
}) => {
  const [tab, setTab] = useState<"login" | "signup" | "forgot">(initialTab);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || "Failed to log in as demo user.");
      }
    } catch {
      setError("Network error while connecting to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (tab === "forgot") {
      setSuccessMsg(`Password reset instructions sent to ${email}`);
      return;
    }

    if (tab === "signup" && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    const endpoint = tab === "signup" ? "/api/auth/signup" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(data.user);
        onClose();
      } else {
        setError(
          data.error || "Authentication failed. Please check credentials.",
        );
      }
    } catch {
      setError("Network error during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D10]/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-[#151922] rounded-xl border border-[#242A35] shadow-2xl p-8 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8B93A1] hover:text-[#F5F7FA] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-[#6366F1]/10 text-[#6366F1] mx-auto flex items-center justify-center mb-4 border border-[#6366F1]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-medium text-[#F5F7FA] tracking-tight">
            {tab === "signup"
              ? "Create Account"
              : tab === "forgot"
                ? "Reset Password"
                : "Welcome Back"}
          </h3>
          <p className="text-[13px] text-[#8B93A1] mt-2">
            {tab === "signup"
              ? "Join SP ResumAI for unlimited ATS analyses."
              : tab === "forgot"
                ? "Enter your email to receive recovery instructions."
                : "Sign in to access your saved resume reports."}
          </p>
        </div>

        {/* Quick Demo Login Option */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-6 py-2.5 px-4 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#F59E0B]/20 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>Instant Demo Login (No Signup)</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[#242A35]"></div>
          <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-[#8B93A1]">
            or continue with email
          </span>
          <div className="flex-grow border-t border-[#242A35]"></div>
        </div>

        {/* Tabs for Login / Signup */}
        {tab !== "forgot" && (
          <div className="grid grid-cols-2 p-1 bg-[#101318] rounded-lg mb-6 border border-[#242A35]">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`py-2 text-[13px] font-medium rounded-md transition-all ${
                tab === "login"
                  ? "bg-[#242A35] text-[#F5F7FA]"
                  : "text-[#8B93A1] hover:text-[#F5F7FA]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError(null);
              }}
              className={`py-2 text-[13px] font-medium rounded-md transition-all ${
                tab === "signup"
                  ? "bg-[#242A35] text-[#F5F7FA]"
                  : "text-[#8B93A1] hover:text-[#F5F7FA]"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[13px] text-[#EF4444]">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 text-[13px] text-[#22C55E] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "signup" && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8B93A1] mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8B93A1] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jordan Taylor"
                  className="w-full pl-11 pr-4 py-2.5 text-[13px] rounded-lg border border-[#242A35] bg-[#101318] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#8B93A1]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8B93A1] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8B93A1] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-2.5 text-[13px] rounded-lg border border-[#242A35] bg-[#101318] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#8B93A1]"
              />
            </div>
          </div>

          {tab !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8B93A1]">
                  Password
                </label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab("forgot");
                      setError(null);
                    }}
                    className="text-[11px] text-[#6366F1] hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8B93A1] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 text-[13px] rounded-lg border border-[#242A35] bg-[#101318] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#8B93A1]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {tab === "signup"
                    ? "Create Account"
                    : tab === "forgot"
                      ? "Send Recovery Link"
                      : "Sign In"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {tab === "forgot" && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-[12px] font-medium text-[#6366F1] hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
