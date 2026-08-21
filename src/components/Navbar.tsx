import React from "react";
import { History, Sparkles, FileText, ArrowLeft, RefreshCw } from "lucide-react";

interface NavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
  currentView: "upload" | "analysis";
  onNewAnalysis?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  historyCount,
  onOpenHistory,
  currentView,
  onNewAnalysis,
}) => {
  return (
    <header className="w-full border-b border-[#242A35] bg-[#0E1117]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div
            onClick={onNewAnalysis}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#6366F1] flex items-center justify-center text-white shadow-lg shadow-[#6366F1]/20 group-hover:bg-[#4F46E5] transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold tracking-tight text-[#F5F7FA]">
                  SP ResumAI
                </span>
                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
                  ATS Pro
                </span>
              </div>
              <p className="text-[11px] text-[#8B93A1] hidden sm:block">
                Analyze your resume against your target role
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {currentView === "analysis" && onNewAnalysis && (
            <button
              id="nav-new-analysis-btn"
              onClick={onNewAnalysis}
              className="px-3.5 py-1.5 rounded-lg border border-[#242A35] hover:border-[#6366F1] bg-[#161B22] text-[#F5F7FA] text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#818CF8]" />
              <span className="hidden sm:inline">Analyze Another</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          <button
            id="nav-history-btn"
            onClick={onOpenHistory}
            className="px-3.5 py-1.5 rounded-lg border border-[#242A35] hover:border-[#384152] bg-[#161B22] hover:bg-[#1E2530] text-[#F5F7FA] text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer relative"
          >
            <History className="w-4 h-4 text-[#8B93A1]" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#6366F1] text-white text-[11px] font-semibold">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
