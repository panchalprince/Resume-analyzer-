import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ResumeAnalysisResult, JobMatchResult, UserProfile } from "../src/types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

export interface UserAccountRecord extends UserProfile {
  passwordHash?: string;
  salt?: string;
}

interface DatabaseSchema {
  profiles: Record<string, UserAccountRecord>;
  sessions: Record<string, { userId: string; createdAt: string; expiresAt: string }>;
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
    sessions: {},
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
      if (!dbCache?.sessions) {
        dbCache!.sessions = {};
      }
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

// Password hashing utility
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function sanitizeUserProfile(account: UserAccountRecord): UserProfile {
  const { passwordHash, salt, ...profile } = account;
  return profile;
}

// User Profile Operations
export function getUserProfile(userId: string): UserProfile | null {
  const db = ensureDbLoaded();
  const account = db.profiles[userId];
  if (!account) return null;
  return sanitizeUserProfile(account);
}

export function saveUserProfile(profile: UserProfile | UserAccountRecord): UserProfile {
  const db = ensureDbLoaded();
  db.profiles[profile.id] = profile;
  persistDb();
  return sanitizeUserProfile(profile);
}

export function findUserRecordByEmail(email: string): UserAccountRecord | null {
  const db = ensureDbLoaded();
  const normalized = email.trim().toLowerCase();
  return Object.values(db.profiles).find((p) => p.email.toLowerCase() === normalized) || null;
}

export function findUserByEmail(email: string): UserProfile | null {
  const account = findUserRecordByEmail(email);
  return account ? sanitizeUserProfile(account) : null;
}

export function registerUser(email: string, fullName: string, password?: string): { user: UserProfile; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = findUserRecordByEmail(normalizedEmail);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const userId = "user_" + crypto.randomBytes(6).toString("hex");
  let passwordHash: string | undefined;
  let salt: string | undefined;

  if (password && password.trim().length > 0) {
    salt = crypto.randomBytes(16).toString("hex");
    passwordHash = hashPassword(password, salt);
  }

  const newAccount: UserAccountRecord = {
    id: userId,
    email: normalizedEmail,
    fullName: fullName.trim(),
    createdAt: new Date().toISOString(),
    isDemo: false,
    passwordHash,
    salt,
  };

  const db = ensureDbLoaded();
  db.profiles[userId] = newAccount;

  const token = "auth-token-" + crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions[token] = { userId, createdAt: new Date().toISOString(), expiresAt };
  persistDb();

  return { user: sanitizeUserProfile(newAccount), token };
}

export function authenticateUser(email: string, password?: string): { user: UserProfile; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const account = findUserRecordByEmail(normalizedEmail);

  if (!account) {
    const err: any = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  // If the account has a password set, verify it
  if (account.passwordHash && account.salt) {
    if (!password) {
      const err: any = new Error("Password is required.");
      err.statusCode = 401;
      throw err;
    }
    const computedHash = hashPassword(password, account.salt);
    if (computedHash !== account.passwordHash) {
      const err: any = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }
  } else if (password && password.trim().length > 0) {
    // If account was created without password previously, attach password on first login
    const salt = crypto.randomBytes(16).toString("hex");
    account.salt = salt;
    account.passwordHash = hashPassword(password, salt);
    saveUserProfile(account);
  }

  const token = "auth-token-" + crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const db = ensureDbLoaded();
  db.sessions[token] = { userId: account.id, createdAt: new Date().toISOString(), expiresAt };
  persistDb();

  return { user: sanitizeUserProfile(account), token };
}

export function verifySessionToken(token: string): UserProfile | null {
  if (!token) return null;
  if (token === "demo-token-123") {
    return {
      id: "demo-user-123",
      email: "alex.demo@spresumai.com",
      fullName: "Alex Morgan",
      createdAt: new Date().toISOString(),
      targetRole: "Senior Full Stack Engineer",
      isDemo: true,
    };
  }

  const db = ensureDbLoaded();
  const session = db.sessions[token];
  if (!session) {
    // Fallback if token follows format auth-token-user_*
    if (token.startsWith("auth-token-user_")) {
      const uId = token.replace("auth-token-", "");
      return getUserProfile(uId);
    }
    return null;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete db.sessions[token];
    persistDb();
    return null;
  }

  return getUserProfile(session.userId);
}

export function revokeSessionToken(token: string): void {
  if (!token) return;
  const db = ensureDbLoaded();
  if (db.sessions[token]) {
    delete db.sessions[token];
    persistDb();
  }
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
  if (record.userId.startsWith("demo")) return record;
  const db = ensureDbLoaded();
  db.resumes[record.id] = record;
  persistDb();
  return record;
}

// In-memory quick lookup cache (fast O(1) response without disk scan)
const analysisHashCache = new Map<string, ResumeAnalysisResult>();

export function getCachedAnalysisByHash(userId: string, hash: string): ResumeAnalysisResult | null {
  const cacheKey = `${userId}:${hash}`;
  if (analysisHashCache.has(cacheKey)) {
    return analysisHashCache.get(cacheKey)!;
  }

  // If user is not demo, search persisted database
  if (!userId.startsWith("demo")) {
    const db = ensureDbLoaded();
    const found = Object.values(db.analyses).find(
      (a) => a.userId === userId && a.analysisHash === hash
    );
    if (found) {
      analysisHashCache.set(cacheKey, found);
      return found;
    }
  }

  return null;
}

export function saveAnalysis(analysis: ResumeAnalysisResult): ResumeAnalysisResult {
  if (analysis.analysisHash) {
    analysisHashCache.set(`${analysis.userId}:${analysis.analysisHash}`, analysis);
  }

  // Demo users do not permanently persist to database file
  if (analysis.userId.startsWith("demo")) {
    return analysis;
  }

  const db = ensureDbLoaded();
  db.analyses[analysis.id] = analysis;
  persistDb();
  return analysis;
}

export function getAnalysisById(analysisId: string, userId?: string): ResumeAnalysisResult | null {
  const db = ensureDbLoaded();
  const item = db.analyses[analysisId];
  if (!item) return null;
  if (userId && item.userId !== userId) {
    return null; // Row Level Security
  }
  return item;
}

export function getUserAnalyses(userId: string): ResumeAnalysisResult[] {
  if (userId.startsWith("demo")) return [];
  const db = ensureDbLoaded();
  return Object.values(db.analyses)
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteAnalysis(analysisId: string, userId: string): boolean {
  if (userId.startsWith("demo")) return false;
  const db = ensureDbLoaded();
  const item = db.analyses[analysisId];
  if (!item) return false;
  if (item.userId !== userId) {
    return false; // RLS violation
  }
  delete db.analyses[analysisId];
  persistDb();
  return true;
}

// Job Match Operations
export function saveJobMatch(match: JobMatchResult): JobMatchResult {
  if (match.userId.startsWith("demo")) return match;
  const db = ensureDbLoaded();
  db.jobMatches[match.id] = match;
  persistDb();
  return match;
}

export function getUserJobMatches(userId: string): JobMatchResult[] {
  if (userId.startsWith("demo")) return [];
  const db = ensureDbLoaded();
  return Object.values(db.jobMatches)
    .filter((m) => m.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteJobMatch(matchId: string, userId: string): boolean {
  if (userId.startsWith("demo")) return false;
  const db = ensureDbLoaded();
  const item = db.jobMatches[matchId];
  if (!item) return false;
  if (item.userId !== userId) {
    return false;
  }
  delete db.jobMatches[matchId];
  persistDb();
  return true;
}
