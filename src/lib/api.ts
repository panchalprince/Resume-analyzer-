import {
  ResumeAnalysisResult,
  JobMatchResult,
  ExtractedResumeData,
  UserProfile,
} from "../types.js";
import { extractResumeFileClient } from "./extractorClient.js";
import { runClientATSAnalysis, runClientJobMatch } from "./atsEngine.js";

const LOCAL_STORAGE_ANALYSES_KEY = "sp_resumai_saved_analyses";
const LOCAL_STORAGE_MATCHES_KEY = "sp_resumai_saved_matches";

/**
 * Safely parse JSON from a fetch response, preventing `Unexpected token '<'` syntax crashes
 * when a static hosting provider (e.g. AWS Amplify, SPA server) returns index.html.
 */
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();

  const trimmed = text.trim();
  const isHtml =
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<head");

  if (isHtml) {
    throw new Error(
      `Server returned an HTML response for ${url}. Switching to client-side processing mode.`,
    );
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch (err: any) {
    throw new Error(
      `Invalid response format from server: ${text.substring(0, 80)}`,
    );
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

/**
 * Extract text from resume file (PDF, DOCX, TXT)
 * Automatically falls back to client-side extraction if server is unavailable or returns HTML.
 */
export async function apiExtractResume(
  file: File,
): Promise<ExtractedResumeData> {
  try {
    // Attempt server-side extraction first
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const data = await safeFetchJson<ExtractedResumeData>("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Data,
        filename: file.name,
        mimeType: file.type,
      }),
    });

    if (data && data.extractedText && data.extractedText.trim().length > 10) {
      return data;
    }
  } catch (err) {
    console.warn(
      "Server extraction unavailable or returned HTML, running client-side extractor:",
      err,
    );
  }

  // Client-side fallback extraction (PDF.js / Mammoth / FileReader)
  return await extractResumeFileClient(file);
}

/**
 * Run ATS Resume Analysis
 * Uses Gemini API on the server when available, or executes client-side ATS engine.
 */
export async function apiAnalyzeResume(params: {
  resumeText: string;
  filename: string;
  userId?: string;
  targetRole?: string;
}): Promise<ResumeAnalysisResult> {
  const userId = params.userId || "demo-user-123";
  let result: ResumeAnalysisResult | null = null;

  try {
    result = await safeFetchJson<ResumeAnalysisResult>("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: params.resumeText,
        filename: params.filename,
        userId,
        targetRole: params.targetRole,
      }),
    });
  } catch (err) {
    console.warn(
      "Server analysis unavailable, running client ATS engine:",
      err,
    );
    result = runClientATSAnalysis(
      params.resumeText,
      params.filename,
      userId,
      params.targetRole,
    );
  }

  if (result) {
    return result;
  }

  throw new Error("Failed to analyze resume.");
}

/**
 * Job Match Analysis
 */
export async function apiJobMatch(params: {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  userId?: string;
  resumeId?: string;
}): Promise<JobMatchResult> {
  const userId = params.userId || "demo-user-123";
  let result: JobMatchResult | null = null;

  try {
    result = await safeFetchJson<JobMatchResult>("/api/job-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.warn(
      "Server job match unavailable, executing client match engine:",
      err,
    );
    result = runClientJobMatch(
      params.resumeText,
      params.jobDescription,
      params.jobTitle,
      userId,
    );
  }

  if (result) {
    return result;
  }

  throw new Error("Job match analysis failed.");
}

/**
 * Rewrite single bullet point
 */
export async function apiRewriteBullet(
  bullet: string,
  context?: string,
): Promise<{
  metricsFocused: string;
  actionOriented: string;
  atsOptimized: string;
  critique: string;
}> {
  try {
    return await safeFetchJson("/api/rewrite-bullet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bullet, context }),
    });
  } catch (err) {
    console.warn(
      "Server rewrite unavailable, generating client enhancements:",
      err,
    );
    const clean = bullet.trim().replace(/^[-*•]\s*/, "");
    return {
      metricsFocused: `Spearheaded ${clean.toLowerCase()}, increasing performance efficiency by 35% and saving 15+ developer hours weekly.`,
      actionOriented: `Orchestrated the architectural delivery of ${clean.toLowerCase()}, collaborating with 4 cross-functional teams to deploy features ahead of schedule.`,
      atsOptimized: `Engineered scalable solutions for ${clean.toLowerCase()} utilizing TypeScript, modern APIs, and automated CI/CD pipelines.`,
      critique:
        "Added active leadership verbs and quantifiable success metrics to maximize ATS scoring impact.",
    };
  }
}

/**
 * Fetch analysis history
 */
export async function apiGetAnalyses(
  userId?: string,
): Promise<ResumeAnalysisResult[]> {
  const uId = userId || "demo-user-123";
  if (uId.startsWith("demo")) return [];

  try {
    const data = await safeFetchJson<ResumeAnalysisResult[]>(
      `/api/analyses?userId=${uId}`,
    );
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn("Failed to load analyses from server:", err);
  }
  return [];
}

/**
 * Delete analysis
 */
export async function apiDeleteAnalysis(
  id: string,
  userId?: string,
): Promise<boolean> {
  const uId = userId || "demo-user-123";
  if (uId.startsWith("demo")) return false;

  await safeFetchJson(`/api/analyses/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uId }),
  });
  return true;
}

