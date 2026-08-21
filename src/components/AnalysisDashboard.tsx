import React from "react";
import { ResumeAnalysisResult } from "../types.js";
import { ArrowLeft, Check, AlertTriangle, Lightbulb, User, Mail, Phone } from "lucide-react";

interface AnalysisDashboardProps {
  analysis: ResumeAnalysisResult;
  onNewAnalysis: () => void;
  onShowToast?: (title: string, message?: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  analysis,
  onNewAnalysis,
}) => {
  const getMatchLabel = (score: number) => {
    if (score >= 85) return "Strong Match";
    if (score >= 70) return "Good Match";
    if (score >= 50) return "Fair Match";
    return "Weak Match";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const circleRadius = 45;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (analysis.atsScore / 100) * circleCircumference;

  const allDetectedSkills = [
    ...(analysis.skills || []),
    ...(analysis.detectedSkills?.technical || []),
    ...(analysis.detectedSkills?.programmingLanguages || []),
    ...(analysis.detectedSkills?.tools || []),
    ...(analysis.detectedSkills?.soft || []),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 15);

  const missingSkills = (analysis.missingSkills || analysis.missingKeywords || []).filter(
    (v, i, a) => a.indexOf(v) === i
  );

  const certSection = analysis.sectionDetails?.find((s) => s.sectionName.toLowerCase().includes("cert"));
  const certsDetected = certSection ? certSection.strengths : [];

  const candidate = analysis.candidate;
  const hasCandidateInfo = candidate && (candidate.name || candidate.email || candidate.phone);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 font-sans">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-2 text-[#8B93A1] hover:text-[#F5F7FA] transition-colors text-[13px] font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analyzer
        </button>

        {analysis.hiringRecommendation && (
          <div className="px-3 py-1 rounded-full text-[12px] font-medium bg-[#6366F1]/10 text-[#A5B4FC] border border-[#6366F1]/20">
            {analysis.hiringRecommendation}
          </div>
        )}
      </div>

      {/* Candidate Banner (if detected) */}
      {hasCandidateInfo && (
        <div className="bg-[#151922] rounded-xl border border-[#242A35] px-6 py-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center font-semibold text-sm">
              {candidate.name ? candidate.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[#F5F7FA]">
                {candidate.name || "Candidate Profile"}
              </div>
              <div className="text-[12px] text-[#8B93A1]">
                {analysis.targetRole || analysis.filename}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[12px] text-[#8B93A1]">
            {candidate.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#6366F1]" />
                {candidate.email}
              </span>
            )}
            {candidate.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#6366F1]" />
                {candidate.phone}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: ATS Score & Bars */}
        <div className="md:col-span-4 space-y-8">
          {/* Main ATS Score */}
          <div className="bg-[#151922] rounded-xl border border-[#242A35] p-8 text-center flex flex-col items-center">
            <h2 className="text-[15px] font-medium text-[#F5F7FA] mb-6">ATS Score</h2>

            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  stroke="#242A35"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  stroke={getScoreColor(analysis.atsScore)}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-semibold text-[#F5F7FA]">
                  {analysis.atsScore}%
                </span>
              </div>
            </div>

            <div className="text-[15px] font-medium" style={{ color: getScoreColor(analysis.atsScore) }}>
              {getMatchLabel(analysis.atsScore)}
            </div>
          </div>

          {/* Breakdown Bars */}
          <div className="bg-[#151922] rounded-xl border border-[#242A35] p-6 space-y-5">
            {[
              { label: "Skills Match", score: analysis.categoryScores?.skillsMatch || analysis.atsScore },
              { label: "Experience Match", score: analysis.categoryScores?.experienceImpact || analysis.atsScore },
              { label: "Education Match", score: analysis.categoryScores?.educationRelevance || analysis.atsScore },
              { label: "Keywords Match", score: analysis.categoryScores?.keywordOptimization || analysis.atsScore },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-[#8B93A1]">{item.label}</span>
                  <span className="text-[#F5F7FA] font-medium">{item.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#242A35] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6366F1] rounded-full transition-all duration-700"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Analysis & Recommendations */}
        <div className="md:col-span-8 space-y-8">
          {/* AI Analysis Results */}
          <div className="bg-[#151922] rounded-xl border border-[#242A35] p-8">
            <h2 className="text-[15px] font-medium text-[#F5F7FA] mb-6 border-b border-[#242A35] pb-4">
              AI Analysis Results
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-[13px] text-[#8B93A1] font-medium mb-3">Skills Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {allDetectedSkills.length > 0 ? (
                    allDetectedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#101318] border border-[#242A35] rounded-md text-[12px] text-[#F5F7FA]"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#8B93A1]">No specific skills detected.</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-[13px] text-[#8B93A1] font-medium mb-3">Missing Skills & Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.length > 0 ? (
                    missingSkills.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#101318] border border-[#EF4444]/30 rounded-md text-[12px] text-[#FCA5A5]"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#8B93A1]">No missing skills identified.</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <h3 className="text-[13px] text-[#8B93A1] font-medium mb-2">Experience</h3>
                  <div className="text-[13px] text-[#F5F7FA]">
                    {analysis.experienceInsight?.estimatedYearsExperience || "Not explicitly specified"}
                  </div>
                </div>
                <div>
                  <h3 className="text-[13px] text-[#8B93A1] font-medium mb-2">Education</h3>
                  <div className="text-[13px] text-[#F5F7FA]">
                    {analysis.educationInsight?.degreeDetected || "Not explicitly specified"}
                  </div>
                </div>
              </div>

              {certsDetected.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-[13px] text-[#8B93A1] font-medium mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {certsDetected.map((cert, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#101318] border border-[#242A35] rounded-md text-[12px] text-[#F5F7FA]"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Strengths & Weaknesses */}
          <div className="bg-[#151922] rounded-xl border border-[#242A35] p-8">
            <h2 className="text-[15px] font-medium text-[#F5F7FA] mb-6 border-b border-[#242A35] pb-4">
              AI Evaluation & Insights
            </h2>

            <div className="space-y-4">
              {analysis.strengths?.map((strength, idx) => (
                <div key={`str-${idx}`} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span className="text-[13px] text-[#F5F7FA] leading-relaxed">{strength}</span>
                </div>
              ))}

              {analysis.weaknesses?.map((weakness, idx) => (
                <div key={`weak-${idx}`} className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                  <span className="text-[13px] text-[#F5F7FA] leading-relaxed">{weakness}</span>
                </div>
              ))}

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="pt-4 border-t border-[#242A35]/60 space-y-3">
                  <h3 className="text-[13px] text-[#A5B4FC] font-medium flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-[#6366F1]" />
                    Recommended Actions
                  </h3>
                  {analysis.recommendations.map((rec, idx) => (
                    <div key={`rec-${idx}`} className="flex items-start gap-3 pl-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 shrink-0" />
                      <span className="text-[13px] text-[#D1D5DB] leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
