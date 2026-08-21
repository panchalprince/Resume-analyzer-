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

export interface DetailedATSAnalysisResult {
  overallScore: number;
  atsScore: number;
  skillsMatch: number;
  experienceRelevance: number;
  educationRelevance: number;
  projectsRelevance: number;
  keywordMatch: number;
  structureScore: number;
  targetRoleFit: number;
  scoreTier: "Excellent" | "Strong" | "Good" | "Needs Improvement" | "Weak";
  summary: string;
  candidate: {
    name: string;
    email: string;
    phone: string;
  };
  matchedSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendedImprovements: string[];
  atsIssues: {
    category: string;
    issue: string;
    fix: string;
    severity: "low" | "medium" | "high";
  }[];
  missingKeywords: string[];
  highPrioritySuggestions: string[];
  mediumPrioritySuggestions: string[];
  lowPrioritySuggestions: string[];
}


// Fast Flash-class models prioritized for lowest latency and high quality ATS parsing
const SUPPORTED_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
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
export async function generateResumeAnalysis(input: AIAnalysisPromptInput): Promise<DetailedATSAnalysisResult> {
  const ai = getGeminiClient();

  const cleanResume = compactText(input.resumeText, 7000);
  const cleanJob = input.jobDescription ? compactText(input.jobDescription, 3000) : "";
  const roleContext = input.targetRole?.trim() || "Software Engineer";

  const prompt = `You are a Principal ATS Evaluator and Senior Technical Hiring Manager specializing in evaluating candidates for the specific target role: "${roleContext}".

Analyze this candidate's resume strictly and deeply against the requirements, technologies, expectations, and industry standards for the target role: "${roleContext}"${cleanJob ? " and the provided Job Description" : ""}.

RESUME CONTENT:
"""
${cleanResume}
"""
${cleanJob ? `\nJOB DESCRIPTION:\n"""\n${cleanJob}\n"""` : ""}

Evaluate rigorously and return strict JSON with these fields:
- overallScore: Integer (0-100) reflecting overall candidate suitability for "${roleContext}".
- atsScore: Integer (0-100) reflecting parsing compatibility, structure, and keyword density.
- skillsMatch: Integer (0-100) specifically for technical skills needed for "${roleContext}".
- experienceRelevance: Integer (0-100) assessing relevance of past work/internships to "${roleContext}".
- educationRelevance: Integer (0-100) rating degree and academic alignment.
- projectsRelevance: Integer (0-100) rating hands-on project work relevant to "${roleContext}".
- keywordMatch: Integer (0-100) evaluating density of essential domain keywords for "${roleContext}".
- structureScore: Integer (0-100) evaluating formatting clarity, typography, and section order.
- targetRoleFit: Integer (0-100) composite fit score for "${roleContext}".
- scoreTier: One of "Excellent" (85-100), "Strong" (75-84), "Good" (60-74), "Needs Improvement" (45-59), or "Weak" (<45).
- summary: A concise 1-2 sentence AI summary specifically explaining the candidate's alignment with "${roleContext}" (e.g., "Your resume demonstrates a solid foundation for an Embedded Systems Engineer, highlighted by microcontroller projects and C/C++ experience, but would benefit from explicit hardware communication protocols and RTOS exposure.").
- candidate: { name, email, phone } (extract from resume or empty string if not found).
- matchedSkills: Array of detected technical skills strongly matching "${roleContext}" (up to 12 items).
- partialSkills: Array of detected skills that are tangentially or partially relevant (up to 8 items).
- missingSkills: Array of high-demand skills and tools commonly required for "${roleContext}" that are absent or under-represented in this resume (up to 8 items).
- strengths: Array of 3-4 bullet points highlighting the strongest aspects of the resume for "${roleContext}".
- weaknesses: Array of 3-4 bullet points highlighting gaps, missing qualifications, or weak descriptions.
- recommendedImprovements: Array of 4-5 practical, actionable recommendations tailored to "${roleContext}" (e.g., "Add measurable throughput or latency metrics to project descriptions", "Specify microcontrollers and communication protocols like SPI/I2C/UART", "Highlight GitHub/Git version control workflow").
- atsIssues: Array of formatting or parsing issues found, each with { category, issue, fix, severity: "low"|"medium"|"high" }.
- missingKeywords: Array of 5-8 essential ATS keywords for "${roleContext}" to include.
- highPrioritySuggestions: Array of 2-3 most important urgent improvements.
- mediumPrioritySuggestions: Array of 2-3 useful improvements.
- lowPrioritySuggestions: Array of 2-3 optional polish improvements.

Be objective, accurate, and specific to "${roleContext}". Do not output generic advice.`;

  return await callWithRetryAndFallback("Resume Analysis", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: "Overall score 0-100" },
            atsScore: { type: Type.INTEGER, description: "ATS score 0-100" },
            skillsMatch: { type: Type.INTEGER, description: "Skills match 0-100" },
            experienceRelevance: { type: Type.INTEGER, description: "Experience relevance 0-100" },
            educationRelevance: { type: Type.INTEGER, description: "Education relevance 0-100" },
            projectsRelevance: { type: Type.INTEGER, description: "Projects relevance 0-100" },
            keywordMatch: { type: Type.INTEGER, description: "Keyword match 0-100" },
            structureScore: { type: Type.INTEGER, description: "Structure score 0-100" },
            targetRoleFit: { type: Type.INTEGER, description: "Target role fit 0-100" },
            scoreTier: { type: Type.STRING, description: "Excellent | Strong | Good | Needs Improvement | Weak" },
            summary: { type: Type.STRING, description: "Role-specific summary" },
            candidate: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: ["name", "email", "phone"],
            },
            matchedSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Strong skill matches",
            },
            partialSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Partial skill matches",
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Missing role skills",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Strengths for target role",
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Gaps for target role",
            },
            recommendedImprovements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical improvements",
            },
            atsIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  fix: { type: Type.STRING },
                  severity: { type: Type.STRING },
                },
                required: ["category", "issue", "fix", "severity"],
              },
            },
            missingKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            highPrioritySuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            mediumPrioritySuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            lowPrioritySuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "overallScore",
            "atsScore",
            "skillsMatch",
            "experienceRelevance",
            "educationRelevance",
            "projectsRelevance",
            "keywordMatch",
            "structureScore",
            "targetRoleFit",
            "scoreTier",
            "summary",
            "candidate",
            "matchedSkills",
            "partialSkills",
            "missingSkills",
            "strengths",
            "weaknesses",
            "recommendedImprovements",
            "atsIssues",
            "missingKeywords",
            "highPrioritySuggestions",
            "mediumPrioritySuggestions",
            "lowPrioritySuggestions",
          ],
        },
      },
    });

    const raw = response.text || "{}";
    try {
      return JSON.parse(raw);
    } catch (parseErr) {
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
