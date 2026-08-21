import {
  ResumeAnalysisResult,
  JobMatchResult,
  ExtractedResumeData,
  UserProfile,
} from "../types.js";
import { extractResumeFileClient } from "./extractorClient.js";
import { buildApiUrl, getAuthToken } from "./auth.js";

/**
 * Safely parse JSON from a fetch response, preventing `Unexpected token '<'` syntax crashes
 * when a static hosting provider (e.g. AWS Amplify, SPA server) returns index.html.
 */
async function safeFetchJson<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const fullUrl = path.startsWith("http://") || path.startsWith("https://") ? path : buildApiUrl(path);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error(`[API] Network error requesting ${fullUrl}:`, netErr);
    throw new Error(
      `Unable to connect to backend server at ${fullUrl}. Please verify backend service is running.`
    );
  }

  const text = await res.text();
  const trimmed = text.trim();
  const isHtml =
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<head");

  if (isHtml) {
    throw new Error(
      `Server returned an HTML response for ${path}. If hosted on AWS Amplify, check VITE_API_URL.`,
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
 * Uses Gemini API on the backend.
 */
export async function apiAnalyzeResume(params: {
  resumeText: string;
  filename: string;
  userId?: string;
  targetRole?: string;
  jobDescription?: string;
}): Promise<ResumeAnalysisResult> {
  const userId = params.userId || "demo-user-123";

  return await safeFetchJson<ResumeAnalysisResult>("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resumeText: params.resumeText,
      filename: params.filename,
      userId,
      targetRole: params.targetRole,
      jobDescription: params.jobDescription,
    }),
  });
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
  return await safeFetchJson<JobMatchResult>("/api/job-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
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
  return await safeFetchJson("/api/rewrite-bullet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bullet, context }),
  });
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

