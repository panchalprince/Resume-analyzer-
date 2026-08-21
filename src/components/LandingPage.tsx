import React from "react";
import { Sparkles, ArrowRight, CheckCircle2, Lock } from "lucide-react";

interface LandingPageProps {
  onStartUpload: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartUpload,
}) => {
  return (
    <div id="landing-page-container" className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#6366F1]/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="max-w-3xl w-full text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#242A35] bg-[#101318] text-[#8B93A1] text-[12px] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
            <span>AI-Powered ATS Resume Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold text-[#F5F7FA] tracking-tight leading-tight">
            Make Your Resume <br/>
            <span className="text-[#6366F1]">ATS-Ready</span> in Seconds
          </h1>

          <p className="text-[15px] text-[#8B93A1] max-w-xl mx-auto leading-relaxed">
            Upload your resume and get instant AI-powered feedback: accurate ATS score, missing keywords, skill detection, and actionable achievement rewriting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              id="landing-analyze-resume-btn"
              onClick={onStartUpload}
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[14px] font-medium transition-colors flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Analyze My Resume</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-[12px] text-[#8B93A1] pt-6">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>PDF & DOCX Support</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>100% Private</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-[#242A35] text-[#8B93A1] text-[12px] text-center">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
          <span className="font-medium text-[#F5F7FA]">SP ResumAI</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};
