import React, { useState } from "react";
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  Briefcase,
  Layers,
  FileText,
  Zap,
} from "lucide-react";
import { ScoreGauge } from "./ScoreGauge.js";
import { JobMatchResult } from "../types.js";
import { SAMPLE_RESUMES } from "../data/sampleResumes.js";
import { apiJobMatch } from "../lib/api.js";

interface JobMatchViewProps {
  initialResumeText?: string;
  initialResumeId?: string;
  userId?: string;
  onShowToast: (title: string, message?: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const JobMatchView: React.FC<JobMatchViewProps> = ({
  initialResumeText,
  initialResumeId,
  userId,
  onShowToast,
}) => {
  const [resumeText, setResumeText] = useState(initialResumeText || SAMPLE_RESUMES[0].text);
  const [jobDescription, setJobDescription] = useState(SAMPLE_RESUMES[0].sampleJobDescription || "");
  const [jobTitle, setJobTitle] = useState("Senior Full Stack Engineer");
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!resumeText.trim() || resumeText.length < 20) {
      setError("Please provide your resume text (at least 20 characters).");
      return;
    }

    if (!jobDescription.trim() || jobDescription.length < 20) {
      setError("Please paste the target job description to match against.");
      return;
    }

    setError(null);
    setIsMatching(true);

    try {
      const data = await apiJobMatch({
        resumeText,
        jobDescription,
        jobTitle,
        userId: userId || "demo-user-123",
        resumeId: initialResumeId || "active_res",
      });

      setMatchResult(data);
      onShowToast("Job Match Complete", `Calculated ${data.matchScore}% alignment!`, "success");
    } catch (err: any) {
      setError(err.message || "Failed to compare job description.");
    } finally {
      setIsMatching(false);
    }
  };

  const copyText = (text: string, id: string, label = "Copied to clipboard.") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    onShowToast("Copied to Clipboard", label, "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllTailoredBullets = () => {
    if (!matchResult?.tailoredBulletSuggestions?.length) return;
    const allBullets = matchResult.tailoredBulletSuggestions
      .map((s) => `• ${s.tailoredForJob}`)
      .join("\n\n");
    copyText(allBullets, "all-tailored", "All tailored bullet points copied to clipboard!");
  };

  return (
    <div id="job-match-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <Target className="w-3.5 h-3.5 text-sky-500" />
          <span>Tailored Job Alignment Matcher</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Match Resume Against Any Job Description
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Paste the job posting you want to apply for. Our AI identifies matching vs. missing keywords, calculates your match percentage, and tailors your bullet points for the role.
        </p>
      </div>

      {/* Input Side-by-Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resume Text */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Your Resume Text
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {resumeText.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            rows={10}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste or edit your resume text here..."
            className="w-full p-3.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Right: Target Job Description */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Target Job Description & Title
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {jobDescription.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <div>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer / Lead Product Manager"
              className="w-full mb-3 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />

            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the requirements, responsibilities, and qualifications from the job posting..."
              className="w-full p-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleMatch}
          disabled={isMatching}
          className="px-8 py-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isMatching ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Match & Keywords with Gemini...</span>
            </>
          ) : (
            <>
              <Target className="w-5 h-5" />
              <span>Calculate Job Match & Tailor Resume</span>
            </>
          )}
        </button>
      </div>

      {/* Match Results Display */}
      {matchResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in duration-300">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-center md:justify-start">
              <ScoreGauge
                score={matchResult.matchScore}
                size="lg"
                label="Job Match Score"
                sublabel={`${matchResult.jobTitle || "Target Role"}`}
              />
            </div>

            <div className="md:col-span-2 space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Match Assessment
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {matchResult.matchScore >= 80
                  ? "Strong Alignment with Job Post"
                  : matchResult.matchScore >= 60
                  ? "Moderate Alignment — Key Gaps Found"
                  : "Low Keyword & Skill Overlap"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                {matchResult.matchScore >= 75
                  ? "Your resume reflects the primary competencies requested. Incorporate the missing keywords below to maximize ATS pass rates."
                  : "Add the missing skills and qualifications highlighted below before applying to this opening."}
              </p>
            </div>
          </div>

          {/* Keywords & Skills Comparison Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matching Keywords */}
            <div className="p-5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Matching Keywords ({matchResult.matchingKeywords?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.matchingKeywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="p-5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Missing Keywords ({matchResult.missingKeywords?.length || 0})</span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400">Click to copy</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.missingKeywords?.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => copyText(kw, `mkw-${i}`)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 hover:bg-rose-200 flex items-center gap-1 group transition-colors"
                  >
                    <span>+ {kw}</span>
                    {copiedKey === `mkw-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Changes */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Recommended Customizations for this Position</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {matchResult.recommendedChanges?.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tailored Bullet Suggestions */}
          {matchResult.tailoredBulletSuggestions?.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Tailored Bullet Points for this Role ({matchResult.tailoredBulletSuggestions.length})</span>
                </h4>
                <button
                  id="copy-all-tailored-bullets-btn"
                  onClick={copyAllTailoredBullets}
                  className="self-start sm:self-auto px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === "all-tailored" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">All Bullets Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Bullets</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {matchResult.tailoredBulletSuggestions.map((sugg, i) => (
                  <div
                    key={i}
                    id={`tailored-bullet-card-${i}`}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="text-slate-500 line-through text-[11px]">
                          Original: "{sugg.original}"
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-white font-medium text-xs leading-relaxed">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold mr-1">
                            Tailored:
                          </span>
                          "{sugg.tailoredForJob}"
                        </div>
                      </div>

                      <button
                        id={`copy-tailored-bullet-btn-${i}`}
                        onClick={() => copyText(sugg.tailoredForJob, `tb-${i}`, "Tailored bullet copied!")}
                        title="Copy rewritten bullet to clipboard"
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        {copiedKey === `tb-${i}` ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">ATS Rationale:</span>
                      <span>{sugg.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
