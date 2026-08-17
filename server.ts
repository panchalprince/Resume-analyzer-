import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateResumeAnalysis, generateJobMatchAnalysis, rewriteSingleBulletPoint } from "./server/gemini.js";
import { extractResumeText } from "./server/extractor.js";
import {
  getUserProfile,
  saveUserProfile,
  findUserByEmail,
  saveResumeRecord,
  saveAnalysis,
  getAnalysisById,
  getUserAnalyses,
  deleteAnalysis,
  saveJobMatch,
  getUserJobMatches,
  deleteJobMatch,
} from "./server/storage.js";
import { ResumeAnalysisResult, JobMatchResult, UserProfile } from "./src/types.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // AI Resume Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { resumeText, filename, userId, targetRole } = req.body;

      if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
        return res.status(400).json({ error: "Resume text must contain at least 20 readable characters." });
      }

      const activeUserId = userId || "demo-user-123";
      const resumeId = "res_" + Math.random().toString(36).substring(2, 10);
      const analysisId = "an_" + Math.random().toString(36).substring(2, 10);

      // Save resume record
      saveResumeRecord({
        id: resumeId,
        userId: activeUserId,
        filename: filename || "My_Resume.pdf",
        extractedText: resumeText,
        fileSize: Buffer.byteLength(resumeText, "utf8"),
        createdAt: new Date().toISOString(),
      });

      // Call Gemini for structured ATS evaluation
      const analysisData = await generateResumeAnalysis({
        resumeText,
        filename: filename || "My_Resume.pdf",
        targetRole,
      });

      const fullResult: ResumeAnalysisResult = {
        id: analysisId,
        userId: activeUserId,
        resumeId,
        filename: filename || "My_Resume.pdf",
        createdAt: new Date().toISOString(),
        atsScore: analysisData.atsScore ?? 75,
        scoreTier: analysisData.scoreTier ?? "Strong (75-89)",
        summary: analysisData.summary ?? "",
        strengths: analysisData.strengths ?? [],
        weaknesses: analysisData.weaknesses ?? [],
        missingKeywords: analysisData.missingKeywords ?? [],
        detectedSkills: analysisData.detectedSkills ?? { technical: [], soft: [], tools: [], programmingLanguages: [] },
        categoryScores: analysisData.categoryScores ?? {
          keywordOptimization: 70,
          skillsMatch: 75,
          experienceImpact: 70,
          educationRelevance: 80,
          formattingAndLayout: 85,
          resumeStructure: 80,
          quantifiableMetrics: 65,
          actionVerbsAndTone: 75,
        },
        sectionScores: analysisData.sectionScores ?? {
          summary: 70,
          skills: 80,
          experience: 75,
          education: 85,
          projects: 70,
        },
        sectionDetails: analysisData.sectionDetails ?? [],
        bulletPointImprovements: analysisData.bulletPointImprovements ?? [],
        formattingIssues: analysisData.formattingIssues ?? [],
        experienceInsight: analysisData.experienceInsight ?? {
          jobTitlesDetected: [],
          estimatedYearsExperience: "N/A",
          measurableResultsCount: 0,
          actionVerbStrength: "moderate",
          summaryRemarks: "Solid foundation detected.",
        },
        educationInsight: analysisData.educationInsight ?? {
          summaryRemarks: "Education credentials detected.",
        },
        extractedTextSnippet: resumeText.slice(0, 1500),
        targetRole,
      };

      // Save to database
      saveAnalysis(fullResult);

      res.json(fullResult);
    } catch (err: any) {
      console.error("Analysis generation error:", err);
      res.status(500).json({
        error: err.message || "Failed to analyze resume. Please verify input and try again.",
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
      console.error("Job match error:", err);
      res.status(500).json({
        error: err.message || "Failed to analyze job match. Please try again.",
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
      res.status(500).json({ error: err.message || "Failed to rewrite bullet point." });
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SP ResumAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
