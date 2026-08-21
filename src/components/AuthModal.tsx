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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 :text-slate-200 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {tab === "signup"
              ? "Create SP ResumAI Account"
              : tab === "forgot"
                ? "Reset Password"
                : "Sign In to SP ResumAI"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {tab === "signup"
              ? "Get unlimited ATS analyses, job matches, and history tracking."
              : tab === "forgot"
                ? "Enter your email to receive recovery instructions."
                : "Access your saved resumes and personalized ATS optimization reports."}
          </p>
        </div>

        {/* Quick Demo Login Option */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-5 py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors shadow-xs"
        >
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Instant 1-Click Demo Login (No Signup Needed)</span>
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200 "></div>
          <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            or continue with email
          </span>
          <div className="flex-grow border-t border-slate-200 "></div>
        </div>

        {/* Tabs for Login / Signup */}
        {tab !== "forgot" && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === "login"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
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
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === "signup"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 ">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jordan Taylor"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {tab !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700 ">
                  Password
                </label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab("forgot");
                      setError(null);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
