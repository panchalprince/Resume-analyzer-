import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar.js";
import { LandingPage } from "./components/LandingPage.js";
import { ResumeUpload } from "./components/ResumeUpload.js";
import { AnalysisDashboard } from "./components/AnalysisDashboard.js";
import { JobMatchView } from "./components/JobMatchView.js";
import { HistoryView } from "./components/HistoryView.js";
import { DashboardOverview } from "./components/DashboardOverview.js";
import { ProfileView } from "./components/ProfileView.js";
import { AuthModal } from "./components/AuthModal.js";
import { ToastContainer, ToastMessage } from "./components/ToastContainer.js";
import { UserProfile, ResumeAnalysisResult } from "./types.js";
import { SAMPLE_RESUMES, SampleResumePreset } from "./data/sampleResumes.js";

type ViewMode = "landing" | "upload" | "analysis" | "jobmatch" | "history" | "dashboard" | "profile";

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
    savedSkills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS", "AWS"],
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");

  // Active Analysis & Job Match state
  const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [jobMatchContext, setJobMatchContext] = useState<{ text?: string; resumeId?: string }>({
    text: SAMPLE_RESUMES[0].text,
  });

  // Dark/Light Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Toast Notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme class to html root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const showToast = (
    title: string,
    message?: string,
    type: "success" | "error" | "info" | "warning" = "info"
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
    showToast("Signed Out", "You have been logged out of your session.", "info");
  };

  const handleAnalysisComplete = (result: ResumeAnalysisResult) => {
    setCurrentAnalysis(result);
    setJobMatchContext({
      text: result.extractedTextSnippet,
      resumeId: result.id,
    });
    setCurrentView("analysis");
    showToast("Analysis Complete!", `ATS Score: ${result.atsScore}/100 calculated.`, "success");
  };

  const handleLoadSamplePreset = async (presetId: string) => {
    const preset = SAMPLE_RESUMES.find((s) => s.id === presetId) || SAMPLE_RESUMES[0];
    showToast("Loading Sample Resume", `Analyzing ${preset.role} profile...`, "info");
    setCurrentView("upload");
  };

  const handleNavigateToJobMatch = (resumeId?: string, resumeText?: string) => {
    setJobMatchContext({
      resumeId: resumeId || currentAnalysis?.id,
      text: resumeText || currentAnalysis?.extractedTextSnippet || SAMPLE_RESUMES[0].text,
    });
    setCurrentView("jobmatch");
  };

  return (
    <div id="sp-resumai-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as ViewMode)}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenProfile={() => setCurrentView("profile")}
        onLoadDemo={() => handleLoadSamplePreset("sample-1")}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main App Content View Switcher */}
      <main className="flex-1">
        {currentView === "landing" && (
          <LandingPage
            onStartUpload={() => setCurrentView("upload")}
            onSelectSample={(presetId) => handleLoadSamplePreset(presetId)}
            onOpenJobMatch={() => setCurrentView("jobmatch")}
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
            onNavigateToJobMatch={handleNavigateToJobMatch}
            onNewAnalysis={() => setCurrentView("upload")}
            onShowToast={showToast}
          />
        )}

        {currentView === "jobmatch" && (
          <JobMatchView
            initialResumeText={jobMatchContext.text}
            initialResumeId={jobMatchContext.resumeId}
            userId={user?.id}
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
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">SP ResumAI</span>
            <span>— AI-Powered ATS Resume Scanner & Optimizer</span>
          </div>
          <p className="text-slate-400">
            Powered by Gemini 2.5 Flash & Full-Stack ATS Architecture.
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
          showToast("Welcome to SP ResumAI", `Signed in as ${loggedUser.fullName}`, "success");
        }}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
