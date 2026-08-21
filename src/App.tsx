import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.js";
import { LandingPage } from "./components/LandingPage.js";
import { ResumeUpload } from "./components/ResumeUpload.js";
import { AnalysisDashboard } from "./components/AnalysisDashboard.js";
import { HistoryView } from "./components/HistoryView.js";
import { AuthModal } from "./components/AuthModal.js";
import { ToastContainer, ToastMessage } from "./components/ToastContainer.js";
import { UserProfile, ResumeAnalysisResult } from "./types.js";

type ViewMode =
  "landing" | "upload" | "analysis" | "history";

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<ViewMode>("landing");

  // Auth state (starts with a friendly demo user for immediate instant usability)
  const [user, setUser] = useState<UserProfile | null>({
    id: "demo-user-123",
    email: "alex.morgan@example.com",
    fullName: "Alex Morgan",
    targetJobTitle: "Senior Full Stack Engineer",
    experienceLevel: "senior",
    savedSkills: [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "Tailwind CSS",
      "AWS",
    ],
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");

  // Active Analysis state
  const [currentAnalysis, setCurrentAnalysis] =
    useState<ResumeAnalysisResult | null>(null);

  // Toast Notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  const handleOpenAuth = (tab: "login" | "signup" = "login") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("landing");
    showToast(
      "Signed Out",
      "You have been logged out of your session.",
      "info",
    );
  };

  const handleAnalysisComplete = (result: ResumeAnalysisResult) => {
    setCurrentAnalysis(result);
    setCurrentView("analysis");
    showToast(
      "Analysis Complete!",
      `ATS Score: ${result.atsScore}/100 calculated.`,
      "success",
    );
  };

  return (
    <div
      id="sp-resumai-root"
      className="min-h-screen bg-[#0B0D10] text-[#F5F7FA] flex font-sans overflow-hidden"
    >
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView as any}
        onNavigate={(view) => setCurrentView(view as ViewMode)}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main App Content View Switcher */}
      <main className="flex-1 h-screen overflow-y-auto">
        {currentView === "landing" && (
          <LandingPage
            onStartUpload={() => setCurrentView("upload")}
          />
        )}

        {currentView === "upload" && (
          <ResumeUpload
            onAnalysisComplete={handleAnalysisComplete}
            userId={user?.id}
          />
        )}

        {currentView === "analysis" && currentAnalysis && (
          <AnalysisDashboard
            analysis={currentAnalysis}
            onNewAnalysis={() => setCurrentView("upload")}
            onShowToast={showToast}
          />
        )}

        {currentView === "history" && (
          <HistoryView
            userId={user?.id}
            onSelectAnalysis={(analysis) => {
              setCurrentAnalysis(analysis);
              setCurrentView("analysis");
            }}
            onStartNewAnalysis={() => setCurrentView("upload")}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(
            "Welcome to SP ResumAI",
            `Signed in as ${loggedUser.fullName}`,
            "success",
          );
        }}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
