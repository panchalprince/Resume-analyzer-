import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileType,
  ArrowRight,
  Zap,
  Layers,
  Code,
  Briefcase,
  GraduationCap,
  Eye,
  FileCheck,
  X,
} from "lucide-react";
import { formatFileSize } from "../lib/utils.js";
import { ExtractedResumeData, ResumeAnalysisResult } from "../types.js";
import { SAMPLE_RESUMES, SampleResumePreset } from "../data/sampleResumes.js";
import { apiExtractResume, apiAnalyzeResume } from "../lib/api.js";

interface ResumeUploadProps {
  onAnalysisComplete: (result: ResumeAnalysisResult) => void;
  userId?: string;
  onSelectSampleDirect?: (sample: SampleResumePreset) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onAnalysisComplete,
  userId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [activeInputMode, setActiveInputMode] = useState<
    "file" | "paste" | "samples"
  >("file");
  const [targetRole, setTargetRole] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] =
    useState<ExtractedResumeData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = async (selectedFile: File) => {
    setError(null);
    setExtractedData(null);

    // Validate size (10 MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(
        "File size exceeds 10 MB limit. Please compress or select a smaller document.",
      );
      return;
    }

    // Validate type (.pdf, .docx, .doc, .txt)
    const validExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const fileNameLower = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setError(
        "Invalid file type. Please upload a PDF (.pdf), Microsoft Word (.docx, .doc), or plain text file (.txt).",
      );
      return;
    }

    setFile(selectedFile);
    setIsExtracting(true);
    setUploadProgress(35);

    try {
      setUploadProgress(65);
      const data = await apiExtractResume(selectedFile);
      setUploadProgress(100);

      if (
        !data ||
        !data.extractedText ||
        data.extractedText.trim().length === 0
      ) {
        throw new Error(
          "No readable text found in document. Please paste your resume text directly.",
        );
      }

      setExtractedData(data);
      setPastedText(data.extractedText);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(
        err.message ||
          "Failed to read resume text. You can paste your resume text directly below.",
      );
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTabSwitch = (mode: "file" | "paste" | "samples") => {
    setActiveInputMode(mode);
    setError(null);
  };

  const handleSelectPreset = (preset: SampleResumePreset) => {
    setFile(null);
    setPastedText(preset.text);
    setTargetRole(preset.role);
    setExtractedData({
      filename: preset.filename,
      fileSize: 1024,
      extractedText: preset.text,
      wordCount: preset.text.split(/\s+/).filter(Boolean).length,
      detectedSections: {},
    });
    setError(null);
  };

  const handleAnalyze = async () => {
    const textToAnalyze = pastedText.trim();
    if (!textToAnalyze || textToAnalyze.length < 20) {
      setError(
        "Please upload a resume or enter at least 20 characters of resume text to analyze.",
      );
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const data = await apiAnalyzeResume({
        resumeText: textToAnalyze,
        filename: file?.name || extractedData?.filename || "My_Resume.pdf",
        userId: userId || "demo-user-123",
        targetRole: targetRole.trim() || undefined,
      });

      onAnalysisComplete(data);
    } catch (err: any) {
      console.error("Analysis failure:", err);
      setError(
        err.message ||
          "Failed to analyze resume. Please check connection and try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      id="resume-upload-page"
      className="max-w-4xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-2xl font-semibold text-[#F5F7FA] tracking-tight">
          Resume Analyzer
        </h1>
        <p className="text-[14px] text-[#8B93A1] mt-1">
          Upload a resume and analyze its ATS compatibility using AI.
        </p>
      </div>

      {/* Main Upload Container */}
      <div className="grid grid-cols-1 gap-8">
        {/* Upload Box */}
        <div className="bg-[#151922] rounded-xl border border-[#242A35] p-8">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                isDragging
                  ? "border-[#6366F1] bg-[#6366F1]/5"
                  : "border-[#242A35] hover:border-[#6366F1] hover:bg-[#101318]/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
              />
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-base font-medium text-[#F5F7FA] mb-2">
                Drop your resume here
              </h3>
              <p className="text-[13px] text-[#8B93A1] mb-6">
                PDF, DOC, DOCX up to 10MB
              </p>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-transparent border border-[#242A35] text-[#F5F7FA] text-[13px] font-medium hover:bg-[#242A35] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
              >
                Choose Resume
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[#242A35] bg-[#101318] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center shrink-0 border border-[#6366F1]/20">
                    <FileType className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#F5F7FA] truncate max-w-[200px] sm:max-w-md">
                      {file.name}
                    </h4>
                    <p className="text-[12px] text-[#8B93A1] mt-0.5">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              {isExtracting && (
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-[#6366F1] mb-1.5">
                    <span>Extracting text...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#242A35] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6366F1] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 text-[12px] text-[#8B93A1]">
            Supported formats: PDF, DOC, DOCX
          </div>
        </div>

        {/* Job Description Area */}
        <div className="bg-[#151922] rounded-xl border border-[#242A35] p-8">
           <h3 className="text-[15px] font-medium text-[#F5F7FA] mb-4">
            Job Description
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8B93A1] mb-2">
                Target Job Title (Optional)
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-4 py-2.5 text-[13px] rounded-lg border border-[#242A35] bg-[#101318] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#8B93A1]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8B93A1] mb-2">
                Paste Job Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Paste the job description here..."
                className="w-full px-4 py-2.5 text-[13px] rounded-lg border border-[#242A35] bg-[#101318] text-[#F5F7FA] focus:outline-hidden focus:border-[#6366F1] placeholder:text-[#8B93A1] resize-none"
              />
            </div>
           </div>

           {/* Error Notice */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[13px] text-[#EF4444] flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
              <button onClick={() => setError(null)}>
                <X className="w-4 h-4 hover:text-[#EF4444]/80" />
              </button>
            </div>
          )}

           <button
             id="analyze-resume-submit-btn"
             type="button"
             onClick={handleAnalyze}
             disabled={isAnalyzing || isExtracting || (!file && !pastedText.trim())}
             className="px-6 py-2.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[13px] transition-colors flex items-center gap-2 cursor-pointer"
           >
             {isAnalyzing ? (
               <>
                 <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 <span>Analyzing...</span>
               </>
             ) : (
               <span>Analyze Match</span>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};
