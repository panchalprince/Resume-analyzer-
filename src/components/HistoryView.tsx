import React, { useState, useEffect } from "react";
import {
  History,
  Trash2,
  Eye,
  FileText,
  Search,
  Sparkles,
  Calendar,
  AlertCircle,
  Download,
  Target,
  ArrowRight,
} from "lucide-react";
import { ResumeAnalysisResult } from "../types.js";
import { formatDate, getScoreColor } from "../lib/utils.js";

interface HistoryViewProps {
  userId?: string;
  onSelectAnalysis: (analysis: ResumeAnalysisResult) => void;
  onStartNewAnalysis: () => void;
  onShowToast: (title: string, message?: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  userId,
  onSelectAnalysis,
  onStartNewAnalysis,
  onShowToast,
}) => {
  const [analyses, setAnalyses] = useState<ResumeAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analyses?userId=${userId || "demo-user-123"}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAnalyses(data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/analyses/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId || "demo-user-123" }),
      });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
        setDeleteConfirmId(null);
        onShowToast("Analysis Removed", "Report deleted successfully.", "info");
      }
    } catch {
      onShowToast("Error", "Could not delete analysis record.", "error");
    }
  };

  const filtered = analyses.filter((a) =>
    a.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.targetRole && a.targetRole.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div id="history-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Resume Analysis History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your ATS score progress and review past resume optimization reports.
          </p>
        </div>

        <button
          onClick={onStartNewAnalysis}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upload New Resume</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by resume filename or target role..."
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* History List or Empty State */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading analysis history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchTerm ? "No matching analyses found" : "No resume analyses yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm
                ? "Try searching with a different filename or keyword."
                : "Upload your resume or load a sample preset to generate your first ATS score."}
            </p>
          </div>
          <button
            onClick={onStartNewAnalysis}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Analyze Resume Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => {
            const colors = getScoreColor(item.atsScore);
            const isConfirmingDelete = deleteConfirmId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Score circle badge */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-lg shrink-0 border ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    <span>{item.atsScore}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      ATS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.filename}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(item.createdAt)}
                      </span>
                      {item.targetRole && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {item.targetRole}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${colors.badge}`}>
                        {item.scoreTier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onSelectAnalysis(item)}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Analysis</span>
                  </button>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2.5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
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
