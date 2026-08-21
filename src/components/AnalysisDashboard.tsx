import React from "react";
import { ResumeAnalysisResult } from "../types.js";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";

interface AnalysisDashboardProps {
  analysis: ResumeAnalysisResult;
  onNewAnalysis: () => void;
  onShowToast: (title: string, message?: string, type?: "success" | "error" | "info" | "warning") => void;
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
    ...(analysis.detectedSkills?.technical || []),
    ...(analysis.detectedSkills?.programmingLanguages || []),
    ...(analysis.detectedSkills?.tools || []),
    ...(analysis.detectedSkills?.soft || [])
  ].slice(0, 15);

  const certSection = analysis.sectionDetails.find(s => s.sectionName.toLowerCase().includes('cert'));
  const certsDetected = certSection ? certSection.strengths : [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 font-sans">
      <button
        onClick={onNewAnalysis}
        className="flex items-center gap-2 text-[#8B93A1] hover:text-[#F5F7FA] mb-8 transition-colors text-[13px] font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Analyzer
      </button>

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
              { label: 'Skills Match', score: analysis.categoryScores.skillsMatch || 0 },
              { label: 'Experience Match', score: analysis.categoryScores.experienceImpact || 0 },
              { label: 'Education Match', score: analysis.categoryScores.educationRelevance || 0 },
              { label: 'Keywords Match', score: analysis.categoryScores.keywordOptimization || 0 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-[#8B93A1]">{item.label}</span>
                  <span className="text-[#F5F7FA] font-medium">{item.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#242A35] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6366F1] rounded-full"
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
                      <span key={idx} className="px-3 py-1 bg-[#101318] border border-[#242A35] rounded-md text-[12px] text-[#F5F7FA]">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#8B93A1]">No specific skills detected.</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-[13px] text-[#8B93A1] font-medium mb-3">Missing Skills (Keywords)</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords?.length > 0 ? (
                    analysis.missingKeywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#101318] border border-[#242A35] rounded-md text-[12px] text-[#F5F7FA]">
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
                      <span key={idx} className="px-3 py-1 bg-[#101318] border border-[#242A35] rounded-md text-[12px] text-[#F5F7FA]">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-[#151922] rounded-xl border border-[#242A35] p-8">
            <h2 className="text-[15px] font-medium text-[#F5F7FA] mb-6 border-b border-[#242A35] pb-4">
              AI Recommendations
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
