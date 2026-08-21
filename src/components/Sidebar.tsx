import React from "react";
import {
  FileText,
  Brain,
  History,
  LogIn,
  LogOut,
} from "lucide-react";
import { UserProfile } from "../types.js";

interface SidebarProps {
  currentView:
    | "landing"
    | "dashboard"
    | "upload"
    | "analysis"
    | "history";
  onNavigate: (
    view:
      | "landing"
      | "dashboard"
      | "upload"
      | "analysis"
      | "history",
  ) => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: "login" | "signup") => void;
  onLogout: () => void;
  onLoadDemo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onLoadDemo,
}) => {
  const navItems = [
    { id: "upload" as const, label: "Resume Analyzer", icon: FileText },
    { id: "history" as const, label: "History", icon: History },
    {
      id: "auth" as const,
      label: user ? "Logout" : "Login",
      icon: user ? LogOut : LogIn,
    },
  ];

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[#101318] border-r border-[#242A35] flex flex-col h-screen">
      {/* Brand Logo */}
      <div
        className="p-6 flex items-center gap-3 cursor-pointer mt-2"
        onClick={() => onNavigate("landing")}
      >
        <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center shrink-0 border border-[#6366F1]/20">
          <Brain className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[15px] text-[#F5F7FA] leading-tight">
            SP RESUMAI
          </span>
          <span className="text-[11px] text-[#8B93A1]">
            AI Resume Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-2 space-y-1 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Highlight based on currentView (or fallback mapping)
          let isActive = false;
          if (
            item.id === "upload" &&
            (currentView === "upload" ||
              currentView === "analysis" ||
              currentView === "landing")
          )
            isActive = true;
          if (item.id === "history" && currentView === "history")
            isActive = true;

          const handleClick = () => {
            if (item.id === "history") onNavigate("history");
            else if (item.id === "auth") {
              if (user) onLogout();
              else onOpenAuth("login");
            } else onNavigate("upload");
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-[#6366F1]/10 text-[#F5F7FA]"
                  : "text-[#8B93A1] hover:bg-[#151922] hover:text-[#F5F7FA]"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-[#6366F1]" : "text-[#8B93A1]"
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
