import fs from "fs";
import path from "path";
import { ResumeAnalysisResult, JobMatchResult, UserProfile } from "../src/types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

interface DatabaseSchema {
  profiles: Record<string, UserProfile>;
  resumes: Record<string, {
    id: string;
    userId: string;
    filename: string;
    extractedText: string;
    fileSize: number;
    createdAt: string;
  }>;
  analyses: Record<string, ResumeAnalysisResult>;
  jobMatches: Record<string, JobMatchResult>;
}

function getInitialDatabase(): DatabaseSchema {
  return {
    profiles: {
      "demo-user-123": {
        id: "demo-user-123",
        email: "alex.demo@spresumai.com",
        fullName: "Alex Morgan",
        createdAt: new Date().toISOString(),
        targetRole: "Senior Full Stack Engineer",
        isDemo: true,
      },
    },
    resumes: {},
    analyses: {},
    jobMatches: {},
  };
}

let dbCache: DatabaseSchema | null = null;

function ensureDbLoaded(): DatabaseSchema {
  if (dbCache) return dbCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      dbCache = JSON.parse(data);
    } else {
      dbCache = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Database load error, defaulting to memory store:", err);
    dbCache = getInitialDatabase();
  }

  return dbCache!;
}

function persistDb() {
  if (!dbCache) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist database to file:", err);
  }
}

// User Profile Operations
export function getUserProfile(userId: string): UserProfile | null {
  const db = ensureDbLoaded();
  return db.profiles[userId] || null;
}

export function saveUserProfile(profile: UserProfile): UserProfile {
  const db = ensureDbLoaded();
  db.profiles[profile.id] = profile;
  persistDb();
  return profile;
}

export function findUserByEmail(email: string): UserProfile | null {
  const db = ensureDbLoaded();
  return Object.values(db.profiles).find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
}

// Resume & Analysis Operations
export function saveResumeRecord(record: {
  id: string;
  userId: string;
  filename: string;
  extractedText: string;
  fileSize: number;
  createdAt: string;
}) {
  const db = ensureDbLoaded();
  db.resumes[record.id] = record;
  persistDb();
  return record;
}

export function saveAnalysis(analysis: ResumeAnalysisResult): ResumeAnalysisResult {
  const db = ensureDbLoaded();
  db.analyses[analysis.id] = analysis;
  persistDb();
  return analysis;
}

export function getAnalysisById(analysisId: string, userId?: string): ResumeAnalysisResult | null {
  const db = ensureDbLoaded();
  const item = db.analyses[analysisId];
  if (!item) return null;
  if (userId && item.userId !== userId && !item.userId.startsWith("demo")) {
    return null; // Row Level Security
  }
  return item;
}

export function getUserAnalyses(userId: string): ResumeAnalysisResult[] {
  const db = ensureDbLoaded();
  return Object.values(db.analyses)
    .filter((a) => a.userId === userId || (userId.startsWith("demo") && a.userId.startsWith("demo")))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteAnalysis(analysisId: string, userId: string): boolean {
  const db = ensureDbLoaded();
  const item = db.analyses[analysisId];
  if (!item) return false;
  if (item.userId !== userId && !userId.startsWith("demo")) {
    return false; // RLS violation
  }
  delete db.analyses[analysisId];
  persistDb();
  return true;
}

// Job Match Operations
export function saveJobMatch(match: JobMatchResult): JobMatchResult {
  const db = ensureDbLoaded();
  db.jobMatches[match.id] = match;
  persistDb();
  return match;
}

export function getUserJobMatches(userId: string): JobMatchResult[] {
  const db = ensureDbLoaded();
  return Object.values(db.jobMatches)
    .filter((m) => m.userId === userId || (userId.startsWith("demo") && m.userId.startsWith("demo")))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteJobMatch(matchId: string, userId: string): boolean {
  const db = ensureDbLoaded();
  const item = db.jobMatches[matchId];
  if (!item) return false;
  if (item.userId !== userId && !userId.startsWith("demo")) {
    return false;
  }
  delete db.jobMatches[matchId];
  persistDb();
  return true;
}
