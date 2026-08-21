import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { generateResumeAnalysis, generateJobMatchAnalysis, rewriteSingleBulletPoint, compactText } from "./server/gemini.js";
import { extractResumeText } from "./server/extractor.js";
import {
  getUserProfile,
  saveUserProfile,
  findUserByEmail,
  saveResumeRecord,
  saveAnalysis,
  getCachedAnalysisByHash,
  getAnalysisById,
  getUserAnalyses,
  deleteAnalysis,
  saveJobMatch,
  getUserJobMatches,
  deleteJobMatch,
} from "./server/storage.js";
import { ResumeAnalysisResult, JobMatchResult, UserProfile } from "./src/types.js";

function computeAnalysisHash(userId: string, resumeText: string, jobDescription?: string, targetRole?: string): string {
  const normResume = compactText(resumeText, 8000);
  const normJob = compactText(jobDescription || "", 4000);
  const normRole = (targetRole || "").trim().toLowerCase();
  return crypto.createHash("sha256").update(`${userId}:${normResume}:${normJob}:${normRole}`).digest("hex");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS & Security Headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // Middleware for parsing JSON with generous payload limits for base64 resumes
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Basic API Health
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      aiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  // Auth Endpoints
  app.post("/api/auth/demo-login", (req, res) => {
    const demoUser: UserProfile = {
      id: "demo-user-123",
      email: "alex.demo@spresumai.com",
      fullName: "Alex Morgan",
      createdAt: new Date().toISOString(),
      targetRole: "Senior Software Engineer",
      isDemo: true,
    };
    saveUserProfile(demoUser);
    res.json({ user: demoUser, token: "demo-token-123" });
  });

  app.post("/api/auth/signup", (req, res) => {
    try {
      const { email, fullName, password } = req.body;
      if (!email || !fullName) {
        return res.status(400).json({ error: "Email and Full Name are required" });
      }

      const existing = findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const newUser: UserProfile = {
        id: "user_" + Math.random().toString(36).substring(2, 10),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        createdAt: new Date().toISOString(),
        isDemo: false,
      };

      saveUserProfile(newUser);
      res.json({ user: newUser, token: "auth-token-" + newUser.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create account" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let user = findUserByEmail(email);
      if (!user) {
        // Auto-provision if demo-friendly or create seamless session
        user = {
          id: "user_" + Math.random().toString(36).substring(2, 10),
          email: email.trim().toLowerCase(),
          fullName: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          createdAt: new Date().toISOString(),
          isDemo: false,
        };
        saveUserProfile(user);
      }

      res.json({ user, token: "auth-token-" + user.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Login failed" });
    }
  });

  app.get("/api/auth/profile/:id", (req, res) => {
    const profile = getUserProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  });

  // Resume Text Extraction Endpoint
  app.post("/api/extract", async (req, res) => {
    try {
      const { base64Data, filename, mimeType, rawText } = req.body;

      if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
        const textBuffer = Buffer.from(rawText, "utf-8");
        const extracted = await extractResumeText(textBuffer, filename || "pasted-resume.txt", "text/plain");
        return res.json(extracted);
      }

      if (!base64Data) {
        return res.status(400).json({ error: "No resume file data or text provided" });
      }

      // Strip data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
      const fileBuffer = Buffer.from(cleanBase64, "base64");

      // Check max size (10MB)
      if (fileBuffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "File exceeds the 10 MB maximum allowed limit" });
      }

      const extracted = await extractResumeText(fileBuffer, filename || "resume.pdf", mimeType);
      res.json(extracted);
    } catch (err: any) {
      console.error("Text extraction failed:", err);
      res.status(422).json({
        error: err.message || "Failed to extract readable text from uploaded file. Please check format or paste text directly.",
      });
    }
  });

  // AI Resume Analysis Endpoint (Optimized Single Request with Fast Caching)
  app.post("/api/analyze", async (req, res) => {
    try {
      const { resumeText, filename, userId, targetRole, jobDescription } = req.body;

      if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
        return res.status(400).json({ error: "Resume text must contain at least 20 readable characters." });
      }

      const activeUserId = userId || "demo-user-123";

      // 1. Compute Safe Cache Hash (resume + jobDescription + targetRole + userId)
      const analysisHash = computeAnalysisHash(activeUserId, resumeText, jobDescription, targetRole);

      // 2. Check if identical analysis already exists for this user
      const cached = getCachedAnalysisByHash(activeUserId, analysisHash);
      if (cached) {
        return res.json(cached);
      }

      const resumeId = "res_" + Math.random().toString(36).substring(2, 10);
      const analysisId = "an_" + Math.random().toString(36).substring(2, 10);

      // Save resume record
      saveResumeRecord({
        id: resumeId,
        userId: activeUserId,
        filename: filename || "My_Resume.pdf",
        extractedText: compactText(resumeText, 8000),
        fileSize: Buffer.byteLength(resumeText, "utf8"),
        createdAt: new Date().toISOString(),
      });

      // 3. One single optimized Gemini call returning strict JSON
      const analysisData = await generateResumeAnalysis({
        resumeText,
        jobDescription: jobDescription?.trim() || undefined,
        filename: filename || "My_Resume.pdf",
        targetRole: targetRole?.trim() || undefined,
      });

      const score = Math.max(0, Math.min(100, Math.round(analysisData.atsScore || 75)));
      const tier: ResumeAnalysisResult["scoreTier"] =
        score >= 90
          ? "Elite (90-100)"
          : score >= 75
          ? "Strong (75-89)"
          : score >= 60
          ? "Fair (60-74)"
          : "Needs Work (<60)";

      const allSkills = analysisData.skills || [];
      const missing = analysisData.missingSkills || [];

      const fullResult: ResumeAnalysisResult = {
        id: analysisId,
        userId: activeUserId,
        resumeId,
        filename: filename || "My_Resume.pdf",
        createdAt: new Date().toISOString(),
        atsScore: score,
        scoreTier: tier,
        candidate: {
          name: analysisData.candidate?.name || "",
          email: analysisData.candidate?.email || "",
          phone: analysisData.candidate?.phone || "",
        },
        summary: analysisData.hiringRecommendation
          ? `${analysisData.hiringRecommendation}. ${analysisData.experienceSummary || ""}`
          : "Analysis completed successfully against ATS standards.",
        strengths: (analysisData.strengths || []).slice(0, 5),
        weaknesses: (analysisData.weaknesses || []).slice(0, 5),
        recommendations: (analysisData.recommendations || []).slice(0, 5),
        hiringRecommendation: analysisData.hiringRecommendation || "Good Match - Proceed to Review",
        skills: allSkills,
        missingSkills: missing,
        missingKeywords: missing,
        detectedSkills: {
          technical: allSkills.slice(0, 6),
          programmingLanguages: allSkills.slice(6, 10),
          tools: allSkills.slice(10, 13),
          soft: allSkills.slice(13, 16),
        },
        categoryScores: {
          skillsMatch: Math.max(0, Math.min(100, analysisData.skillsMatch ?? score)),
          experienceImpact: Math.max(0, Math.min(100, analysisData.experienceMatch ?? score)),
          educationRelevance: Math.max(0, Math.min(100, analysisData.educationMatch ?? score)),
          keywordOptimization: Math.max(0, Math.min(100, analysisData.keywordMatch ?? score)),
          formattingAndLayout: score >= 75 ? 88 : 70,
          resumeStructure: score >= 75 ? 85 : 68,
          quantifiableMetrics: Math.max(0, Math.min(100, analysisData.experienceMatch ?? 70)),
          actionVerbsAndTone: score >= 75 ? 84 : 72,
        },
        sectionScores: {
          summary: score >= 70 ? 80 : 65,
          skills: Math.max(0, Math.min(100, analysisData.skillsMatch ?? score)),
          experience: Math.max(0, Math.min(100, analysisData.experienceMatch ?? score)),
          education: Math.max(0, Math.min(100, analysisData.educationMatch ?? score)),
          projects: score >= 70 ? 75 : 60,
        },
        sectionDetails: [
          {
            sectionName: "Summary",
            score: score >= 70 ? 85 : 65,
            status: score >= 75 ? "excellent" : "good",
            strengths: analysisData.strengths?.slice(0, 2) || ["Profile summary aligned with target role"],
            problems: analysisData.weaknesses?.slice(0, 1) || [],
            suggestions: analysisData.recommendations?.slice(0, 2) || [],
          },
          {
            sectionName: "Skills & Keywords",
            score: analysisData.skillsMatch ?? score,
            status: (analysisData.skillsMatch ?? score) >= 75 ? "excellent" : "needs_work",
            strengths: allSkills.slice(0, 5),
            problems: missing.length > 0 ? [`Missing high-priority keywords: ${missing.slice(0, 3).join(", ")}`] : [],
            suggestions: missing.length > 0 ? [`Incorporate ${missing.slice(0, 3).join(", ")} into experience bullet points.`] : [],
          },
        ],
        bulletPointImprovements: [],
        formattingIssues: [],
        experienceInsight: {
          jobTitlesDetected: targetRole ? [targetRole] : [],
          estimatedYearsExperience: analysisData.experienceSummary || "Calculated from career trajectory",
          measurableResultsCount: 3,
          actionVerbStrength: score >= 75 ? "strong" : "moderate",
          summaryRemarks: analysisData.experienceSummary || "Professional experience extracted.",
        },
        educationInsight: {
          degreeDetected: analysisData.educationSummary || "Academic credentials detected",
          summaryRemarks: analysisData.educationSummary || "Education background aligned.",
        },
        extractedTextSnippet: resumeText.slice(0, 1500),
        targetRole,
        jobDescriptionSnippet: jobDescription ? jobDescription.slice(0, 500) : undefined,
        analysisHash,
      };

      // Save to database (caches in-memory and persists for non-demo users)
      saveAnalysis(fullResult);

      res.json(fullResult);
    } catch (err: any) {
      console.error("Analysis generation error:", err?.message || err);
      const status = err?.statusCode || (err?.message?.includes("taking longer than expected") ? 504 : err?.message?.includes("temporarily busy") ? 503 : 500);
      res.status(status).json({
        error: err.message || "AI service is temporarily busy. Please try again in a few moments.",
      });
    }
  });

  // AI Job Description Matching Endpoint
  app.post("/api/job-match", async (req, res) => {
    try {
      const { resumeText, jobDescription, jobTitle, userId, resumeId } = req.body;

      if (!resumeText || !jobDescription) {
        return res.status(400).json({ error: "Both Resume Text and Job Description are required for matching." });
      }

      const activeUserId = userId || "demo-user-123";
      const matchId = "jm_" + Math.random().toString(36).substring(2, 10);

      const matchData = await generateJobMatchAnalysis(resumeText, jobDescription, jobTitle);

      const jobMatchResult: JobMatchResult = {
        id: matchId,
        userId: activeUserId,
        resumeId: resumeId || "res_active",
        jobTitle: jobTitle || "Target Role",
        jobDescriptionSnippet: jobDescription.slice(0, 1000),
        matchScore: matchData.matchScore ?? 70,
        matchingKeywords: matchData.matchingKeywords ?? [],
        missingKeywords: matchData.missingKeywords ?? [],
        matchingSkills: matchData.matchingSkills ?? [],
        missingSkills: matchData.missingSkills ?? [],
        recommendedChanges: matchData.recommendedChanges ?? [],
        sectionsToImprove: matchData.sectionsToImprove ?? [],
        tailoredBulletSuggestions: matchData.tailoredBulletSuggestions ?? [],
        createdAt: new Date().toISOString(),
      };

      saveJobMatch(jobMatchResult);

      res.json(jobMatchResult);
    } catch (err: any) {
      console.error("Job match error:", err?.message || err);
      const status = err?.statusCode || (err?.message?.includes("temporarily busy") ? 503 : 500);
      res.status(status).json({
        error: err.message || "AI service is temporarily busy. Please try again in a few moments.",
      });
    }
  });

  // AI Single Bullet Point Rewriter
  app.post("/api/rewrite-bullet", async (req, res) => {
    try {
      const { bullet, context } = req.body;
      if (!bullet || typeof bullet !== "string" || bullet.trim().length < 5) {
        return res.status(400).json({ error: "Please provide a valid bullet point to rewrite." });
      }

      const result = await rewriteSingleBulletPoint(bullet, context);
      res.json(result);
    } catch (err: any) {
      console.error("Bullet rewrite error:", err?.message || err);
      const status = err?.statusCode || (err?.message?.includes("temporarily busy") ? 503 : 500);
      res.status(status).json({ error: err.message || "Failed to rewrite bullet point." });
    }
  });

  // Analysis History Endpoints
  app.get("/api/analyses", (req, res) => {
    const userId = (req.query.userId as string) || "demo-user-123";
    const list = getUserAnalyses(userId);
    res.json(list);
  });

  app.get("/api/analyses/:id", (req, res) => {
    const userId = (req.query.userId as string) || "demo-user-123";
    const analysis = getAnalysisById(req.params.id, userId);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found or access denied" });
    }
    res.json(analysis);
  });

  app.delete("/api/analyses/:id", (req, res) => {
    const userId = (req.body?.userId as string) || (req.query.userId as string) || "demo-user-123";
    const success = deleteAnalysis(req.params.id, userId);
    if (!success) {
      return res.status(404).json({ error: "Could not delete analysis or access denied" });
    }
    res.json({ success: true, message: "Analysis removed successfully" });
  });

  // Job Match History Endpoints
  app.get("/api/job-matches", (req, res) => {
    const userId = (req.query.userId as string) || "demo-user-123";
    const list = getUserJobMatches(userId);
    res.json(list);
  });

  app.delete("/api/job-matches/:id", (req, res) => {
    const userId = (req.body?.userId as string) || (req.query.userId as string) || "demo-user-123";
    const success = deleteJobMatch(req.params.id, userId);
    if (!success) {
      return res.status(404).json({ error: "Could not delete job match or access denied" });
    }
    res.json({ success: true, message: "Job match removed successfully" });
  });

  // Catch-all 404 handler for undefined /api routes so they return JSON instead of HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
  });

  // Global error handler for uncaught server-side API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled API error:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      error: err.message || "Internal server error occurred while processing request.",
    });
  });

  const httpServer = http.createServer(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`SP ResumAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
