import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  FileType,
  X,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { formatFileSize } from "../lib/utils.js";
import { ExtractedResumeData, ResumeAnalysisResult } from "../types.js";
import { apiExtractResume, apiAnalyzeResume } from "../lib/api.js";

interface ResumeUploadProps {
  onAnalysisComplete: (result: ResumeAnalysisResult) => void;
  onOpenHistory?: () => void;
}

const ROLE_SUGGESTIONS = [
  "Embedded Systems Engineer",
  "Software Engineer",
  "VLSI Engineer",
  "Automotive Engineer",
  "Data Analyst",
];

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onAnalysisComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] =
    useState<ExtractedResumeData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRequestInProgressRef = useRef(false);

  const validateAndProcessFile = async (selectedFile: File) => {
    setError(null);
    setExtractedData(null);
    setIsCompleted(false);

    // Validate size (10 MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(
        "File size exceeds 10 MB limit. Please select a smaller resume file.",
      );
      return;
    }

    // Validate type (.pdf, .docx, .doc, .txt)
    const validExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const fileNameLower = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setError(
        "Invalid file type. Please upload a PDF (.pdf), Microsoft Word (.docx, .doc), or text file (.txt).",
      );
      return;
    }

    setFile(selectedFile);
    setIsExtracting(true);
    setAnalysisStage("Uploading resume document...");
    setUploadProgress(25);

    try {
      setAnalysisStage("Extracting text and structure...");
      setUploadProgress(65);
      const data = await apiExtractResume(selectedFile);
      setUploadProgress(100);

      if (
        !data ||
        !data.extractedText ||
        data.extractedText.trim().length === 0
      ) {
        throw new Error(
          "Could not extract readable text from document. Please ensure the file is not password-protected or scanned image.",
        );
      }

      setExtractedData(data);
      setPastedText(data.extractedText);
      setAnalysisStage("");
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(
        err.message ||
          "Failed to read resume document. Please check the file and try again.",
      );
      setAnalysisStage("");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExtractedData(null);
    setPastedText("");
    setError(null);
    setUploadProgress(0);
    setAnalysisStage("");
    setIsCompleted(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectRoleSuggestion = (role: string) => {
    setTargetRole(role);
    setError(null);
  };

  const hasResume = Boolean(file || pastedText.trim().length >= 20);
  const hasTargetRole = Boolean(targetRole.trim());
  const canAnalyze = hasResume && hasTargetRole && !isAnalyzing && !isExtracting;

  const handleAnalyze = async () => {
    if (!canAnalyze || isRequestInProgressRef.current) {
      if (!hasResume) {
        setError("Please upload a resume file (PDF or DOCX) to begin.");
      } else if (!hasTargetRole) {
        setError("Please enter or select a Target Job / Role to evaluate your resume against.");
      }
      return;
    }

    isRequestInProgressRef.current = true;
    setError(null);
    setIsAnalyzing(true);
    setIsCompleted(false);

    setAnalysisStage(`Evaluating resume against "${targetRole.trim()}"...`);

    const stageTimer1 = setTimeout(() => {
      setAnalysisStage("Evaluating ATS parsing & keyword density...");
    }, 500);

    const stageTimer2 = setTimeout(() => {
      setAnalysisStage("Generating role-specific recommendations...");
    }, 1100);

    try {
      const data = await apiAnalyzeResume({
        resumeText: pastedText.trim(),
        filename: file?.name || extractedData?.filename || "My_Resume.pdf",
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim() || undefined,
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setAnalysisStage("Analysis complete!");
      setIsCompleted(true);

      setTimeout(() => {
        onAnalysisComplete(data);
      }, 350);
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      console.error("Analysis failure:", err);
      setError(
        err.message ||
          "Failed to complete resume analysis. Please try again.",
      );
      setAnalysisStage("");
    } finally {
      setIsAnalyzing(false);
      isRequestInProgressRef.current = false;
    }
  };

  return (
    <div id="resume-upload-view" className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Title & Context */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] tracking-tight mb-2">
          Resume Analyzer
        </h1>
        <p className="text-[14px] text-[#8B93A1] max-w-lg mx-auto">
          Evaluate your resume's ATS compatibility, skill alignment, and scoring
          specifically targeted to your desired job title.
        </p>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-[#161B22] rounded-2xl border border-[#242A35] shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 space-y-7">
          {/* Section 1: Resume Upload Area */}
          <div>
            <label className="block text-[13px] font-semibold text-[#F5F7FA] mb-2.5 flex items-center justify-between">
              <span>1. Upload Resume</span>
              <span className="text-[11px] font-normal text-[#8B93A1]">
                PDF, DOCX up to 10MB
              </span>
            </label>

            {!file ? (
              <div
                id="dropzone-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-[#6366F1] bg-[#6366F1]/10"
                    : "border-[#2E3644] hover:border-[#6366F1]/80 hover:bg-[#1C222D]"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 text-[#818CF8] flex items-center justify-center mb-3.5 border border-[#6366F1]/20">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F7FA] mb-1">
                  Drag and drop your resume here
                </h3>
                <p className="text-[12px] text-[#8B93A1] mb-4">
                  Supports PDF or Word documents
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowseClick();
                  }}
                  className="px-4 py-2 rounded-lg bg-[#21262D] hover:bg-[#2B323D] border border-[#30363D] text-[#F5F7FA] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Browse File
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-[#242A35] bg-[#0E1117] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#6366F1]/15 text-[#818CF8] flex items-center justify-center shrink-0 border border-[#6366F1]/30">
                      <FileType className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-[#F5F7FA] truncate">
                        {file.name}
                      </h4>
                      <p className="text-[12px] text-[#8B93A1]">
                        {formatFileSize(file.size)} • {file.name.split(".").pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isAnalyzing || isExtracting}
                    className="p-2 text-[#8B93A1] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Extraction progress indicator */}
                {isExtracting && (
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#818CF8] mb-1.5">
                      <span>{analysisStage || "Extracting resume text..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6366F1] rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Target Job / Role */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-semibold text-[#F5F7FA]">
                2. Target Job / Role <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-[#8B93A1]">
                Required for role matching
              </span>
            </div>

            <div className="relative mb-2.5">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B93A1]">
                <Briefcase className="w-4 h-4" />
              </div>
              <input
                id="target-role-input"
                type="text"
                value={targetRole}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  setError(null);
                }}
                disabled={isAnalyzing}
                placeholder="e.g. Embedded Systems Engineer"
                className="w-full pl-10 pr-4 py-2.5 text-[13px] rounded-xl border border-[#2E3644] bg-[#0E1117] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#64748B] transition-colors"
              />
            </div>

            {/* Role Suggestion Chips */}
            <div>
              <div className="text-[11px] text-[#8B93A1] mb-1.5 font-medium">
                Quick Suggestions:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_SUGGESTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSelectRoleSuggestion(role)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      targetRole.toLowerCase() === role.toLowerCase()
                        ? "bg-[#6366F1] text-white border border-[#6366F1]"
                        : "bg-[#0E1117] hover:bg-[#21262D] text-[#94A3B8] border border-[#2E3644] hover:text-[#F5F7FA]"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Job Description (Optional) */}
          <div>
            <label className="block text-[13px] font-semibold text-[#F5F7FA] mb-2 flex items-center justify-between">
              <span>3. Job Description (Optional)</span>
              <span className="text-[11px] text-[#8B93A1]">For deep tailoring</span>
            </label>
            <textarea
              id="job-description-textarea"
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Paste job description or requirements here for deeper keyword match and customized suggestions..."
              className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-[#2E3644] bg-[#0E1117] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#64748B] resize-none transition-colors"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-400 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="cursor-pointer text-rose-400 hover:text-rose-300 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Live Analysis Progress Bar & Stage */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 space-y-2">
              <div className="flex items-center justify-between text-[12px] font-medium text-[#A5B4FC]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#A5B4FC] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{analysisStage}</span>
                </div>
                <span className="text-[11px] text-[#8B93A1]">AI Evaluator</span>
              </div>
              <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden">
                <div className="h-full bg-[#6366F1] rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              id="analyze-resume-submit-btn"
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                canAnalyze
                  ? "bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-[#6366F1]/20 hover:shadow-[#6366F1]/30 active:scale-[0.99]"
                  : "bg-[#21262D] text-[#64748B] border border-[#2E3644] cursor-not-allowed opacity-60"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Resume against {targetRole || "Role"}...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Analysis Ready!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <span>Analyze Resume</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!hasTargetRole && hasResume && (
              <p className="text-center text-[11px] text-[#8B93A1] mt-2">
                Please enter or select a target role above to enable analysis.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
