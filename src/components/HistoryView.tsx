import React, { useState, useEffect } from "react";
import {
  History,
  Trash2,
  Eye,
  FileText,
  Search,
  Sparkles,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { ResumeAnalysisResult } from "../types.js";
import { formatDate } from "../lib/utils.js";
import { apiGetAnalyses, apiDeleteAnalysis } from "../lib/api.js";

interface HistoryViewProps {
  userId?: string;
  onSelectAnalysis: (analysis: ResumeAnalysisResult) => void;
  onStartNewAnalysis: () => void;
  onShowToast: (
    title: string,
    message?: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  userId,
  onSelectAnalysis,
  onStartNewAnalysis,
  onShowToast,
}) => {
  const [analyses, setAnalyses] = useState<ResumeAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGetAnalyses(userId || "demo-user-123");
      setAnalyses(data);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteAnalysis(id, userId || "demo-user-123");
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
      onShowToast("Analysis Removed", "Report deleted successfully.", "info");
    } catch {
      onShowToast("Error", "Could not delete analysis record.", "error");
    }
  };

  const filtered = analyses.filter(
    (a) =>
      a.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.targetRole &&
        a.targetRole.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const isDemo = userId?.startsWith("demo") || !userId;

  return (
    <div
      id="history-page"
      className="max-w-6xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F7FA] tracking-tight">
            Resume Analysis History
          </h1>
          <p className="text-[14px] text-[#8B93A1] mt-1">
            Review your past resume optimization reports.
          </p>
        </div>

        <button
          onClick={onStartNewAnalysis}
          className="px-6 py-2.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upload Resume</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-md">
        <Search className="w-4 h-4 text-[#8B93A1] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by filename or role..."
          className="w-full pl-11 pr-4 py-2.5 text-[13px] rounded-lg border border-[#242A35] bg-[#101318] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#8B93A1]"
          disabled={isDemo || loading || error || (analyses.length === 0 && !searchTerm)}
        />
      </div>

      {/* History List or Empty State */}
      {isDemo ? (
        <div className="p-12 text-center bg-[#151922] rounded-xl border border-[#242A35]">
          <div className="w-12 h-12 rounded-xl bg-[#101318] text-[#8B93A1] mx-auto flex items-center justify-center border border-[#242A35] mb-4">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-medium text-[#F5F7FA] mb-1">
            Demo History Unavailable
          </h3>
          <p className="text-[13px] text-[#8B93A1] mb-6">
            History is disabled in Demo Mode. Sign in to save your resume analyses.
          </p>
        </div>
      ) : loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-[#8B93A1]">Loading history...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-[#151922] rounded-xl border border-[#242A35]">
          <div className="w-12 h-12 rounded-xl bg-[#101318] text-[#EF4444] mx-auto flex items-center justify-center border border-[#242A35] mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-medium text-[#F5F7FA] mb-1">
            Unable to load history
          </h3>
          <button
            onClick={fetchHistory}
            className="px-5 py-2 mt-4 rounded-lg bg-transparent border border-[#242A35] text-[#F5F7FA] text-[13px] font-medium hover:bg-[#242A35] transition-colors inline-flex items-center gap-2"
          >
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#151922] rounded-xl border border-[#242A35]">
          <div className="w-12 h-12 rounded-xl bg-[#101318] text-[#8B93A1] mx-auto flex items-center justify-center border border-[#242A35] mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-medium text-[#F5F7FA] mb-1">
            {searchTerm ? "No matching analyses" : "No Resume History"}
          </h3>
          <p className="text-[13px] text-[#8B93A1] mb-6">
            {searchTerm
              ? "Try searching with a different term."
              : "Analyze your first resume to see your results here."}
          </p>
          {!searchTerm && (
            <button
              onClick={onStartNewAnalysis}
              className="px-5 py-2 rounded-lg bg-transparent border border-[#242A35] text-[#F5F7FA] text-[13px] font-medium hover:bg-[#242A35] transition-colors inline-flex items-center gap-2"
            >
              <span>Analyze Resume</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => {
            const isConfirmingDelete = deleteConfirmId === item.id;
            const scoreColor = getScoreColor(item.atsScore);

            return (
              <div
                key={item.id}
                className="bg-[#151922] rounded-xl border border-[#242A35] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:border-[#6366F1]/50"
              >
                <div className="flex items-center gap-4">
                  {/* Score circle badge */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                     <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="#242A35"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke={scoreColor}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 45}
                          strokeDashoffset={(2 * Math.PI * 45) - (item.atsScore / 100) * (2 * Math.PI * 45)}
                        />
                      </svg>
                      <span className="text-[13px] font-semibold text-[#F5F7FA] z-10">{item.atsScore}</span>
                  </div>

                  <div>
                    <h3 className="text-[14px] font-medium text-[#F5F7FA] mb-1">
                      {item.filename}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#8B93A1]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      {item.targetRole && (
                        <>
                          <span>•</span>
                          <span className="text-[#F5F7FA]">
                            {item.targetRole}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => onSelectAnalysis(item)}
                    className="px-4 py-2 text-[13px] font-medium rounded-lg bg-[#101318] border border-[#242A35] text-[#F5F7FA] hover:bg-[#242A35] flex items-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-[#8B93A1]" />
                    <span>View</span>
                  </button>

                  {isConfirmingDelete ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="text-right sm:text-left text-[12px]">
                        <span className="block font-medium text-[#EF4444]">Delete this analysis?</span>
                        <span className="text-[#8B93A1]">This action cannot be undone.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-4 py-2 text-[13px] font-medium rounded-lg border border-[#242A35] text-[#F5F7FA] hover:bg-[#242A35]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-4 py-2 text-[13px] font-medium rounded-lg bg-[#EF4444] text-white hover:bg-[#DC2626]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-2 text-[#8B93A1] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                      title="Delete Analysis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
