import React, { useState } from "react";
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Target,
  Download,
  Printer,
  Copy,
  ChevronDown,
  ChevronUp,
  Share2,
  Briefcase,
  GraduationCap,
  Layers,
  Code2,
  Zap,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ScoreGauge } from "./ScoreGauge.js";
import { ResumeAnalysisResult, SectionAnalysisDetail, BulletPointImprovement } from "../types.js";
import { formatDate, getScoreColor } from "../lib/utils.js";
import { apiRewriteBullet } from "../lib/api.js";

interface AnalysisDashboardProps {
  analysis: ResumeAnalysisResult;
  onNavigateToJobMatch: (resumeId?: string, resumeText?: string) => void;
  onNewAnalysis: () => void;
  onShowToast: (title: string, message?: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  analysis,
  onNavigateToJobMatch,
  onNewAnalysis,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "keywords" | "sections" | "bullets" | "formatting"
  >("overview");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Summary: true,
    Experience: true,
    Skills: true,
    Education: false,
    Projects: false,
    Certifications: false,
  });

  // Custom interactive bullet rewriter state
  const [customBulletInput, setCustomBulletInput] = useState("");
  const [customRewriting, setCustomRewriting] = useState(false);
  const [customRewriteResult, setCustomRewriteResult] = useState<{
    metricsFocused: string;
    actionOriented: string;
    atsOptimized: string;
    critique: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  React.useEffect(() => {
    if (analysis.atsScore >= 75) {
      triggerConfetti();
    }
  }, [analysis.id]);

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast("Copied to Clipboard", `${label} copied successfully!`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllImprovedBullets = () => {
    if (!analysis.bulletPointImprovements?.length) return;
    const formatted = analysis.bulletPointImprovements
      .map((item) => `• ${item.improved}`)
      .join("\n\n");
    copyToClipboard(formatted, "all-improved-bullets", "All improved bullet recommendations");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCustomRewrite = async () => {
    if (!customBulletInput.trim() || customBulletInput.length < 5) {
      onShowToast("Input Needed", "Please enter a bullet point to rewrite.", "warning");
      return;
    }

    setCustomRewriting(true);
    setCustomRewriteResult(null);

    try {
      const data = await apiRewriteBullet(
        customBulletInput,
        analysis.targetRole || "Professional Resume Experience"
      );
      setCustomRewriteResult(data);
      onShowToast("Rewrite Generated", "Produced 3 high-impact versions.", "success");
    } catch (err: any) {
      onShowToast("Rewrite Error", err.message || "Failed to rewrite bullet.", "error");
    } finally {
      setCustomRewriting(false);
    }
  };

  const scoreColors = getScoreColor(analysis.atsScore);

  const categoryScoreList = [
    { key: "keywordOptimization", label: "Keyword Optimization", score: analysis.categoryScores?.keywordOptimization ?? 75 },
    { key: "skillsMatch", label: "Skills Alignment", score: analysis.categoryScores?.skillsMatch ?? 80 },
    { key: "experienceImpact", label: "Experience & Impact", score: analysis.categoryScores?.experienceImpact ?? 70 },
    { key: "educationRelevance", label: "Education & Credentials", score: analysis.categoryScores?.educationRelevance ?? 85 },
    { key: "formattingAndLayout", label: "Formatting & Layout", score: analysis.categoryScores?.formattingAndLayout ?? 88 },
    { key: "resumeStructure", label: "Resume Structure", score: analysis.categoryScores?.resumeStructure ?? 80 },
    { key: "quantifiableMetrics", label: "Quantifiable Metrics", score: analysis.categoryScores?.quantifiableMetrics ?? 60 },
    { key: "actionVerbsAndTone", label: "Action Verbs & Tone", score: analysis.categoryScores?.actionVerbsAndTone ?? 78 },
  ];

  return (
    <div id="analysis-dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Analysis Report
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(analysis.createdAt)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>{analysis.filename}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {analysis.targetRole ? `Target Role: ${analysis.targetRole}` : "General ATS Recruiter Compatibility Scan"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onNavigateToJobMatch(analysis.resumeId, analysis.extractedTextSnippet)}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Target className="w-4 h-4" />
            <span>Match with Job Post</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF / Print</span>
          </button>

          <button
            onClick={onNewAnalysis}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Analyze Another</span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Overall Circular Score Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overall ATS Score
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${scoreColors.badge}`}>
              {analysis.scoreTier}
            </span>
          </div>

          <div className="py-6">
            <ScoreGauge score={analysis.atsScore} size="xl" showLabel={false} />
            <div className="mt-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {analysis.atsScore >= 85
                  ? "Outstanding ATS Compatibility"
                  : analysis.atsScore >= 70
                  ? "Competitive Resume Profile"
                  : analysis.atsScore >= 55
                  ? "Fair — Key Improvements Needed"
                  : "Critical Revisions Required"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {analysis.atsScore >= 80
                  ? "Likely to pass top-tier ATS filters and advance to recruiter review."
                  : "Needs keyword optimization and metrics enhancement to pass ATS filters."}
              </p>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-left">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Measurable Metrics</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {analysis.experienceInsight?.measurableResultsCount ?? 3} Detected
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Action Verbs</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                {analysis.experienceInsight?.actionVerbStrength ?? "Moderate"}
              </span>
            </div>
          </div>
        </div>

        {/* 8 Metric Dimensions Breakdown */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>8 Core ATS Evaluation Dimensions</span>
              </h3>
              <span className="text-xs text-slate-500">Industry Recruiter Standard</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryScoreList.map((cat) => {
                const colors = getScoreColor(cat.score);
                return (
                  <div
                    key={cat.key}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">{cat.label}</span>
                      <span className={colors.text}>{cat.score}/100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.progress}`}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Executive Summary Snippet */}
          <div className="mt-5 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                Executive Recruiter Insight
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Strengths & Weaknesses", icon: Award },
          { id: "keywords", label: "Keywords & Detected Skills", icon: Layers },
          { id: "sections", label: "Section-by-Section Audit", icon: FileText },
          { id: "bullets", label: "AI Bullet Rewriter", icon: Zap },
          { id: "formatting", label: "Formatting & Layout Check", icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: Overview (Strengths & Weaknesses) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-100 dark:border-emerald-950">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Resume Strengths ({analysis.strengths.length})
                </h3>
                <p className="text-xs text-slate-500">Elements working in your favor with ATS & recruiters</p>
              </div>
            </div>

            <ul className="space-y-3">
              {analysis.strengths.map((str, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100 dark:border-rose-950">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Critical Areas for Improvement ({analysis.weaknesses.length})
                </h3>
                <p className="text-xs text-slate-500">Fix these to prevent ATS auto-rejection</p>
              </div>
            </div>

            <ul className="space-y-3">
              {analysis.weaknesses.map((weak, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    !
                  </span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Keywords & Detected Skills */}
      {activeTab === "keywords" && (
        <div className="space-y-6">
          {/* Missing Keywords Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-100 dark:border-amber-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  High-Priority Missing ATS Keywords ({analysis.missingKeywords?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                Click any keyword to copy to clipboard
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Recruiters and automated filters scan for these industry terms. If you have experience with any of these, weave them naturally into your Summary, Experience, or Skills sections.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {analysis.missingKeywords?.map((kw, i) => (
                <button
                  key={i}
                  onClick={() => copyToClipboard(kw, `kw-${i}`, `Keyword "${kw}"`)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center gap-1.5 group"
                >
                  <span>+ {kw}</span>
                  {copiedId === `kw-${i}` ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Detected Skills Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Detected Skills Categorization
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Technical Skills */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Code2 className="w-4 h-4" />
                  <span>Technical & Core Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.detectedSkills?.technical?.length ? (
                    analysis.detectedSkills.technical.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">None detected</span>
                  )}
                </div>
              </div>

              {/* Programming Languages */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
                  <Code2 className="w-4 h-4" />
                  <span>Languages / Syntax</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.detectedSkills?.programmingLanguages?.length ? (
                    analysis.detectedSkills.programmingLanguages.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">None detected</span>
                  )}
                </div>
              </div>

              {/* Tools & Frameworks */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>Tools & Frameworks</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.detectedSkills?.tools?.length ? (
                    analysis.detectedSkills.tools.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">None detected</span>
                  )}
                </div>
              </div>

              {/* Soft Skills */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Award className="w-4 h-4" />
                  <span>Soft & Leadership Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.detectedSkills?.soft?.length ? (
                    analysis.detectedSkills.soft.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">None detected</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Section-by-Section Expandable Audit */}
      {activeTab === "sections" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Click any section card below to view strengths, flagged weaknesses, and targeted advice.</span>
            <div className="flex gap-2">
              <button
                onClick={() => setExpandedSections({ Summary: true, Experience: true, Skills: true, Education: true, Projects: true, Certifications: true })}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Expand All
              </button>
              <span>|</span>
              <button
                onClick={() => setExpandedSections({})}
                className="text-slate-500 font-bold hover:underline"
              >
                Collapse All
              </button>
            </div>
          </div>

          {analysis.sectionDetails?.map((sec, idx) => {
            const isOpen = !!expandedSections[sec.sectionName];
            const colors = getScoreColor(sec.score);

            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
              >
                {/* Header Toggle */}
                <div
                  onClick={() => toggleSection(sec.sectionName)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 select-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${colors.badge}`}>
                      {sec.score}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {sec.sectionName}
                      </h4>
                      <span className="text-xs text-slate-500 capitalize">
                        Status: <span className="font-semibold">{sec.status.replace("_", " ")}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${colors.badge}`}>
                      {sec.score}/100
                    </span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section Strengths */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                          Strengths Detected:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                          {sec.strengths?.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Section Problems */}
                      <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1.5">
                        <span className="font-bold text-rose-800 dark:text-rose-300 block">
                          Issues & Shortcomings:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                          {sec.problems?.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Section Actionable Suggestions */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                      <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Recommended Improvements:</span>
                      </span>
                      <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                        {sec.suggestions?.map((sugg, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-900/40 transition-colors"
                          >
                            <span className="flex-1 leading-relaxed">• {sugg}</span>
                            <button
                              id={`copy-suggestion-${sec.sectionName}-${i}`}
                              onClick={() => copyToClipboard(sugg, `sugg-${sec.sectionName}-${i}`, "Recommendation")}
                              title="Copy suggestion"
                              className="shrink-0 px-2 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedId === `sugg-${sec.sectionName}-${i}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT 4: AI Bullet Rewriter Studio */}
      {activeTab === "bullets" && (
        <div className="space-y-8">
          {/* Rewritten Bullet Comparisons from Analysis */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Achievement-Oriented Bullet Transformations ({analysis.bulletPointImprovements?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">
                  Converted from passive duties into measurable STAR/Google XYZ achievements with quantifiable metrics.
                </p>
              </div>

              {analysis.bulletPointImprovements && analysis.bulletPointImprovements.length > 0 && (
                <button
                  id="copy-all-improved-bullets-btn"
                  onClick={copyAllImprovedBullets}
                  className="self-start sm:self-auto px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {copiedId === "all-improved-bullets" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">All Bullets Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Copy All Rewritten Bullets</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {analysis.bulletPointImprovements?.map((item) => (
                <div
                  key={item.id}
                  id={`bullet-card-${item.id}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Category: {item.category.replace("_", " ")}
                    </span>
                    <button
                      id={`copy-bullet-top-${item.id}`}
                      onClick={() => copyToClipboard(item.improved, item.id, "Improved Bullet")}
                      title="Click to copy rewritten bullet"
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Rewritten Bullet</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Weak Original */}
                    <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                        Original Statement (Weak / Task-Based)
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-rose-100/80 dark:border-rose-900/30">
                        "{item.original}"
                      </p>
                      <div className="text-rose-600 dark:text-rose-300 text-[11px] pt-1">
                        <strong>Issue:</strong> {item.problem}
                      </div>
                    </div>

                    {/* AI Enhanced */}
                    <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Measurable Version (Google XYZ)</span>
                        </span>
                        <button
                          id={`copy-bullet-inline-${item.id}`}
                          onClick={() => copyToClipboard(item.improved, item.id, "Improved Bullet")}
                          title="Copy this rewritten bullet to clipboard"
                          className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-900/60 text-slate-900 dark:text-white font-medium text-xs leading-relaxed select-all">
                        "{item.improved}"
                      </div>

                      {item.metricAddedSuggestion && (
                        <div className="text-emerald-700 dark:text-emerald-300 text-[11px] pt-1">
                          <strong>Metric Strategy:</strong> {item.metricAddedSuggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Live Single-Bullet Rewriter Tool */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-4 border border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Interactive Bullet Point Rewriter
                </h3>
                <p className="text-xs text-slate-300">
                  Type or paste any single duty or bullet from your resume to instantly generate 3 high-impact versions.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={customBulletInput}
                onChange={(e) => setCustomBulletInput(e.target.value)}
                placeholder="e.g. Responsible for managing customer tickets and fixing bugs in production..."
                className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCustomRewrite}
                  disabled={customRewriting || !customBulletInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {customRewriting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Rewrite with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Custom Rewrite Results */}
            {customRewriteResult && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-xs text-indigo-200">
                  <strong>Recruiter Critique:</strong> {customRewriteResult.critique}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* 1. Metrics-Focused */}
                  <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase">
                          1. Metrics-Focused
                        </span>
                        <button
                          id="copy-custom-metrics-btn"
                          onClick={() => copyToClipboard(customRewriteResult.metricsFocused, "custom-m", "Metrics version")}
                          title="Copy rewritten bullet"
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === "custom-m" ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-200 leading-relaxed">"{customRewriteResult.metricsFocused}"</p>
                    </div>
                  </div>

                  {/* 2. Action-Oriented */}
                  <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-sky-400 uppercase">
                          2. Action-Oriented
                        </span>
                        <button
                          id="copy-custom-action-btn"
                          onClick={() => copyToClipboard(customRewriteResult.actionOriented, "custom-a", "Action version")}
                          title="Copy rewritten bullet"
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === "custom-a" ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-200 leading-relaxed">"{customRewriteResult.actionOriented}"</p>
                    </div>
                  </div>

                  {/* 3. ATS-Optimized */}
                  <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-amber-400 uppercase">
                          3. ATS-Optimized
                        </span>
                        <button
                          id="copy-custom-ats-btn"
                          onClick={() => copyToClipboard(customRewriteResult.atsOptimized, "custom-ats", "ATS version")}
                          title="Copy rewritten bullet"
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === "custom-ats" ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-200 leading-relaxed">"{customRewriteResult.atsOptimized}"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: Formatting & Layout Audit */}
      {activeTab === "formatting" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              ATS Formatting & Parser Compatibility Audit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.formattingIssues?.length ? (
                analysis.formattingIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {issue.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          issue.severity === "high"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : issue.severity === "medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {issue.severity} severity
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Problem:</strong> {issue.issue}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                      <strong>Fix:</strong> {issue.fix}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  ✅ Clean formatting detected. Standard section headers and linear layouts verified.
                </div>
              )}
            </div>
          </div>

          {/* Education & Experience Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Briefcase className="w-4 h-4" />
                <span>Experience Analysis</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {analysis.experienceInsight?.summaryRemarks}
              </p>
              <div className="pt-2 text-xs space-y-1 text-slate-500">
                <div>
                  <strong>Job Titles Detected:</strong>{" "}
                  {analysis.experienceInsight?.jobTitlesDetected?.join(", ") || "Standard Roles"}
                </div>
                <div>
                  <strong>Estimated Total Experience:</strong>{" "}
                  {analysis.experienceInsight?.estimatedYearsExperience || "N/A"}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                <GraduationCap className="w-4 h-4" />
                <span>Education Analysis</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {analysis.educationInsight?.summaryRemarks}
              </p>
              <div className="pt-2 text-xs space-y-1 text-slate-500">
                <div>
                  <strong>Degree:</strong>{" "}
                  {analysis.educationInsight?.degreeDetected || "Degree detected"}
                </div>
                <div>
                  <strong>Institution:</strong>{" "}
                  {analysis.educationInsight?.institutionDetected || "Institution noted"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
