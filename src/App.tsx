import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar.js";
import { ResumeUpload } from "./components/ResumeUpload.js";
import { AnalysisDashboard } from "./components/AnalysisDashboard.js";
import { HistoryModal } from "./components/HistoryModal.js";
import { ToastContainer, ToastMessage } from "./components/ToastContainer.js";
import { ResumeAnalysisResult, ResumeHistoryItem } from "./types.js";
import {
  getStoredHistory,
  saveAnalysisToHistory,
  deleteStoredHistoryItem,
  clearAllStoredHistory,
} from "./lib/history.js";

type ViewMode = "upload" | "analysis";

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<ViewMode>("upload");

  // Active Analysis state
  const [currentAnalysis, setCurrentAnalysis] =
    useState<ResumeAnalysisResult | null>(null);

  // Temporary browser history state
  const [historyItems, setHistoryItems] = useState<ResumeHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Toast Notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load history from localStorage on initial load
  useEffect(() => {
    const loaded = getStoredHistory();
    setHistoryItems(loaded);
  }, []);

  const showToast = (
    title: string,
    message?: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAnalysisComplete = (result: ResumeAnalysisResult) => {
    setCurrentAnalysis(result);
    setCurrentView("analysis");

    // Automatically persist to temporary browser history
    const updatedHistory = saveAnalysisToHistory(result);
    setHistoryItems(updatedHistory);

    showToast(
      "Analysis Complete!",
      `Match Score: ${result.overallScore || result.atsScore}/100 calculated for ${result.targetRole || "target role"}.`,
      "success",
    );
  };

  const handleSelectHistoryItem = (analysis: ResumeAnalysisResult) => {
    setCurrentAnalysis(analysis);
    setCurrentView("analysis");
    showToast(
      "Report Loaded",
      `Viewing analysis for ${analysis.targetRole || "target role"}.`,
      "info",
    );
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteStoredHistoryItem(id);
    setHistoryItems(updated);
    showToast("History Item Removed", "Item deleted from session history.", "info");
  };

  const handleClearAllHistory = () => {
    clearAllStoredHistory();
    setHistoryItems([]);
    showToast("History Cleared", "All temporary analyses have been removed.", "info");
  };

  return (
    <div
      id="sp-resumai-root"
      className="min-h-screen bg-[#0E1117] text-[#F5F7FA] flex flex-col font-sans selection:bg-[#6366F1]/30 selection:text-white"
    >
      {/* Top Navbar */}
      <Navbar
        historyCount={historyItems.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        currentView={currentView}
        onNewAnalysis={() => setCurrentView("upload")}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentView === "upload" && (
          <ResumeUpload
            onAnalysisComplete={handleAnalysisComplete}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        )}

        {currentView === "analysis" && currentAnalysis && (
          <AnalysisDashboard
            analysis={currentAnalysis}
            onNewAnalysis={() => setCurrentView("upload")}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Temporary History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
        onSelectAnalysis={handleSelectHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearAllHistory={handleClearAllHistory}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
