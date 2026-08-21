import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  FileText,
  Target,
  History,
  ArrowRight,
  Zap,
  Award,
  Clock,
  ShieldCheck,
  PlusCircle,
  Eye,
} from "lucide-react";
import { ScoreGauge } from "./ScoreGauge.js";
import { UserProfile, ResumeAnalysisResult } from "../types.js";
import { formatDate, getScoreColor } from "../lib/utils.js";
import { SAMPLE_RESUMES } from "../data/sampleResumes.js";

interface DashboardOverviewProps {
  user: UserProfile | null;
  onNavigate: (view: "upload" | "history" | "analysis") => void;
  onSelectAnalysis: (analysis: ResumeAnalysisResult) => void;
  onLoadPreset: (sampleId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  onNavigate,
  onSelectAnalysis,
  onLoadPreset,
}) => {
  const [analyses, setAnalyses] = useState<ResumeAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/analyses?userId=${user?.id || "demo-user-123"}`,
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setAnalyses(data);
        }
      } catch (err) {
        console.error("Dashboard history load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;
  const previousAnalysis = analyses.length > 1 ? analyses[1] : null;
  const scoreDiff =
    latestAnalysis && previousAnalysis
      ? latestAnalysis.atsScore - previousAnalysis.atsScore
      : null;

  return (
    <div
      id="dashboard-overview-page"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Welcome back, {user?.fullName || "Candidate"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Supercharge Your Career with AI ATS Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Upload your latest resume draft to pinpoint missing keywords and
            optimize your hiring pipeline.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("upload")}
              className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Analyze New Resume</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Latest ATS Score */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Latest ATS Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 ">
                {latestAnalysis ? `${latestAnalysis.atsScore}/100` : "--"}
              </span>
              {scoreDiff !== null && (
                <span
                  className={`text-xs font-bold ${
                    scoreDiff >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} vs prev
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[180px]">
              {latestAnalysis
                ? latestAnalysis.filename
                : "No resume analyzed yet"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Total Analyses Count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Resumes Scanned
            </span>
            <div className="text-3xl font-black text-slate-900 ">
              {analyses.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {analyses.length > 0
                ? "Saved in your private history"
                : "Ready for your first upload"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
        </div>

        {/* Profile Readiness Tier */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Candidate Tier
            </span>
            <div className="text-xl font-extrabold text-slate-900 ">
              {latestAnalysis ? latestAnalysis.scoreTier : "Standard"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {latestAnalysis && latestAnalysis.atsScore >= 80
                ? "Top 10% Applicant Pool"
                : "Optimization Recommended"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Latest Analysis Highlights & Quick Sample Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Analyses */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 ">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Recent Resume Analyses</span>
            </h3>
            {analyses.length > 0 && (
              <button
                onClick={() => onNavigate("history")}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>View all ({analyses.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading recent scans...
            </div>
          ) : analyses.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-slate-500">
                You have not analyzed any resumes yet. Start by uploading a PDF
                or choosing a sample.
              </p>
              <button
                onClick={() => onNavigate("upload")}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white"
              >
                Upload Resume Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.slice(0, 4).map((item) => {
                const colors = getScoreColor(item.atsScore);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${colors.badge}`}
                      >
                        {item.atsScore}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 ">
                          {item.filename}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(item.createdAt)}
                          {item.targetRole ? ` • ${item.targetRole}` : ""}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectAnalysis(item)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Report</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Pre-loaded Demo Profiles & Quick Tools */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 ">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 ">
                1-Click Preset Resumes
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Test instant AI analysis with real-world professional profiles:
            </p>

            <div className="space-y-2.5">
              {SAMPLE_RESUMES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => onLoadPreset(sample.id)}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                    <span>{sample.role}</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-600">
                      {sample.experienceLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {sample.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
