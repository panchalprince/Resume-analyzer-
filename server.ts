import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  generateResumeAnalysis,
  generateJobMatchAnalysis,
  rewriteSingleBulletPoint,
  compactText,
} from "./server/gemini.js";
import { extractResumeText } from "./server/extractor.js";
import {
  saveAnalysis,
  getAnalysis,
  getAllAnalyses,
  saveJobMatch,
  getJobMatch,
} from "./server/storage.js";
import { ResumeAnalysisResult, JobMatchResult } from "./src/types.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // CORS & Security Headers
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // Middleware for parsing JSON with generous payload limits
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      service: "SP ResumAI Core API",
      timestamp: new Date().toISOString(),
    });
  });

  // Document Text Extraction Endpoint
  app.post("/api/extract", async (req, res) => {
    try {
      const { fileBase64, filename, mimeType } = req.body;

      if (!fileBase64 || !filename) {
        return res.status(400).json({ error: "Missing required fields: fileBase64 or filename." });
      }

      const buffer = Buffer.from(fileBase64, "base64");
      const extracted = await extractResumeText(buffer, filename, mimeType);

      if (!extracted.extractedText || extracted.extractedText.trim().length === 0) {
        return res.status(422).json({
          error: "Could not extract readable text from document. Please ensure file is not scanned or password-protected.",
        });
      }

      res.json(extracted);
    } catch (err: any) {
      console.error("Extraction route error:", err);
      res.status(500).json({
        error: err.message || "Failed to process and extract text from document.",
      });
    }
  });

  // Comprehensive AI Resume & Target Role Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { resumeText, filename, targetRole, jobDescription } = req.body;

      if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
        return res.status(400).json({
          error: "Resume text must be at least 20 characters long for an accurate analysis.",
        });
      }

      const role = targetRole?.trim() || "Software Engineer";
      const analysisId = "an_" + Math.random().toString(36).substring(2, 10);

      // Call optimized Gemini analyzer with role-specific prompt
      const analysisData = await generateResumeAnalysis({
        resumeText,
        jobDescription: jobDescription?.trim() || undefined,
        filename: filename || "My_Resume.pdf",
        targetRole: role,
      });

      const overall = Math.max(0, Math.min(100, Math.round(analysisData.overallScore ?? analysisData.atsScore ?? 80)));
      const ats = Math.max(0, Math.min(100, Math.round(analysisData.atsScore ?? 80)));

      const tier: ResumeAnalysisResult["scoreTier"] =
        analysisData.scoreTier ||
        (overall >= 85
          ? "Excellent"
          : overall >= 75
          ? "Strong"
          : overall >= 60
          ? "Good"
          : overall >= 45
          ? "Needs Improvement"
          : "Weak");

      const fullResult: ResumeAnalysisResult = {
        id: analysisId,
        filename: filename || "My_Resume.pdf",
        targetRole: role,
        createdAt: new Date().toISOString(),
        overallScore: overall,
        atsScore: ats,
        scoreTier: tier,
        skillsMatch: Math.max(0, Math.min(100, Math.round(analysisData.skillsMatch ?? overall))),
        experienceRelevance: Math.max(0, Math.min(100, Math.round(analysisData.experienceRelevance ?? overall))),
        educationRelevance: Math.max(0, Math.min(100, Math.round(analysisData.educationRelevance ?? 85))),
        projectsRelevance: Math.max(0, Math.min(100, Math.round(analysisData.projectsRelevance ?? overall))),
        keywordMatch: Math.max(0, Math.min(100, Math.round(analysisData.keywordMatch ?? ats))),
        structureScore: Math.max(0, Math.min(100, Math.round(analysisData.structureScore ?? ats))),
        targetRoleFit: Math.max(0, Math.min(100, Math.round(analysisData.targetRoleFit ?? overall))),
        candidate: {
          name: analysisData.candidate?.name || "",
          email: analysisData.candidate?.email || "",
          phone: analysisData.candidate?.phone || "",
        },
        summary:
          analysisData.summary ||
          `Resume analysis completed specifically against the ${role} requirements.`,
        matchedSkills: analysisData.matchedSkills || [],
        partialSkills: analysisData.partialSkills || [],
        missingSkills: analysisData.missingSkills || [],
        strengths: analysisData.strengths || [],
        weaknesses: analysisData.weaknesses || [],
        recommendedImprovements:
          analysisData.recommendedImprovements ||
          analysisData.highPrioritySuggestions ||
          [],
        atsIssues: (analysisData.atsIssues || []).map((issue: any) => ({
          category: issue.category || "ATS Compatibility",
          issue: issue.issue || "Formatting optimization opportunity",
          fix: issue.fix || "Standardize section headings and bullet formatting",
          severity: (issue.severity || "medium") as "low" | "medium" | "high",
        })),
        missingKeywords: analysisData.missingKeywords || analysisData.missingSkills || [],
        highPrioritySuggestions: analysisData.highPrioritySuggestions || [],
        mediumPrioritySuggestions: analysisData.mediumPrioritySuggestions || [],
        lowPrioritySuggestions: analysisData.lowPrioritySuggestions || [],
        categoryScores: {
          atsCompatibility: ats,
          skillsMatch: Math.max(0, Math.min(100, Math.round(analysisData.skillsMatch ?? overall))),
          experienceRelevance: Math.max(0, Math.min(100, Math.round(analysisData.experienceRelevance ?? overall))),
          educationRelevance: Math.max(0, Math.min(100, Math.round(analysisData.educationRelevance ?? 85))),
          projectsRelevance: Math.max(0, Math.min(100, Math.round(analysisData.projectsRelevance ?? overall))),
          keywordMatch: Math.max(0, Math.min(100, Math.round(analysisData.keywordMatch ?? ats))),
          resumeStructure: Math.max(0, Math.min(100, Math.round(analysisData.structureScore ?? ats))),
          targetRoleFit: Math.max(0, Math.min(100, Math.round(analysisData.targetRoleFit ?? overall))),
        },
        extractedTextSnippet: resumeText.slice(0, 1500),
        jobDescriptionSnippet: jobDescription ? jobDescription.slice(0, 500) : undefined,
      };

      // Save to database cache
      saveAnalysis(fullResult);

      res.json(fullResult);
    } catch (err: any) {
      console.error("Analysis generation error:", err?.message || err);
      const status =
        err?.statusCode ||
        (err?.message?.includes("taking longer than expected")
          ? 504
          : err?.message?.includes("temporarily busy")
          ? 503
          : 500);
      res.status(status).json({
        error: err.message || "AI service is temporarily busy. Please try again in a few moments.",
      });
    }
  });

  // AI Job Description Matching Endpoint
  app.post("/api/job-match", async (req, res) => {
    try {
      const { resumeText, jobDescription, jobTitle } = req.body;

      if (!resumeText || !jobDescription) {
        return res.status(400).json({ error: "Both Resume Text and Job Description are required for matching." });
      }

      const matchId = "jm_" + Math.random().toString(36).substring(2, 10);
      const matchData = await generateJobMatchAnalysis(resumeText, jobDescription, jobTitle);

      const jobMatchResult: JobMatchResult = {
        id: matchId,
        jobTitle: jobTitle || "Target Role",
        jobDescriptionSnippet: jobDescription.slice(0, 1000),
        matchScore: matchData.matchScore ?? 70,
        matchingKeywords: matchData.matchingKeywords ?? [],
        missingKeywords: matchData.missingKeywords ?? [],
        matchingSkills: matchData.matchingSkills ?? [],
        missingSkills: matchData.missingSkills ?? [],
        recommendedChanges: matchData.recommendedChanges ?? [],
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

  // Analysis History Endpoints (Session Cache)
  app.get("/api/analyses", (req, res) => {
    res.json(getAllAnalyses());
  });

  app.get("/api/analyses/:id", (req, res) => {
    const analysis = getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    res.json(analysis);
  });

  // Catch-all 404 handler for undefined /api routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
  });

  // Global error handler
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
