import React, { useState } from "react";
import {
  History,
  X,
  Trash2,
  Calendar,
  Briefcase,
  ChevronRight,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";
import { ResumeHistoryItem, ResumeAnalysisResult } from "../types.js";
import { ConfirmationModal } from "./ConfirmationModal.js";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: ResumeHistoryItem[];
  onSelectAnalysis: (analysis: ResumeAnalysisResult) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  historyItems,
  onSelectAnalysis,
  onDeleteHistoryItem,
  onClearAllHistory,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case "Excellent":
      case "Elite (90-100)":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Strong":
      case "Strong (75-89)":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      case "Good":
      case "Fair (60-74)":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recent";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs">
        <div className="bg-[#12161E] border border-[#242A35] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-[#242A35] flex items-center justify-between bg-[#161B22]/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 text-[#818CF8] flex items-center justify-center border border-[#6366F1]/20">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#F5F7FA]">
                  Analysis History
                </h3>
                <p className="text-[12px] text-[#8B93A1]">
                  Temporary session storage on this device
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {historyItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#242A35] hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#8B93A1] hover:text-[#F5F7FA] hover:bg-[#21262D] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of History Items */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3.5">
            {historyItems.length === 0 ? (
              <div className="text-center py-14 px-4">
                <div className="w-12 h-12 rounded-xl bg-[#1E2530] text-[#8B93A1] flex items-center justify-center mx-auto mb-3.5 border border-[#242A35]">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#F5F7FA] mb-1">
                  No Past Analyses Found
                </h4>
                <p className="text-[13px] text-[#8B93A1] max-w-sm mx-auto">
                  When you upload and analyze resumes, your results will be stored
                  locally right here for easy comparison during your session.
                </p>
              </div>
            ) : (
              historyItems.map((item) => {
                const score = item.overallScore || item.atsScore || 75;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#242A35] bg-[#161B22] hover:border-[#6366F1]/50 hover:bg-[#1A202C] transition-all group relative"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-[#F5F7FA] truncate">
                            {item.targetRole}
                          </span>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTierColor(
                              item.scoreTier,
                            )}`}
                          >
                            {item.scoreTier || "Good"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-[#8B93A1] flex-wrap">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-[#6366F1]" />
                            {item.filename}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Score Circle / Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#F5F7FA]">
                            {score}
                          </span>
                          <span className="text-[11px] text-[#8B93A1]">/100</span>
                        </div>
                      </div>
                    </div>

                    {item.summary && (
                      <p className="text-[12px] text-[#8B93A1] line-clamp-2 mb-3 bg-[#0E1117] p-2.5 rounded-lg border border-[#242A35]">
                        {item.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                        className="text-[12px] text-[#8B93A1] hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectAnalysis(item.analysis);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Open Report</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="px-6 py-3 border-t border-[#242A35] bg-[#161B22]/50 text-[11px] text-[#8B93A1] flex items-center justify-between">
            <span>
              {historyItems.length} {historyItems.length === 1 ? "analysis" : "analyses"} saved locally
            </span>
            <span>No account or login required</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing History */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear Analysis History?"
        message="This will remove all saved resume analyses from your local browser storage. This action cannot be undone."
        confirmLabel="Clear All History"
        isDestructive={true}
        onConfirm={() => {
          onClearAllHistory();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
};
