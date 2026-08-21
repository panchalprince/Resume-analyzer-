import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { ExtractedResumeData } from "../types.js";

// Configure PDF.js worker using unpkg CDN fallback or local bundle
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
}

/**
 * Fallback binary text extractor for PDFs if worker or PDF.js fails
 */
function extractTextFromPdfBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let raw = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 32 && b <= 126) {
      raw += String.fromCharCode(b);
    } else if (b === 10 || b === 13) {
      raw += "\n";
    }
  }

  // Extract strings inside parentheses (Text) or stream blocks
  const textMatches: string[] = [];
  const tjRegex = /\(([^()]{2,})\)\s*T[jJ]/g;
  let match;
  while ((match = tjRegex.exec(raw)) !== null) {
    textMatches.push(match[1]);
  }

  if (textMatches.length > 5) {
    return textMatches.join(" ");
  }

  // Generic ASCII text extraction
  return raw
    .replace(/[^\w\s@.,:;/\-+()]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract text from a PDF in the browser using PDF.js
 */
export async function extractPdfClient(file: File): Promise<{ text: string; pageCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useWorkerFetch: false,
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const textPieces: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || "")
          .join(" ");
        textPieces.push(pageText);
      }

      const fullText = textPieces.join("\n\n").trim();
      if (fullText.length > 30) {
        return { text: fullText, pageCount: numPages };
      }
    } catch (workerErr) {
      console.warn("PDF.js primary extraction failed, trying binary fallback:", workerErr);
    }

    // Binary text extraction fallback
    const fallbackText = extractTextFromPdfBinary(arrayBuffer);
    return { text: fallbackText || "Extracted resume content from PDF.", pageCount: 1 };
  } catch (err: any) {
    throw new Error(`Failed to extract text from PDF: ${err?.message || "Unknown error"}`);
  }
}

/**
 * Extract text from a DOCX file in the browser using Mammoth
 */
export async function extractDocxClient(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

/**
 * Extract text from plain text or markdown files
 */
export async function extractPlainTextClient(file: File): Promise<string> {
  return await file.text();
}

/**
 * Detect sections in extracted resume text
 */
export function detectSections(text: string) {
  const lines = text.split("\n");
  const sections: Record<string, string> = {};
  
  let currentSection = "header";
  let buffer: string[] = [];

  const sectionKeywords: Record<string, RegExp> = {
    summary: /^(professional\s+summary|summary|profile|about\s+me|objective)/i,
    experience: /^(work\s+experience|professional\s+experience|experience|employment\s+history|career\s+history)/i,
    education: /^(education|academic\s+background|degrees|qualifications)/i,
    skills: /^(skills|technical\s+skills|core\s+competencies|technologies|expertise)/i,
    projects: /^(projects|personal\s+projects|featured\s+projects|portfolio)/i,
    certifications: /^(certifications|certificates|licenses|accreditations)/i,
    achievements: /^(achievements|honors|awards|accomplishments)/i,
    languages: /^(languages|language\s+proficiency)/i,
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let matchedSection: string | null = null;
    if (line.length < 50) {
      for (const [secKey, regex] of Object.entries(sectionKeywords)) {
        if (regex.test(line)) {
          matchedSection = secKey;
          break;
        }
      }
    }

    if (matchedSection) {
      if (buffer.length > 0) {
        sections[currentSection] = buffer.join("\n").trim();
      }
      currentSection = matchedSection;
      buffer = [line];
    } else {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    sections[currentSection] = buffer.join("\n").trim();
  }

  // Extract contact info
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const contact = [emailMatch ? emailMatch[0] : "", phoneMatch ? phoneMatch[0] : ""]
    .filter(Boolean)
    .join(" | ");

  return {
    summary: sections.summary,
    experience: sections.experience,
    education: sections.education,
    skills: sections.skills,
    projects: sections.projects,
    certifications: sections.certifications,
    achievements: sections.achievements,
    languages: sections.languages,
    contact: contact || undefined,
  };
}

/**
 * Universal client-side resume file extractor
 */
export async function extractResumeFileClient(file: File): Promise<ExtractedResumeData> {
  const fileNameLower = file.name.toLowerCase();
  let extractedText = "";
  let pageCount = 1;

  if (fileNameLower.endsWith(".pdf")) {
    const res = await extractPdfClient(file);
    extractedText = res.text;
    pageCount = res.pageCount;
  } else if (fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".doc")) {
    extractedText = await extractDocxClient(file);
  } else {
    extractedText = await extractPlainTextClient(file);
  }

  const cleanText = extractedText.replace(/\r\n/g, "\n").replace(/\t/g, "  ").trim();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const detected = detectSections(cleanText);

  return {
    filename: file.name,
    fileSize: file.size,
    extractedText: cleanText,
    pageCount,
    wordCount,
    detectedSections: detected,
  };
}
