export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt?: string;
  targetRole?: string;
  targetJobTitle?: string;
  experienceLevel?: "entry" | "mid" | "senior" | "lead" | "executive";
  savedSkills?: string[];
  isDemo?: boolean;
}

export interface DetectedSkills {
  technical: string[];
  soft: string[];
  tools: string[];
  programmingLanguages: string[];
}

export interface SectionScores {
  summary: number;
  skills: number;
  experience: number;
  education: number;
  projects: number;
  certifications?: number;
}

export interface DetailedCategoryScores {
  keywordOptimization: number;
  skillsMatch: number;
  experienceImpact: number;
  educationRelevance: number;
  formattingAndLayout: number;
  resumeStructure: number;
  quantifiableMetrics: number;
  actionVerbsAndTone: number;
}

export interface SectionAnalysisDetail {
  sectionName: string;
  score: number;
  status: "excellent" | "good" | "needs_work" | "missing";
  strengths: string[];
  problems: string[];
  suggestions: string[];
  detectedContentSnippet?: string;
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

export interface FormattingIssue {
  severity: "low" | "medium" | "high";
  category: string;
  issue: string;
  fix: string;
}

export interface ExperienceInsight {
  jobTitlesDetected: string[];
  estimatedYearsExperience: string;
  measurableResultsCount: number;
  actionVerbStrength: "weak" | "moderate" | "strong";
  summaryRemarks: string;
}

export interface EducationInsight {
  degreeDetected?: string;
  institutionDetected?: string;
  graduationYearDetected?: string;
  courseworkOrHonorsDetected?: string;
  summaryRemarks: string;
}

export interface CandidateInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ResumeAnalysisResult {
  id: string;
  userId: string;
  resumeId: string;
  filename: string;
  createdAt: string;
  atsScore: number;
  scoreTier:
    "Elite (90-100)" | "Strong (75-89)" | "Fair (60-74)" | "Needs Work (<60)";
  candidate?: CandidateInfo;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations?: string[];
  hiringRecommendation?: string;
  skills?: string[];
  missingSkills?: string[];
  missingKeywords: string[];
  detectedSkills: DetectedSkills;
  categoryScores: DetailedCategoryScores;
  sectionScores: SectionScores;
  sectionDetails: SectionAnalysisDetail[];
  bulletPointImprovements: BulletPointImprovement[];
  formattingIssues: FormattingIssue[];
  experienceInsight: ExperienceInsight;
  educationInsight: EducationInsight;
  extractedTextSnippet?: string;
  targetRole?: string;
  jobDescriptionSnippet?: string;
  analysisHash?: string;
}

export interface JobMatchResult {
  id: string;
  userId: string;
  resumeId: string;
  jobTitle?: string;
  jobDescriptionSnippet: string;
  matchScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  matchingSkills: string[];
  missingSkills: string[];
  recommendedChanges: string[];
  sectionsToImprove: {
    section: string;
    advice: string;
  }[];
  tailoredBulletSuggestions: {
    original: string;
    tailoredForJob: string;
    reason: string;
  }[];
  createdAt: string;
}

export interface ExtractedResumeData {
  filename: string;
  fileSize: number;
  extractedText: string;
  pageCount?: number;
  wordCount?: number;
  detectedSections: {
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
