export interface DetectedSkills {
  technical: string[];
  soft: string[];
  tools: string[];
  programmingLanguages: string[];
}

export interface CandidateInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface FormattingIssue {
  severity: "low" | "medium" | "high";
  category: string;
  issue: string;
  fix: string;
}

export interface BulletPointImprovement {
  id: string;
  original: string;
  problem: string;
  whyItMatters: string;
  improved: string;
  category: "metrics" | "action_verb" | "clarity" | "ats_keywords";
  metricAddedSuggestion?: string;
}

export interface SectionAnalysisDetail {
  sectionName: string;
  score: number;
  status: "excellent" | "good" | "needs_work" | "missing";
  strengths: string[];
  problems: string[];
  suggestions: string[];
}

export interface DetailedCategoryScores {
  atsCompatibility: number;
  skillsMatch: number;
  experienceRelevance: number;
  educationRelevance: number;
  projectsRelevance: number;
  keywordMatch: number;
  resumeStructure: number;
  targetRoleFit: number;
}

export interface ResumeAnalysisResult {
  id: string;
  filename: string;
  targetRole: string;
  createdAt: string;
  
  // Overall score and status tier
  overallScore: number;
  atsScore: number;
  scoreTier: "Excellent" | "Strong" | "Good" | "Needs Improvement" | "Weak";
  
  // Score breakdowns (0-100)
  skillsMatch: number;
  experienceRelevance: number;
  educationRelevance: number;
  projectsRelevance: number;
  keywordMatch: number;
  structureScore: number;
  targetRoleFit: number;
  
  // Summary & candidate
  summary: string;
  candidate?: CandidateInfo;
  
  // Skills categorized
  matchedSkills: string[];     // Strong Matches
  partialSkills: string[];     // Partial Matches
  missingSkills: string[];     // Missing / Recommended Skills
  
  // Role Match Analysis
  strengths: string[];         // Strongest parts matching the target role
  weaknesses: string[];        // Weakly represented or gaps
  recommendedImprovements: string[]; // Actionable recommendations
  
  // ATS Breakdown
  atsIssues: FormattingIssue[];
  missingKeywords: string[];
  
  // Prioritized Improvement suggestions
  highPrioritySuggestions: string[];
  mediumPrioritySuggestions: string[];
  lowPrioritySuggestions: string[];
  
  // Compatibility fields
  detectedSkills?: DetectedSkills;
  categoryScores?: DetailedCategoryScores;
  bulletPointImprovements?: BulletPointImprovement[];
  sectionDetails?: SectionAnalysisDetail[];
  extractedTextSnippet?: string;
  jobDescriptionSnippet?: string;
}

export interface ResumeHistoryItem {
  id: string;
  filename: string;
  targetRole: string;
  overallScore: number;
  atsScore: number;
  scoreTier: string;
  summary: string;
  createdAt: string;
  analysis: ResumeAnalysisResult;
}

export interface JobMatchResult {
  id: string;
  jobTitle?: string;
  jobDescriptionSnippet: string;
  matchScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  matchingSkills: string[];
  missingSkills: string[];
  recommendedChanges: string[];
  createdAt: string;
}

export interface ExtractedResumeData {
  filename: string;
  fileSize: number;
  extractedText: string;
  pageCount?: number;
  wordCount?: number;
  detectedSections?: {
    name?: string;
    contact?: string;
    summary?: string;
    education?: string;
    experience?: string;
    projects?: string;
    skills?: string;
    certifications?: string;
    achievements?: string;
    languages?: string;
  };
}

