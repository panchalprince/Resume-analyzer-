import { ResumeAnalysisResult, ResumeHistoryItem } from "../types.js";

const HISTORY_STORAGE_KEY = "sp_resumai_history_v1";
const MAX_HISTORY_ITEMS = 20;

/**
 * Retrieve temporary history items from localStorage
 */
export function getStoredHistory(): ResumeHistoryItem[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("[History] Failed to parse stored history:", err);
  }
  return [];
}

/**
 * Save an analysis result to temporary browser history
 */
export function saveAnalysisToHistory(
  analysis: ResumeAnalysisResult,
): ResumeHistoryItem[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  const existing = getStoredHistory();
  
  // Format history item
  const item: ResumeHistoryItem = {
    id: analysis.id || `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    filename: analysis.filename || "Resume.pdf",
    targetRole: analysis.targetRole || "Software Engineer",
    overallScore: analysis.overallScore || analysis.atsScore || 75,
    atsScore: analysis.atsScore || 75,
    scoreTier: analysis.scoreTier || "Good",
    summary:
      analysis.summary ||
      `Resume evaluated for ${analysis.targetRole || "target position"}.`,
    createdAt: analysis.createdAt || new Date().toISOString(),
    analysis,
  };

  // Prepend new item and filter out duplicate IDs
  const updated = [item, ...existing.filter((h) => h.id !== item.id)].slice(
    0,
    MAX_HISTORY_ITEMS,
  );

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("[History] Storage quota exceeded, trimming history:", err);
    try {
      const trimmed = updated.slice(0, 8);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage unavailable
    }
  }

  return updated;
}

/**
 * Delete a single history record by ID
 */
export function deleteStoredHistoryItem(id: string): ResumeHistoryItem[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  const existing = getStoredHistory();
  const updated = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("[History] Failed to save updated history:", err);
  }
  return updated;
}

/**
 * Clear all temporary history
 */
export function clearAllStoredHistory(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn("[History] Failed to clear history:", err);
  }
}
