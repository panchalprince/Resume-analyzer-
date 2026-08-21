import fs from "fs";
import path from "path";
import { ResumeAnalysisResult, JobMatchResult } from "../src/types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "analyses_cache.json");

interface DatabaseSchema {
  analyses: Record<string, ResumeAnalysisResult>;
  jobMatches: Record<string, JobMatchResult>;
}

function getInitialDatabase(): DatabaseSchema {
  return {
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
    console.error("Cache database load error, defaulting to memory store:", err);
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
    console.error("Failed to persist analyses cache:", err);
  }
}

// Save Analysis Result
export function saveAnalysis(analysis: ResumeAnalysisResult): ResumeAnalysisResult {
  const db = ensureDbLoaded();
  db.analyses[analysis.id] = analysis;
  persistDb();
  return analysis;
}

// Get Analysis Result
export function getAnalysis(analysisId: string): ResumeAnalysisResult | null {
  const db = ensureDbLoaded();
  return db.analyses[analysisId] || null;
}

// List all analyses
export function getAllAnalyses(): ResumeAnalysisResult[] {
  const db = ensureDbLoaded();
  return Object.values(db.analyses).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Save Job Match
export function saveJobMatch(jobMatch: JobMatchResult): JobMatchResult {
  const db = ensureDbLoaded();
  db.jobMatches[jobMatch.id] = jobMatch;
  persistDb();
  return jobMatch;
}

// Get Job Match
export function getJobMatch(jobMatchId: string): JobMatchResult | null {
  const db = ensureDbLoaded();
  return db.jobMatches[jobMatchId] || null;
}
