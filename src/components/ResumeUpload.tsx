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
} from "lucide-react";
import { formatFileSize } from "../lib/utils.js";
import { ExtractedResumeData, ResumeAnalysisResult } from "../types.js";
import { SAMPLE_RESUMES, SampleResumePreset } from "../data/sampleResumes.js";

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
  const [activeInputMode, setActiveInputMode] = useState<"file" | "paste" | "samples">("file");
  const [targetRole, setTargetRole] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedResumeData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = async (selectedFile: File) => {
    setError(null);
    setExtractedData(null);

    // Validate size (10 MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10 MB limit. Please compress or select a smaller document.");
      return;
    }

    // Validate type (.pdf, .docx, .doc, .txt)
    const validExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const fileNameLower = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setError("Invalid file type. Please upload a PDF (.pdf), Microsoft Word (.docx, .doc), or plain text file (.txt).");
      return;
    }

    setFile(selectedFile);
    setIsExtracting(true);
    setUploadProgress(25);

    try {
      // Convert to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setUploadProgress(60);

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data,
          filename: selectedFile.name,
          mimeType: selectedFile.type,
        }),
      });

      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse text from resume file.");
      }

      setExtractedData(data);
      setPastedText(data.extractedText);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(err.message || "Failed to read resume text. You can paste your resume text directly below.");
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

  const handleSelectPreset = (preset: SampleResumePreset) => {
    setFile(null);
    setPastedText(preset.text);
    setTargetRole(preset.role);
    setExtractedData({
      filename: preset.filename,
      fileSize: Buffer.byteLength(preset.text, "utf8"),
      extractedText: preset.text,
      wordCount: preset.text.split(/\s+/).length,
      detectedSections: {},
    });
    setActiveInputMode("paste");
    setError(null);
  };

  const handleAnalyze = async () => {
    const textToAnalyze = pastedText.trim();
    if (!textToAnalyze || textToAnalyze.length < 20) {
      setError("Please upload a resume or enter at least 20 characters of resume text to analyze.");
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: textToAnalyze,
          filename: file?.name || extractedData?.filename || "My_Resume.pdf",
          userId: userId || "demo-user-123",
          targetRole: targetRole.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Resume analysis failed. Please try again.");
      }

      onAnalysisComplete(data);
    } catch (err: any) {
      console.error("Analysis failure:", err);
      setError(err.message || "Failed to analyze resume. Please check connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="resume-upload-page" className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Intelligent ATS Parser & Evaluator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Upload Your Resume for AI Analysis
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          We extract every section, calculate your 0–100 ATS score, flag missing keywords, and suggest high-impact bullet point rewrites.
        </p>
      </div>

      {/* Input Mode Selector Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveInputMode("file")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeInputMode === "file"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF / DOCX</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInputMode("paste")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeInputMode === "paste"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Resume Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInputMode("samples")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeInputMode === "samples"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Try Sample Resumes</span>
          </button>
        </div>
      </div>

      {/* Main Upload Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Optional Target Role Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Target Job Title / Career Focus (Optional)
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Software Engineer, Product Marketing Manager, Data Scientist"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Helps the AI tune keyword density and industry specific ATS algorithms.
          </p>
        </div>

        {/* Mode 1: File Upload Drag & Drop */}
        {activeInputMode === "file" && (
          <div>
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]"
                    : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/60 dark:hover:bg-slate-950/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Drag and drop your resume here, or{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300">
                    Browse Files
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Supports PDF (.pdf), Microsoft Word (.docx, .doc), or Text (.txt) up to 10 MB.
                </p>
              </div>
            ) : (
              /* Selected File Card */
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                      <FileType className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                        {file.name}
                      </h4>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {extractedData && (
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(!previewOpen)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{previewOpen ? "Hide Text" : "View Extracted Text"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {isExtracting && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-indigo-600 mb-1">
                      <span>Extracting resume sections...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Extraction Success Indicator */}
                {extractedData && !isExtracting && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>
                        Successfully parsed {extractedData.wordCount} words
                        {extractedData.pageCount ? ` across ${extractedData.pageCount} page(s)` : ""}.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Paste Raw Text */}
        {activeInputMode === "paste" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Paste Complete Resume Text
            </label>
            <textarea
              rows={10}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the text of your resume here (Summary, Skills, Experience, Education, etc.)..."
              className="w-full p-4 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>{pastedText.split(/\s+/).filter(Boolean).length} words</span>
              {pastedText.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPastedText("")}
                  className="text-rose-500 hover:underline font-medium"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mode 3: Pre-loaded Benchmark Samples */}
        {activeInputMode === "samples" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Select a pre-loaded professional profile to test instant ATS analysis:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_RESUMES.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {preset.experienceLevel}
                    </span>
                    <Zap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {preset.role}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 pt-1 flex items-center gap-1">
                    <span>Load This Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Text Collapsible Preview */}
        {previewOpen && extractedData && (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono max-h-60 overflow-y-auto">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-2 font-sans">
              Extracted Raw Text Preview:
            </h5>
            <pre className="whitespace-pre-wrap text-slate-600 dark:text-slate-400">
              {extractedData.extractedText}
            </pre>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Upload / Extraction Notice:</span>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            id="analyze-resume-submit-btn"
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || isExtracting || (!file && !pastedText.trim())}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Deep ATS Analysis with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze Resume & Calculate ATS Score</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
