import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Zap,
  Award,
  Layers,
  Cpu,
  TrendingUp,
  FileText,
  Lock,
  ChevronRight,
} from "lucide-react";
import { ScoreGauge } from "./ScoreGauge.js";
import { SAMPLE_RESUMES } from "../data/sampleResumes.js";

interface LandingPageProps {
  onStartUpload: () => void;
  onSelectSample: (sampleId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartUpload,
  onSelectSample,
}) => {
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");

  const features = [
    {
      icon: Award,
      title: "ATS Score Calculation",
      description:
        "Comprehensive 0–100 scoring based on industry standards (Workday, Taleo, Greenhouse), evaluating keyword density, formatting, structure, and impact.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: FileSearch,
      title: "In-Depth Section Analysis",
      description:
        "Rigorous section-by-section audit of Summary, Work Experience, Education, Technical Skills, and Projects with customized grades and action steps.",
      color: "from-indigo-500 to-purple-600",
    },
    {
      icon: Layers,
      title: "Keyword & Skill Detection",
      description:
        "Extracts and categorizes your technical skills, soft skills, tools, and programming languages, highlighting high-priority missing ATS keywords.",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: Zap,
      title: "Measurable Bullet Rewriter",
      description:
        "Transform weak, task-based bullet points into compelling, accomplishment-driven statements with quantifiable metrics and power action verbs.",
      color: "from-amber-500 to-orange-600",
    },
    {
      icon: ShieldCheck,
      title: "Formatting & Layout Audit",
      description:
        "Detects parser blockers such as irregular tables, non-standard section headers, font inconsistencies, and length risks before recruiters see them.",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div
      id="landing-page-container"
      className="flex flex-col min-h-screen bg-slate-50 text-slate-900 transition-colors"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 ">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-400/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-sky-400/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 text-indigo-700 text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span>Next-Generation ATS & Resume Optimization</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                Make Your Resume{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-500 bg-clip-text text-transparent">
                  ATS-Ready
                </span>{" "}
                in Seconds
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Upload your resume in PDF or DOCX format and get instant
                AI-powered feedback: accurate ATS score, strengths, weaknesses,
                missing keywords, skill detection, and rewritten achievement
                bullets.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  id="hero-analyze-cta-btn"
                  onClick={onStartUpload}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Analyze My Resume</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-medium text-slate-500 ">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>PDF, DOCX & Text support</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>0–100 Recruiter Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  <span>100% Private & Secure</span>
                </div>
              </div>

              {/* Sample 1-Click Pickers */}
              <div className="pt-4 border-t border-slate-200 ">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Or test instantly with a pre-loaded sample resume:
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {SAMPLE_RESUMES.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => onSelectSample(sample.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 :text-indigo-400 shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{sample.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
                {/* Header ribbon */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 ">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 ">
                      Live AI Score Breakdown
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    ATS Elite Tier
                  </span>
                </div>

                {/* Score Gauge & Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                    <ScoreGauge
                      score={88}
                      size="md"
                      label="ATS Overall Score"
                      sublabel="Top 8% of Applicants"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 ">Keyword Density</span>
                        <span className="text-indigo-600 font-bold">92%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: "92%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 ">
                          Quantifiable Metrics
                        </span>
                        <span className="text-emerald-600 font-bold">85%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: "85%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 ">
                          Structure & Formatting
                        </span>
                        <span className="text-blue-600 font-bold">95%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: "95%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detected Keywords Tag Cloud */}
                <div className="mt-4 pt-4 border-t border-slate-100 ">
                  <span className="text-xs font-semibold text-slate-500 block mb-2">
                    Detected Core Competencies & Keywords:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "TypeScript",
                      "React 18",
                      "Node.js",
                      "AWS ECS",
                      "Microservices",
                      "PostgreSQL",
                      "CI/CD",
                    ].map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200 "
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Rewritten Preview Box */}
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>AI Achievement Rewrite Engine</span>
                  </div>
                  <p className="text-slate-600 line-through text-[11px]">
                    "Worked on speeding up the database query engine."
                  </p>
                  <p className="text-emerald-700 font-medium text-[11px] mt-1">
                    → "Optimized SQL query indexes and added Redis caching,
                    slashing p95 latency by 86%."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Feature Cards */}
      <section className="py-20 bg-white border-b border-slate-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 ">
              Enterprise-Grade Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Pass the 6-Second Recruiter Screen
            </h2>
            <p className="text-slate-600 text-base">
              Modern applicant tracking systems automatically reject up to 75%
              of resumes. SP ResumAI ensures your credentials stand out at the
              top of the pile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md hover:border-indigo-300 :border-indigo-800 transition-all duration-200 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} flex items-center justify-center text-white shadow-md mb-5 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Before & After Showcase */}
      <section className="py-20 bg-slate-50 border-b border-slate-200 ">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 ">
              The AI Advantage
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              See the Difference: Passive Duty vs. Impact Metric
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Recruiters look for the Google XYZ format: Accomplished [X] as
              measured by [Y], by doing [Z].
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weak / Standard Resume */}
            <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-rose-100 ">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span className="text-sm font-bold text-rose-700 ">
                  Standard Passive Resume (ATS Score: 52/100)
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 ">
                <li className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 ">
                  ❌ "Responsible for developing backend web applications using
                  Node.js."
                </li>
                <li className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 ">
                  ❌ "Worked on team projects and fixed bugs in Jira."
                </li>
                <li className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 ">
                  ❌ "Assisted in customer onboarding and improved retention."
                </li>
              </ul>
            </div>

            {/* AI Optimized Resume */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-emerald-100 ">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-700 ">
                  SP ResumAI Optimized (ATS Score: 94/100)
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700 ">
                <li className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 font-medium">
                  ✅ "Architected Node.js/GraphQL microservices handling 120k
                  daily requests with 99.98% uptime."
                </li>
                <li className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 font-medium">
                  ✅ "Instituted automated CI/CD and unit testing with Jest,
                  reducing production defects by 40%."
                </li>
                <li className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 font-medium">
                  ✅ "Redesigned self-serve onboarding flow, accelerating
                  time-to-first-value by 35% and boosting retention."
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Pledge Banner */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Privacy & Data Ownership First
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Your resume is parsed securely on server-side functions. We
                  never sell your personal data or share resumes with third
                  parties. You maintain 100% deletion rights anytime.
                </p>
              </div>
            </div>

            <button
              onClick={onStartUpload}
              className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shrink-0 transition-colors"
            >
              Analyze Securely Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 bg-white text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-800 ">SP ResumAI</span>
            <span>— AI-Powered ATS Resume Intelligence</span>
          </div>
          <p>
            © {new Date().getFullYear()} SP ResumAI. Built for high-impact
            career growth.
          </p>
        </div>
      </footer>
    </div>
  );
};
