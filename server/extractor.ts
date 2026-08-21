import mammoth from "mammoth";
import zlib from "zlib";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { ExtractedResumeData } from "../src/types.js";

async function parsePdfBuffer(fileBuffer: Buffer): Promise<{ text: string; numpages?: number }> {
  // Layer 1: pdf-parse library
  try {
    let fn: any = pdfParse;
    if (typeof fn !== "function" && fn?.default) {
      fn = fn.default;
    }
    if (typeof fn === "function") {
      const data = await fn(fileBuffer, { max: 10 });
      if (data?.text && data.text.trim().length > 20) {
        return { text: data.text, numpages: data.numpages };
      }
    }
  } catch (pdfErr: any) {
    // Non-fatal, proceed silently to decompressed stream parsing
  }

  // Layer 2: Decompress PDF FlateDecode streams with zlib to extract text operators (Tj / TJ)
  try {
    const streamExtracted = extractFromPdfStreams(fileBuffer);
    if (streamExtracted.trim().length > 30) {
      return { text: streamExtracted };
    }
  } catch {
    // Non-fatal, proceed to raw token scanning
  }

  // Layer 3: Extract legible printable text tokens from raw latin1 buffer
  const rawString = fileBuffer.toString("latin1");
  const extractedChunks: string[] = [];
  
  // Extract text within PDF parentheses e.g. (Text chunk) Tj or [(Text chunk)] TJ
  const textPattern = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match;
  while ((match = textPattern.exec(rawString)) !== null) {
    const chunk = match[1].replace(/\\([()\\])/g, "$1").trim();
    if (chunk.length > 1) {
      extractedChunks.push(chunk);
    }
  }

  if (extractedChunks.length > 5) {
    return { text: extractedChunks.join(" ") };
  }

  // Layer 4: Extract UTF-8 readable words
  const utf8String = fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
  return { text: utf8String };
}

function extractFromPdfStreams(buffer: Buffer): string {
  const resultText: string[] = [];
  const latin1 = buffer.toString("latin1");
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(latin1)) !== null) {
    const rawStream = Buffer.from(match[1], "latin1");
    let decompressed: Buffer | null = null;
    try {
      decompressed = zlib.inflateSync(rawStream);
    } catch {
      try {
        decompressed = zlib.inflateRawSync(rawStream);
      } catch {}
    }
    if (decompressed) {
      const streamText = decompressed.toString("latin1");
      const textPattern = /\(([^)]+)\)\s*(?:Tj|'|")/g;
      let tm;
      while ((tm = textPattern.exec(streamText)) !== null) {
        const str = tm[1].replace(/\\([()\\])/g, "$1").trim();
        if (str.length > 0) resultText.push(str);
      }
      const tjPattern = /\[([^\]]+)\]\s*TJ/g;
      let tjm;
      while ((tjm = tjPattern.exec(streamText)) !== null) {
        const inner = tjm[1];
        const parenPattern = /\(([^)]+)\)/g;
        let pm;
        while ((pm = parenPattern.exec(inner)) !== null) {
          const str = pm[1].replace(/\\([()\\])/g, "$1").trim();
          if (str.length > 0) resultText.push(str);
        }
      }
    }
  }
  return resultText.join(" ");
}

export async function extractResumeText(
  fileBuffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ExtractedResumeData> {
  const lowerName = filename.toLowerCase();
  let rawText = "";
  let pageCount: number | undefined;

  try {
    if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || mimeType?.includes("word")) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = result.value || "";
    } else if (lowerName.endsWith(".pdf") || mimeType?.includes("pdf")) {
      const pdfData = await parsePdfBuffer(fileBuffer);
      rawText = pdfData.text || "";
      pageCount = pdfData.numpages;
    } else {
      // Fallback to UTF-8 text interpretation
      rawText = fileBuffer.toString("utf-8");
    }
  } catch (err: any) {
    console.error("File extraction error:", err);
    // If mammoth or custom errors out, try raw text decoding
    rawText = fileBuffer.toString("utf-8");
    if (!rawText.trim()) {
      throw new Error(`Failed to extract text from ${filename}: ${err.message || "Unknown error"}`);
    }
  }

  // Clean and normalize text
  const cleanText = normalizeText(rawText);
  if (!cleanText || cleanText.length < 20) {
    throw new Error("The uploaded file appears to be empty or contains unreadable text (e.g. scanned image without OCR). Please upload a text-based PDF or DOCX, or paste your resume text.");
  }

  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const detectedSections = detectResumeSections(cleanText);

  return {
    filename,
    fileSize: fileBuffer.length,
    extractedText: cleanText,
    pageCount,
    wordCount,
    detectedSections,
  };
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "") // remove non-printable control chars except tab/newline
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function detectResumeSections(text: string): ExtractedResumeData["detectedSections"] {
  const sections: ExtractedResumeData["detectedSections"] = {};
  const lines = text.split("\n");

  // Regex patterns for common section headers
  const patterns: Record<keyof ExtractedResumeData["detectedSections"], RegExp> = {
    summary: /^(professional\s+summary|summary|profile|about\s+me|career\s+objective|objective)/i,
    experience: /^(work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history)/i,
    education: /^(education|academic\s+background|academic\s+qualifications|degrees)/i,
    skills: /^(technical\s+skills|skills|core\s+competencies|technologies|expertise|skill\s+set)/i,
    projects: /^(projects|personal\s+projects|academic\s+projects|key\s+projects)/i,
    certifications: /^(certifications|licenses|courses|accreditations|credentials)/i,
    achievements: /^(achievements|awards|honors|accomplishments)/i,
    languages: /^(languages|language\s+proficiency)/i,
    contact: /^(contact|contact\s+information)/i,
    name: /^name/i,
  };

  let currentSection: keyof typeof patterns | null = null;
  const sectionBuffers: Partial<Record<keyof typeof patterns, string[]>> = {};

  // First line often holds name if not labeled
  if (lines.length > 0 && lines[0].trim().length > 0 && lines[0].trim().length < 60) {
    sections.name = lines[0].trim();
  }

  // Extract contact info (email, phone, linkedin)
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);

  const contactParts: string[] = [];
  if (emailMatch) contactParts.push(emailMatch[0]);
  if (phoneMatch) contactParts.push(phoneMatch[0]);
  if (linkedinMatch) contactParts.push(linkedinMatch[0]);
  if (githubMatch) contactParts.push(githubMatch[0]);
  if (contactParts.length > 0) {
    sections.contact = contactParts.join(" | ");
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line looks like a header (short length, uppercase or matches section pattern)
    let matchedHeader = false;
    for (const [key, regex] of Object.entries(patterns)) {
      if (regex.test(trimmed) && trimmed.length < 50) {
        currentSection = key as keyof typeof patterns;
        if (!sectionBuffers[currentSection]) sectionBuffers[currentSection] = [];
        matchedHeader = true;
        break;
      }
    }

    if (!matchedHeader && currentSection) {
      sectionBuffers[currentSection]?.push(trimmed);
    }
  }

  for (const [key, val] of Object.entries(sectionBuffers)) {
    if (val && val.length > 0) {
      sections[key as keyof typeof patterns] = val.join("\n").slice(0, 1000);
    }
  }

  return sections;
}
