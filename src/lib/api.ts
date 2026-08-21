import {
  ResumeAnalysisResult,
  JobMatchResult,
  ExtractedResumeData,
} from "../types.js";
import { extractResumeFileClient } from "./extractorClient.js";
import { runClientATSAnalysis, runClientJobMatch } from "./atsEngine.js";

/**
 * Retrieves the configured backend API base URL.
 * Checks VITE_API_URL, VITE_BACKEND_URL, and VITE_API_BASE_URL.
 * When empty, relative URLs (same-origin) are used.
 */
export function getApiBaseUrl(): string {
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "";
}

/**
 * Builds the full endpoint URL using the configured API base URL.
 */
export function buildApiUrl(endpointPath: string): string {
  const base = getApiBaseUrl();
  const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return `${base}${cleanPath}`;
}

/**
 * Safely parse JSON from a fetch response, preventing `Unexpected token '<'` syntax crashes
 * when a static hosting provider (e.g. AWS Amplify, SPA server) returns index.html.
 */
async function safeFetchJson<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const fullUrl = path.startsWith("http://") || path.startsWith("https://") ? path : buildApiUrl(path);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

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

  let data: any = null;
  if (trimmed.length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      (trimmed.length > 0 && !trimmed.startsWith("<") ? trimmed : `Request failed with status ${res.status}`);
    throw new Error(errorMsg);
  }

  if (data === null) {
    throw new Error(
      trimmed.length > 0
        ? `Invalid response format from server: ${trimmed.substring(0, 80)}`
        : `Empty response received from server (${res.status})`
    );
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
 * Attempts Gemini API server-side, with seamless fallback to client-side ATS analysis engine.
 */
export async function apiAnalyzeResume(params: {
  resumeText: string;
  filename: string;
  targetRole?: string;
  jobDescription?: string;
}): Promise<ResumeAnalysisResult> {
  try {
    const data = await safeFetchJson<ResumeAnalysisResult>("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: params.resumeText,
        filename: params.filename,
        targetRole: params.targetRole,
        jobDescription: params.jobDescription,
      }),
    });

    if (data && typeof data.atsScore === "number") {
      return data;
    }
  } catch (err: any) {
    console.warn(
      "[API] Server analysis unavailable or failed, seamlessly using built-in ATS engine:",
      err?.message || err
    );
  }

  // Seamless client-side ATS engine fallback
  return runClientATSAnalysis(
    params.resumeText,
    params.filename,
    params.targetRole,
    params.jobDescription,
  );
}

/**
 * Job Match Analysis
 * Attempts server matching, with seamless fallback to client-side matcher.
 */
export async function apiJobMatch(params: {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  resumeId?: string;
}): Promise<JobMatchResult> {
  try {
    const data = await safeFetchJson<JobMatchResult>("/api/job-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (data && typeof data.matchScore === "number") {
      return data;
    }
  } catch (err: any) {
    console.warn(
      "[API] Server job matching unavailable, seamlessly using built-in matcher:",
      err?.message || err
    );
  }

  return runClientJobMatch(
    params.resumeText,
    params.jobDescription,
    params.jobTitle,
  );
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
    const data = await safeFetchJson<{
      metricsFocused: string;
      actionOriented: string;
      atsOptimized: string;
      critique: string;
    }>("/api/rewrite-bullet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bullet, context }),
    });

    if (data && data.atsOptimized) {
      return data;
    }
  } catch (err) {
    console.warn("[API] Bullet rewrite fallback to local format:", err);
  }

  const clean = bullet.trim();
  const verbStripped = clean.toLowerCase().replace(/^(worked on|responsible for|helped with|built|created)\s*/i, "");

  return {
    metricsFocused: `Spearheaded ${verbStripped}, driving a 35% improvement in core metrics and supporting 10,000+ users.`,
    actionOriented: `Engineered and deployed ${verbStripped}, optimizing production workflow turnaround by 40%.`,
    atsOptimized: `Architected scalable solutions for ${verbStripped}, ensuring compliance with ATS criteria and technical standards.`,
    critique: "Enhanced with quantifiable scale metrics and strong leadership action verbs to maximize ATS parsing index.",
  };
}


