import React from "react";
import {
  FileText,
  Brain,
  Home,
} from "lucide-react";

interface SidebarProps {
  currentView:
    | "landing"
    | "upload"
    | "analysis";
  onNavigate: (
    view:
      | "landing"
      | "upload"
      | "analysis",
  ) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
}) => {
  const navItems = [
    { id: "landing" as const, label: "Home", icon: Home },
    { id: "upload" as const, label: "Resume Analyzer", icon: FileText },
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
          let isActive = false;
          if (item.id === "landing" && currentView === "landing") {
            isActive = true;
          } else if (
            item.id === "upload" &&
            (currentView === "upload" || currentView === "analysis")
          ) {
            isActive = true;
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
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
