import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
let lastApiKey: string | undefined = undefined;

function getValidApiKey(): string {
  const currentApiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  ).trim();

  if (!currentApiKey || currentApiKey === "MY_GEMINI_API_KEY") {
    const err: any = new Error(
      "Gemini API key is not configured. Please configure GEMINI_API_KEY in the environment or Settings panel."
    );
    err.statusCode = 500;
    throw err;
  }

  return currentApiKey;
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getValidApiKey();

  if (!aiInstance || lastApiKey !== apiKey) {
    lastApiKey = apiKey;
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

export interface AIAnalysisPromptInput {
  resumeText: string;
  jobDescription?: string;
  targetRole?: string;
  filename?: string;
}

export interface CompactATSAnalysisResult {
  atsScore: number;
  candidate: {
    name: string;
    email: string;
    phone: string;
  };
  skills: string[];
  missingSkills: string[];
  experienceMatch: number;
  educationMatch: number;
  keywordMatch: number;
  skillsMatch?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  hiringRecommendation: string;
  experienceSummary?: string;
  educationSummary?: string;
}

// Fast Flash-class models prioritized for lowest latency and high quality ATS parsing
const SUPPORTED_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function is503Error(err: any): boolean {
  const status = err?.status || err?.statusCode || err?.code;
  const msg = (err?.message || "").toLowerCase();
  return (
    status === 503 ||
    status === "UNAVAILABLE" ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("high demand")
  );
}

function is429Error(err: any): boolean {
  const status = err?.status || err?.statusCode || err?.code;
  const msg = (err?.message || "").toLowerCase();
  return (
    status === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted")
  );
}

// 25s timeout for fast responsiveness
async function callWithTimeout<T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err: any = new Error("AI analysis is taking longer than expected. Please try again.");
      err.statusCode = 504;
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Compact clean text helper to reduce payload size and speed up tokenization
 */
export function compactText(text: string, maxLength = 8000): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\x20-\x7E\n\t]/g, " ") // strip non-printable/control chars
    .replace(/[ \t]+/g, " ") // collapse multiple spaces
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // collapse multiple blank lines
    .trim()
    .slice(0, maxLength);
}

async function callWithRetryAndFallback<T>(
  actionName: string,
  fn: (model: string) => Promise<T>
): Promise<T> {
  let lastError: any = null;

  for (const model of SUPPORTED_MODELS) {
    let retries = 0;
    const maxRetries = 2; // Max 2 retries per model on 429/transient error

    while (retries <= maxRetries) {
      try {
        return await callWithTimeout(fn(model), 25000);
      } catch (err: any) {
        lastError = err;

        // Check authentication errors
        const msg = (err?.message || "").toLowerCase();
        if (
          msg.includes("api key") ||
          msg.includes("api_key") ||
          err?.status === 401 ||
          err?.status === 403
        ) {
          const authErr: any = new Error(
            "Invalid or unauthorized Gemini API key. Please verify your API key in Settings."
          );
          authErr.statusCode = 401;
          throw authErr;
        }

        // 503 high demand: do not get stuck retrying the same model, quickly failover to next model
        if (is503Error(err)) {
          console.warn(`[Gemini API] ${actionName} on ${model} (503 High Demand). Switching to next fast model...`);
          await sleep(300);
          break; // break retry loop to try next model in SUPPORTED_MODELS
        }

        // 429 rate limit: limited retry with exponential backoff (max 2)
        if (is429Error(err)) {
          retries++;
          if (retries <= maxRetries) {
            const backoffMs = retries * 1200;
            console.warn(`[Gemini API] ${actionName} on ${model} (429 Rate Limit). Retry ${retries}/${maxRetries} in ${backoffMs}ms...`);
            await sleep(backoffMs);
            continue;
          }
          console.warn(`[Gemini API] ${actionName} on ${model} (429 limit reached). Switching to next fast model...`);
          break;
        }

        // If timeout or other error, break to try next model
        console.warn(`[Gemini API] ${actionName} on ${model} error: ${err?.message || "unknown"}. Falling over...`);
        break;
      }
    }
  }

  if (lastError?.message?.includes("taking longer than expected")) {
    const timeoutErr: any = new Error("AI analysis is taking longer than expected. Please try again.");
    timeoutErr.statusCode = 504;
    throw timeoutErr;
  }

  const genericError: any = new Error(
    lastError?.message && !lastError.message.includes("{")
      ? lastError.message
      : "AI service is temporarily busy. Please try again in a few moments."
  );
  genericError.statusCode = is503Error(lastError) ? 503 : is429Error(lastError) ? 429 : 500;
  throw genericError;
}

/**
 * 1 Single Optimized Gemini Call for complete ATS analysis:
 * - ATS Score
 * - Candidate Information (name, email, phone)
 * - Skills Detected
 * - Missing Skills
 * - Experience Match
 * - Education Match
 * - Keyword Match
 * - Strengths
 * - Weaknesses
 * - Recommendations
 * - Final Hiring Recommendation
 */
export async function generateResumeAnalysis(input: AIAnalysisPromptInput): Promise<CompactATSAnalysisResult> {
  const ai = getGeminiClient();

  const cleanResume = compactText(input.resumeText, 7000);
  const cleanJob = input.jobDescription ? compactText(input.jobDescription, 3000) : "";
  const roleContext = input.targetRole?.trim() || "";

  const prompt = `You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter.
Analyze this resume concisely against ATS algorithms and industry standards${cleanJob ? " and the specified Job Description" : roleContext ? ` for the target role: ${roleContext}` : ""}.

RESUME:
"""
${cleanResume}
"""
${cleanJob ? `\nJOB DESCRIPTION:\n"""\n${cleanJob}\n"""` : ""}

Evaluate strictly and return JSON matching this schema:
- atsScore: Integer 0-100 reflecting overall ATS compatibility, keyword match, and formatting strength.
- candidate: { name, email, phone } extracted from resume (use empty string "" if not found).
- skills: array of key technical & professional skills found (max 15).
- missingSkills: array of high-value missing skills or industry keywords for this profile (max 8).
- experienceMatch: integer 0-100 rating candidate's work history alignment.
- educationMatch: integer 0-100 rating candidate's educational credentials.
- keywordMatch: integer 0-100 rating ATS keyword optimization.
- skillsMatch: integer 0-100 rating hard/soft skills relevance.
- strengths: 3 to 4 concise, high-value bullet points.
- weaknesses: 3 to 4 concise, actionable weakness points.
- recommendations: 3 to 4 short, high-impact suggestions to improve ATS ranking.
- hiringRecommendation: one concise phrase (e.g., "Strong Match - Recommended for Interview", "Good Match - Address Missing Skills", "Fair Match - Needs Experience Alignment").
- experienceSummary: 1 brief sentence on years/level of experience.
- educationSummary: 1 brief sentence on degree/institution.

Be concise. Do not repeat the full resume or include markdown filler.`;

  return await callWithRetryAndFallback("Resume Analysis", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.INTEGER, description: "ATS score 0-100" },
            candidate: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: ["name", "email", "phone"],
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Detected skills",
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Missing keywords/skills",
            },
            experienceMatch: { type: Type.INTEGER, description: "Experience match 0-100" },
            educationMatch: { type: Type.INTEGER, description: "Education match 0-100" },
            keywordMatch: { type: Type.INTEGER, description: "Keyword match 0-100" },
            skillsMatch: { type: Type.INTEGER, description: "Skills match 0-100" },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 key strengths",
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 key weaknesses",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 short actionable recommendations",
            },
            hiringRecommendation: {
              type: Type.STRING,
              description: "Short hiring status recommendation",
            },
            experienceSummary: { type: Type.STRING },
            educationSummary: { type: Type.STRING },
          },
          required: [
            "atsScore",
            "candidate",
            "skills",
            "missingSkills",
            "experienceMatch",
            "educationMatch",
            "keywordMatch",
            "strengths",
            "weaknesses",
            "recommendations",
            "hiringRecommendation",
          ],
        },
      },
    });

    const raw = response.text || "{}";
    try {
      return JSON.parse(raw);
    } catch (parseErr) {
      // Safe fallback retry once
      console.warn("Initial JSON parse failed, cleaning response...", parseErr);
      const cleaned = raw.replace(/^```json/g, "").replace(/```$/g, "").trim();
      return JSON.parse(cleaned);
    }
  });
}

/**
 * Dedicated bullet rewriter if requested
 */
export async function rewriteSingleBulletPoint(bullet: string, context?: string) {
  const ai = getGeminiClient();
  const cleanBullet = compactText(bullet, 500);

  const prompt = `Rewrite this resume bullet point into 3 high-impact versions following the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]"):
BULLET: "${cleanBullet}"
CONTEXT: ${context || "Software / Tech"}

Return strict JSON:
{
  "metricsFocused": "...",
  "actionOriented": "...",
  "atsOptimized": "...",
  "critique": "..."
}`;

  return await callWithRetryAndFallback("Bullet Rewrite", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metricsFocused: { type: Type.STRING },
            actionOriented: { type: Type.STRING },
            atsOptimized: { type: Type.STRING },
            critique: { type: Type.STRING },
          },
          required: ["metricsFocused", "actionOriented", "atsOptimized", "critique"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  });
}

/**
 * Standalone Job Match endpoint helper if invoked separately
 */
export async function generateJobMatchAnalysis(
  resumeText: string,
  jobDescription: string,
  jobTitle?: string
) {
  const ai = getGeminiClient();
  const cleanResume = compactText(resumeText, 6000);
  const cleanJob = compactText(jobDescription, 3000);

  const prompt = `Compare this resume against the job description for ${jobTitle || "the target role"}.
RESUME:
${cleanResume}

JOB DESCRIPTION:
${cleanJob}

Return concise JSON matching schema.`;

  return await callWithRetryAndFallback("Job Match", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.INTEGER },
            matchingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
            sectionsToImprove: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  advice: { type: Type.STRING },
                },
                required: ["section", "advice"],
              },
            },
            tailoredBulletSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  tailoredForJob: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["original", "tailoredForJob", "reason"],
              },
            },
          },
          required: [
            "matchScore",
            "matchingKeywords",
            "missingKeywords",
            "matchingSkills",
            "missingSkills",
            "recommendedChanges",
            "sectionsToImprove",
            "tailoredBulletSuggestions",
          ],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  });
}
