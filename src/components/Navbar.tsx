import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  Target,
  History,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { UserProfile } from "../types.js";

interface NavbarProps {
  currentView:
    "landing" | "dashboard" | "upload" | "analysis" | "history" | "profile";
  onNavigate: (
    view:
      "landing" | "dashboard" | "upload" | "analysis" | "history" | "profile",
  ) => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: "login" | "signup") => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onLoadDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  onLoadDemo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "upload" as const, label: "Analyze Resume", icon: FileText },
    { id: "history" as const, label: "History", icon: History },
  ];

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          id="brand-logo-container"
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                SP ResumAI
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none -mt-0.5">
              ATS Intelligence Platform
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          id="desktop-nav"
          className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? "text-blue-700" : "text-slate-400"}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions / User Area */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Theme Switcher Button */}
          {/* Instant Demo Shortcut */}
          {onLoadDemo && (
            <button
              id="instant-demo-nav-btn"
              onClick={onLoadDemo}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200/80 bg-amber-50/80 text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Sample Profiles</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <button
                id="user-profile-btn"
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  else onNavigate("profile");
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-colors text-left ${
                  currentView === "profile"
                    ? "border-blue-300 bg-blue-50/70"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden lg:block max-w-[130px] truncate">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user.isDemo ? "Demo User" : user.email}
                  </div>
                </div>
              </button>

              <button
                id="logout-btn"
                onClick={onLogout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="login-trigger-btn"
                onClick={() => onOpenAuth("login")}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </button>
              <button
                id="signup-trigger-btn"
                onClick={() => onOpenAuth("signup")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all hover:shadow"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {onLoadDemo && (
              <button
                onClick={() => {
                  onLoadDemo();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Try Demo Resumes</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    onNavigate("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {user.email}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-rose-600 p-2"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onOpenAuth("login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-800"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth("signup");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-blue-600 text-white"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
