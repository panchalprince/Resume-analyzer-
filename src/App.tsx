import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar.js";
import { LandingPage } from "./components/LandingPage.js";
import { ResumeUpload } from "./components/ResumeUpload.js";
import { AnalysisDashboard } from "./components/AnalysisDashboard.js";
import { HistoryView } from "./components/HistoryView.js";
import { DashboardOverview } from "./components/DashboardOverview.js";
import { ProfileView } from "./components/ProfileView.js";
import { AuthModal } from "./components/AuthModal.js";
import { ToastContainer, ToastMessage } from "./components/ToastContainer.js";
import { UserProfile, ResumeAnalysisResult } from "./types.js";
import { SAMPLE_RESUMES, SampleResumePreset } from "./data/sampleResumes.js";

type ViewMode =
  "landing" | "upload" | "analysis" | "history" | "dashboard" | "profile";

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

  const handleLoadSamplePreset = async (presetId: string) => {
    const preset =
      SAMPLE_RESUMES.find((s) => s.id === presetId) || SAMPLE_RESUMES[0];
    showToast(
      "Loading Sample Resume",
      `Analyzing ${preset.role} profile...`,
      "info",
    );
    setCurrentView("upload");
  };

  return (
    <div
      id="sp-resumai-root"
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans"
    >
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as ViewMode)}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenProfile={() => setCurrentView("profile")}
        onLoadDemo={() => handleLoadSamplePreset("sample-1")}
      />

      {/* Main App Content View Switcher */}
      <main className="flex-1">
        {currentView === "landing" && (
          <LandingPage
            onStartUpload={() => setCurrentView("upload")}
            onSelectSample={(presetId) => handleLoadSamplePreset(presetId)}
          />
        )}

        {currentView === "dashboard" && (
          <DashboardOverview
            user={user}
            onNavigate={(view) => setCurrentView(view)}
            onSelectAnalysis={(analysis) => {
              setCurrentAnalysis(analysis);
              setCurrentView("analysis");
            }}
            onLoadPreset={handleLoadSamplePreset}
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

        {currentView === "profile" && (
          <ProfileView
            user={user}
            onUpdateUser={(updated) => {
              setUser(updated);
            }}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-md py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SP ResumAI</span>
            <span>— Professional ATS Resume Optimizer</span>
          </div>
          <p className="text-slate-400">
            Powered by Advanced AI ATS Architecture
          </p>
        </div>
      </footer>

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
