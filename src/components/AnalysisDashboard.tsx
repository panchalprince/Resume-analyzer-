import React, { useState } from "react";
import { ResumeAnalysisResult } from "../types.js";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  FileText,
  Printer,
  History,
  Check,
  XCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface AnalysisDashboardProps {
  analysis: ResumeAnalysisResult;
  onNewAnalysis: () => void;
  onOpenHistory?: () => void;
  onShowToast?: (
    title: string,
    message?: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  analysis,
  onNewAnalysis,
  onOpenHistory,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "skills" | "ats" | "roadmap">("all");

  const overall = analysis.overallScore ?? analysis.atsScore ?? 75;
  const atsScore = analysis.atsScore ?? 75;
  const role = analysis.targetRole || "Target Role";

  const getTierColor = (score: number) => {
    if (score >= 85) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Excellent" };
    if (score >= 75) return { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", label: "Strong" };
    if (score >= 60) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Good" };
    if (score >= 45) return { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Needs Improvement" };
    return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Weak" };
  };

  const tierInfo = getTierColor(overall);
  const candidate = analysis.candidate;
  const hasCandidateInfo = candidate && (candidate.name || candidate.email || candidate.phone);

  const matched = analysis.matchedSkills || analysis.skills || [];
  const partial = analysis.partialSkills || [];
  const missing = analysis.missingSkills || analysis.missingKeywords || [];

  const categoryScores = analysis.categoryScores || {
    atsCompatibility: atsScore,
    skillsMatch: analysis.skillsMatch ?? overall,
    experienceRelevance: analysis.experienceRelevance ?? overall,
    educationRelevance: analysis.educationRelevance ?? 85,
    projectsRelevance: analysis.projectsRelevance ?? overall,
    keywordMatch: analysis.keywordMatch ?? atsScore,
    resumeStructure: analysis.structureScore ?? atsScore,
    targetRoleFit: analysis.targetRoleFit ?? overall,
  };

  const categories = [
    { key: "atsCompatibility", label: "ATS Compatibility", score: categoryScores.atsCompatibility },
    { key: "skillsMatch", label: "Skills Match", score: categoryScores.skillsMatch },
    { key: "experienceRelevance", label: "Experience Relevance", score: categoryScores.experienceRelevance },
    { key: "educationRelevance", label: "Education Relevance", score: categoryScores.educationRelevance },
    { key: "projectsRelevance", label: "Projects Relevance", score: categoryScores.projectsRelevance },
    { key: "keywordMatch", label: "Keywords Match", score: categoryScores.keywordMatch },
    { key: "resumeStructure", label: "Resume Structure", score: categoryScores.resumeStructure },
    { key: "targetRoleFit", label: "Target Role Fit", score: categoryScores.targetRoleFit },
  ];

  const handlePrint = () => {
    window.print();
  };

  const circleRadius = 50;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (overall / 100) * circleCircumference;

  return (
    <div id="analysis-dashboard-page" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#242A35]/60 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNewAnalysis}
            className="flex items-center gap-2 text-[#8B93A1] hover:text-[#F5F7FA] transition-colors text-[13px] font-medium px-3 py-1.5 rounded-lg hover:bg-[#161B22] border border-transparent hover:border-[#242A35] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Analyze Another Resume</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1 rounded-full text-[12px] font-medium bg-[#6366F1]/10 text-[#A5B4FC] border border-[#6366F1]/25 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Role: {role}</span>
          </div>

          <div className="px-3 py-1 rounded-full text-[12px] font-medium bg-[#161B22] text-[#8B93A1] border border-[#242A35] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#6366F1]" />
            <span className="truncate max-w-[140px]">{analysis.filename}</span>
          </div>

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="p-1.5 text-[#8B93A1] hover:text-[#F5F7FA] hover:bg-[#161B22] rounded-lg border border-[#242A35] transition-colors cursor-pointer"
              title="View History"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 text-[#8B93A1] hover:text-[#F5F7FA] hover:bg-[#161B22] rounded-lg border border-[#242A35] text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Candidate Contact Bar (if present) */}
      {hasCandidateInfo && (
        <div className="bg-[#161B22] rounded-xl border border-[#242A35] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6366F1]/15 text-[#818CF8] flex items-center justify-center font-bold text-sm border border-[#6366F1]/30">
              {candidate.name ? candidate.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[#F5F7FA]">
                {candidate.name || "Candidate Profile"}
              </div>
              <div className="text-[12px] text-[#8B93A1]">
                Target: {role}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[12px] text-[#8B93A1] flex-wrap">
            {candidate.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#818CF8]" />
                {candidate.email}
              </span>
            )}
            {candidate.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#818CF8]" />
                {candidate.phone}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: Overall Score & Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Overall Score Gauge Card */}
        <div className="md:col-span-4 bg-[#161B22] rounded-2xl border border-[#242A35] p-6 sm:p-7 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[#8B93A1] mb-5">
            Overall Match Score
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-5">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={circleRadius}
                stroke="#21262D"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={circleRadius}
                stroke={
                  overall >= 85
                    ? "#10B981"
                    : overall >= 75
                    ? "#6366F1"
                    : overall >= 60
                    ? "#F59E0B"
                    : "#EF4444"
                }
                strokeWidth="10"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-[#F5F7FA] tracking-tight">
                {overall}
              </span>
              <span className="text-[12px] text-[#8B93A1]">/ 100</span>
            </div>
          </div>

          {/* Tier Badge */}
          <div
            className={`px-3.5 py-1 rounded-full text-[12px] font-semibold border ${tierInfo.bg} ${tierInfo.text} ${tierInfo.border}`}
          >
            {analysis.scoreTier || tierInfo.label}
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="md:col-span-8 bg-[#161B22] rounded-2xl border border-[#242A35] p-6 sm:p-7 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#818CF8]" />
              <h2 className="text-base font-semibold text-[#F5F7FA]">
                Target Role Evaluation: {role}
              </h2>
            </div>
            <p className="text-[13px] sm:text-[14px] text-[#C9D1D9] leading-relaxed mb-5 bg-[#0E1117] p-4 rounded-xl border border-[#242A35]">
              {analysis.summary}
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#242A35]">
            <div className="p-2.5 rounded-lg bg-[#0E1117] border border-[#242A35] text-center">
              <div className="text-[11px] text-[#8B93A1] mb-0.5">ATS Score</div>
              <div className="text-base font-bold text-[#F5F7FA]">{atsScore}%</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E1117] border border-[#242A35] text-center">
              <div className="text-[11px] text-[#8B93A1] mb-0.5">Skills Match</div>
              <div className="text-base font-bold text-[#F5F7FA]">
                {categoryScores.skillsMatch}%
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E1117] border border-[#242A35] text-center">
              <div className="text-[11px] text-[#8B93A1] mb-0.5">Role Fit</div>
              <div className="text-base font-bold text-[#F5F7FA]">
                {categoryScores.targetRoleFit}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Category Score Breakdown (8 Categories) */}
      <div className="bg-[#161B22] rounded-2xl border border-[#242A35] p-6 sm:p-7 shadow-lg">
        <h3 className="text-base font-semibold text-[#F5F7FA] mb-5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#818CF8]" />
          <span>Score Breakdown (8 Evaluation Categories)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const sc = cat.score ?? 75;
            const barColor =
              sc >= 80 ? "bg-emerald-500" : sc >= 65 ? "bg-[#6366F1]" : sc >= 50 ? "bg-amber-500" : "bg-rose-500";
            return (
              <div
                key={cat.key}
                className="p-4 rounded-xl bg-[#0E1117] border border-[#242A35] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-[#8B93A1]">{cat.label}</span>
                  <span className="text-[13px] font-bold text-[#F5F7FA]">{sc}%</span>
                </div>
                <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, Math.max(5, sc))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Matched, Partial & Missing Skills */}
      <div className="bg-[#161B22] rounded-2xl border border-[#242A35] p-6 sm:p-7 shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#818CF8]" />
            <span>Technical Skills Alignment for {role}</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strong Matches */}
          <div className="p-4.5 rounded-xl bg-[#0E1117] border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3 text-emerald-400 text-[13px] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Strong Matches ({matched.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matched.length > 0 ? (
                matched.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-[12px] text-[#8B93A1]">No exact matches detected.</p>
              )}
            </div>
          </div>

          {/* Partial Matches */}
          <div className="p-4.5 rounded-xl bg-[#0E1117] border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3 text-amber-400 text-[13px] font-semibold">
              <HelpCircle className="w-4 h-4" />
              <span>Partial / Related Skills ({partial.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {partial.length > 0 ? (
                partial.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-[#8B93A1]">None detected.</span>
              )}
            </div>
          </div>

          {/* Missing / Recommended */}
          <div className="p-4.5 rounded-xl bg-[#0E1117] border border-rose-500/20">
            <div className="flex items-center gap-2 mb-3 text-rose-400 text-[13px] font-semibold">
              <XCircle className="w-4 h-4" />
              <span>Missing High-Demand Skills ({missing.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missing.length > 0 ? (
                missing.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/25"
                  >
                    + {skill}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-[#8B93A1]">All core skills detected!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Role Match Analysis (Strengths, Gaps, Recommendations) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-[#161B22] rounded-2xl border border-[#242A35] p-5 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[14px] mb-4">
            <CheckCircle2 className="w-4.5 h-4.5" />
            <h4>What Matches {role}</h4>
          </div>
          <ul className="space-y-3">
            {(analysis.strengths || []).map((str, idx) => (
              <li key={idx} className="text-[12px] text-[#C9D1D9] flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses / Gaps */}
        <div className="bg-[#161B22] rounded-2xl border border-[#242A35] p-5 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-[14px] mb-4">
            <AlertTriangle className="w-4.5 h-4.5" />
            <h4>Gaps & Missing Criteria</h4>
          </div>
          <ul className="space-y-3">
            {(analysis.weaknesses || []).map((weak, idx) => (
              <li key={idx} className="text-[12px] text-[#C9D1D9] flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Improvements */}
        <div className="bg-[#161B22] rounded-2xl border border-[#242A35] p-5 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 text-[#818CF8] font-semibold text-[14px] mb-4">
            <Lightbulb className="w-4.5 h-4.5" />
            <h4>Recommended Improvements</h4>
          </div>
          <ul className="space-y-3">
            {(analysis.recommendedImprovements || []).map((rec, idx) => (
              <li key={idx} className="text-[12px] text-[#C9D1D9] flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8] mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SECTION 5: ATS Formatting & Compatibility Issues */}
      <div className="bg-[#161B22] rounded-2xl border border-[#242A35] p-6 sm:p-7 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-[#818CF8]" />
            <h3 className="text-base font-semibold text-[#F5F7FA]">
              ATS Compliance & Formatting Audit
            </h3>
          </div>
          <span className="text-[12px] font-semibold text-[#818CF8] bg-[#6366F1]/10 px-3 py-1 rounded-lg border border-[#6366F1]/20">
            ATS Score: {atsScore}/100
          </span>
        </div>

        {/* ATS Issues List */}
        <div className="space-y-3">
          {(analysis.atsIssues && analysis.atsIssues.length > 0 ? analysis.atsIssues : [
            {
              category: "Layout & Spacing",
              issue: "Formatting is clean. Maintain standard margins and clean single-column bullet points.",
              fix: "Ensure headings use standard text without text boxes or tables.",
              severity: "low" as const,
            }
          ]).map((item, idx) => {
            const severityBadge =
              item.severity === "high"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : item.severity === "medium"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0E1117] border border-[#242A35] flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#F5F7FA]">
                      {item.category || "ATS Formatting"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${severityBadge}`}
                    >
                      {item.severity} severity
                    </span>
                  </div>
                  <p className="text-[12px] text-[#C9D1D9]">{item.issue}</p>
                  <div className="text-[12px] text-[#818CF8] bg-[#161B22] p-2.5 rounded-lg border border-[#242A35] flex items-start gap-1.5">
                    <span className="font-semibold shrink-0">Fix:</span>
                    <span>{item.fix}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 6: Prioritized Improvement Roadmap */}
      <div className="bg-[#161B22] rounded-2xl border border-[#242A35] p-6 sm:p-7 shadow-lg space-y-6">
        <h3 className="text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#818CF8]" />
          <span>Prioritized Action Plan: How to Improve Your Resume for {role}</span>
        </h3>

        <div className="space-y-4">
          {/* High Priority */}
          <div className="p-4 rounded-xl bg-[#0E1117] border border-rose-500/20 space-y-2">
            <div className="text-[12px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>High Priority (Critical Fixes)</span>
            </div>
            <ul className="space-y-1.5 pl-4 list-disc text-[13px] text-[#C9D1D9]">
              {(analysis.highPrioritySuggestions && analysis.highPrioritySuggestions.length > 0
                ? analysis.highPrioritySuggestions
                : [
                    `Add missing core keywords (${missing.slice(0, 3).join(", ") || "target role protocols"}) to experience descriptions.`,
                    "Include concrete quantifiable metrics (percentages, throughput, or scale) in bullet points.",
                  ]
              ).map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
          </div>

          {/* Medium Priority */}
          <div className="p-4 rounded-xl bg-[#0E1117] border border-amber-500/20 space-y-2">
            <div className="text-[12px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Medium Priority (Competitive Edge)</span>
            </div>
            <ul className="space-y-1.5 pl-4 list-disc text-[13px] text-[#C9D1D9]">
              {(analysis.mediumPrioritySuggestions && analysis.mediumPrioritySuggestions.length > 0
                ? analysis.mediumPrioritySuggestions
                : [
                    `Position target title '${role}' in a professional summary header.`,
                    "Group technical proficiencies into clear structured categories (Languages, Protocols, Tools).",
                  ]
              ).map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
          </div>

          {/* Low Priority */}
          <div className="p-4 rounded-xl bg-[#0E1117] border border-indigo-500/20 space-y-2">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#818CF8] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#818CF8]" />
              <span>Low Priority (Polish & Refinement)</span>
            </div>
            <ul className="space-y-1.5 pl-4 list-disc text-[13px] text-[#C9D1D9]">
              {(analysis.lowPrioritySuggestions && analysis.lowPrioritySuggestions.length > 0
                ? analysis.lowPrioritySuggestions
                : [
                    "Ensure past-tense action verbs are uniform across all previous job descriptions.",
                    "Verify contact details and portfolio links are clickable and active.",
                  ]
              ).map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#242A35] print:hidden">
        <button
          type="button"
          onClick={onNewAnalysis}
          className="px-6 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-[13px] transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#6366F1]/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Analyze Another Resume</span>
        </button>

        <div className="text-[12px] text-[#8B93A1]">
          Saved to temporary browser history • Evaluated for {role}
        </div>
      </div>
    </div>
  );
};
