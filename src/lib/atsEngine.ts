import {
  ResumeAnalysisResult,
  JobMatchResult,
  DetailedCategoryScores,
  SectionScores,
  SectionAnalysisDetail,
  BulletPointImprovement,
  FormattingIssue,
  ExperienceInsight,
  EducationInsight,
  DetectedSkills,
} from "../types.js";

const COMMON_TECH_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#", "Go", "Rust",
  "HTML", "CSS", "Tailwind CSS", "Next.js", "Vue.js", "Angular", "Express", "FastAPI", "Django",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "GraphQL", "REST API", "Docker", "Kubernetes",
  "AWS", "GCP", "Azure", "Git", "GitHub", "CI/CD", "Linux", "Jest", "Pytest", "Agile", "Scrum",
  "Machine Learning", "Data Analysis", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Tableau",
  "Figma", "Jira", "Terraform", "Microservices", "System Design", "SQL", "DevOps"
];

const SOFT_SKILLS = [
  "Leadership", "Communication", "Problem Solving", "Collaboration", "Teamwork",
  "Cross-functional", "Time Management", "Critical Thinking", "Mentorship", "Adaptability",
  "Conflict Resolution", "Project Management", "Stakeholder Management", "Strategic Planning"
];

const STRONG_ACTION_VERBS = [
  "Spearheaded", "Engineered", "Orchestrated", "Architected", "Accelerated", "Optimized",
  "Pioneered", "Automated", "Delivered", "Transformed", "Maximized", "Reduced", "Increased",
  "Led", "Designed", "Implemented", "Developed", "Established", "Launched", "Revamped"
];

const WEAK_ACTION_VERBS = [
  "worked on", "helped with", "responsible for", "assisted in", "handled", "participated in",
  "did", "made", "tasked with", "was involved in"
];

export function runClientATSAnalysis(
  resumeText: string,
  filename = "Resume.pdf",
  userId = "demo-user-123",
  targetRole?: string
): ResumeAnalysisResult {
  const clean = resumeText.trim();
  const lower = clean.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Skill Detection
  const techFound: string[] = [];
  COMMON_TECH_SKILLS.forEach((skill) => {
    const reg = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (reg.test(clean)) techFound.push(skill);
  });

  const softFound: string[] = [];
  SOFT_SKILLS.forEach((skill) => {
    const reg = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (reg.test(clean)) softFound.push(skill);
  });

  const detectedSkills: DetectedSkills = {
    technical: techFound.length > 0 ? techFound : ["JavaScript", "HTML/CSS", "Problem Solving"],
    soft: softFound.length > 0 ? softFound : ["Collaboration", "Communication"],
    tools: ["Git", "VS Code", "Jira"].filter((t) => lower.includes(t.toLowerCase())),
    programmingLanguages: techFound.filter((t) =>
      ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "SQL"].includes(t)
    ),
  };

  // 2. Metrics & Numbers Check
  const metricMatches = clean.match(/(\d+[\d,.]*%\s*|\$\s*\d+[\d,.]*|\b\d+\s*(?:users|clients|engineers|teams|projects|x|fold|k|m|ms|hours|days|weeks|months|years))/gi) || [];
  const metricsCount = metricMatches.length;

  // 3. Action Verb Check
  let strongVerbCount = 0;
  STRONG_ACTION_VERBS.forEach((v) => {
    const reg = new RegExp(`\\b${v}\\b`, "gi");
    const m = clean.match(reg);
    if (m) strongVerbCount += m.length;
  });

  // 4. Section Presence Checks
  const hasExperience = /(experience|employment|work history|career)/i.test(clean);
  const hasEducation = /(education|university|college|bachelor|master|degree|gpa)/i.test(clean);
  const hasSkills = /(skills|technologies|proficiencies|competencies)/i.test(clean);
  const hasSummary = /(summary|profile|about me|objective)/i.test(clean);
  const hasProjects = /(projects|portfolio)/i.test(clean);
  const hasCertifications = /(certifications|certificates|licenses)/i.test(clean);

  // 5. Calculate Category Scores
  const keywordScore = Math.min(95, Math.max(40, techFound.length * 6 + softFound.length * 4 + 30));
  const skillsScore = Math.min(96, Math.max(45, techFound.length * 7 + 25));
  const metricsScore = Math.min(98, Math.max(30, metricsCount * 12 + 30));
  const verbsScore = Math.min(94, Math.max(40, strongVerbCount * 8 + 35));
  const experienceScore = hasExperience ? Math.round((metricsScore + verbsScore) / 2) : 35;
  const educationScore = hasEducation ? 88 : 45;
  const layoutScore = wordCount >= 250 && wordCount <= 800 ? 92 : wordCount < 200 ? 55 : 75;
  const structureScore = (hasExperience ? 25 : 0) + (hasEducation ? 25 : 0) + (hasSkills ? 25 : 0) + (hasSummary ? 15 : 5) + (hasProjects ? 10 : 0);

  const categoryScores: DetailedCategoryScores = {
    keywordOptimization: keywordScore,
    skillsMatch: skillsScore,
    experienceImpact: experienceScore,
    educationRelevance: educationScore,
    formattingAndLayout: layoutScore,
    resumeStructure: structureScore,
    quantifiableMetrics: metricsScore,
    actionVerbsAndTone: verbsScore,
  };

  // 6. Section Scores
  const sectionScores: SectionScores = {
    summary: hasSummary ? 82 : 45,
    skills: Math.min(95, techFound.length * 8 + 30),
    experience: experienceScore,
    education: educationScore,
    projects: hasProjects ? 84 : 50,
    certifications: hasCertifications ? 85 : 50,
  };

  // 7. Overall ATS Score
  const rawScore = Math.round(
    keywordScore * 0.2 +
    skillsScore * 0.2 +
    experienceScore * 0.25 +
    metricsScore * 0.15 +
    structureScore * 0.1 +
    layoutScore * 0.1
  );
  const atsScore = Math.max(25, Math.min(98, rawScore));

  let scoreTier: ResumeAnalysisResult["scoreTier"] = "Needs Work (<60)";
  if (atsScore >= 90) scoreTier = "Elite (90-100)";
  else if (atsScore >= 75) scoreTier = "Strong (75-89)";
  else if (atsScore >= 60) scoreTier = "Fair (60-74)";

  // 8. Missing Keywords
  const missingPool = ["Cloud Computing", "CI/CD Pipelines", "System Architecture", "Unit Testing", "Agile/Scrum", "RESTful APIs", "Microservices", "Performance Optimization", "Data Modeling", "Scalability"];
  const missingKeywords = missingPool.filter((k) => !lower.includes(k.toLowerCase())).slice(0, 5);

  // 9. Strengths & Weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (techFound.length >= 5) strengths.push(`Strong technology stack identified with ${techFound.length}+ core technical proficiencies.`);
  if (metricsCount >= 3) strengths.push(`Effective usage of quantifiable metrics and measurable outcomes (${metricsCount} data points detected).`);
  if (hasExperience && hasEducation && hasSkills) strengths.push("Well-structured traditional resume flow matching standard ATS hierarchy expectations.");
  if (strongVerbCount >= 3) strengths.push("Engaging action-oriented vocabulary demonstrating clear ownership and initiative.");
  if (strengths.length < 2) strengths.push("Clean resume format easily parseable by enterprise Applicant Tracking Systems.");

  if (metricsCount < 3) weaknesses.push("Low density of quantifiable business results (percentages, revenue, time savings, or volume metrics).");
  if (techFound.length < 6) weaknesses.push("Technical skills section could be expanded with more target role frameworks and libraries.");
  if (!hasSummary) weaknesses.push("Missing a concise 2-3 line Professional Executive Summary highlighting key achievements.");
  if (wordCount < 250) weaknesses.push("Resume length is slightly sparse; aim for 350-650 words with expanded impact bullet points.");
  if (weaknesses.length === 0) weaknesses.push("Tailor keywords even more closely to specific target job postings to reach 95+ alignment.");

  // 10. Section details
  const sectionDetails: SectionAnalysisDetail[] = [
    {
      sectionName: "Professional Summary",
      score: sectionScores.summary,
      status: hasSummary ? "good" : "needs_work",
      strengths: hasSummary ? ["Contains career intent and focus"] : ["Clear candidate name identified"],
      problems: hasSummary ? [] : ["Missing an overarching professional summary at the top"],
      suggestions: ["Include your target role title, years of experience, and top 2 career achievements."],
    },
    {
      sectionName: "Work Experience",
      score: sectionScores.experience,
      status: experienceScore >= 75 ? "excellent" : experienceScore >= 60 ? "good" : "needs_work",
      strengths: [`Identified ${metricsCount} metric data points and action statements`],
      problems: metricsCount < 2 ? ["Bullet points rely heavily on task descriptions rather than measurable results"] : [],
      suggestions: ["Structure bullets with Google's X-Y-Z formula: 'Accomplished [X], measured by [Y], by doing [Z]'."],
    },
    {
      sectionName: "Technical Skills",
      score: sectionScores.skills,
      status: skillsScore >= 75 ? "excellent" : "good",
      strengths: [`Recognized ${techFound.length} technical skills matching ATS filters`],
      problems: missingKeywords.length > 3 ? ["Could benefit from additional modern industry keywords"] : [],
      suggestions: ["Organize skills into clear subheadings (Languages, Frameworks, Cloud, Developer Tools)."],
    },
    {
      sectionName: "Education & Credentials",
      score: sectionScores.education,
      status: hasEducation ? "excellent" : "needs_work",
      strengths: hasEducation ? ["Degree and academic qualifications formatted clearly"] : [],
      problems: hasEducation ? [] : ["Education section not distinctly identified"],
      suggestions: ["List degree name, institution, graduation year, and relevant honors/coursework."],
    },
  ];

  // 11. Bullet Point Improvements
  const rawBullets = clean
    .split("\n")
    .map((l) => l.trim().replace(/^[-*•]\s*/, ""))
    .filter((l) => l.length >= 25 && l.length <= 160 && !l.includes(":") && !l.toLowerCase().startsWith("education"));

  const sampleBullets = rawBullets.slice(0, 3);
  const bulletPointImprovements: BulletPointImprovement[] = sampleBullets.map((orig, i) => {
    const firstWord = orig.split(" ")[0] || "Worked";
    return {
      id: `bullet-${i + 1}`,
      original: orig,
      problem: "Lacks quantifiable metrics and high-impact action verbs.",
      whyItMatters: "Recruiters and ATS scanners heavily favor bullets that showcase direct business impact with measurable scale.",
      improved: `Spearheaded ${orig.toLowerCase().replace(/^(worked on|responsible for|helped|assisted)\s*/i, "")}, driving a 35% improvement in delivery speed and supporting 10,000+ active users.`,
      category: i % 2 === 0 ? "metrics" : "action_verb",
      metricAddedSuggestion: "Add percentage gains, dollar revenue, team size, or latency reductions.",
    };
  });

  if (bulletPointImprovements.length === 0) {
    bulletPointImprovements.push({
      id: "bullet-demo-1",
      original: "Worked with team to build web application features and fix bugs.",
      problem: "Passive language ('worked with') and zero quantifiable results.",
      whyItMatters: "Passive verbs diminish perceived leadership and technical ownership.",
      improved: "Engineered 12+ responsive web application features using React and TypeScript, decreasing bug turnaround time by 40%.",
      category: "action_verb",
      metricAddedSuggestion: "Specify feature count and bug resolution reduction rate.",
    });
  }

  // 12. Formatting Issues
  const formattingIssues: FormattingIssue[] = [];
  if (wordCount < 200) {
    formattingIssues.push({
      severity: "medium",
      category: "Word Count",
      issue: "Resume is shorter than the standard 400-600 word benchmark.",
      fix: "Add 2-3 additional high-impact bullet points to each job experience.",
    });
  }
  if (!clean.includes("@")) {
    formattingIssues.push({
      severity: "high",
      category: "Contact Details",
      issue: "No email address found in the document.",
      fix: "Place your email and phone number at the very top of your resume.",
    });
  }
  if (formattingIssues.length === 0) {
    formattingIssues.push({
      severity: "low",
      category: "Header Spacing",
      issue: "Ensure 1-inch margins and standard 10-12pt typography for optimal print/PDF readability.",
      fix: "Use single-column layout with clean standard bullet points.",
    });
  }

  // 13. Insights
  const experienceInsight: ExperienceInsight = {
    jobTitlesDetected: ["Software Engineer", "Developer", "Specialist"].filter((t) => lower.includes(t.toLowerCase())),
    estimatedYearsExperience: wordCount > 400 ? "3 - 5 Years" : "1 - 3 Years",
    measurableResultsCount: metricsCount,
    actionVerbStrength: strongVerbCount >= 4 ? "strong" : strongVerbCount >= 2 ? "moderate" : "weak",
    summaryRemarks: `Found ${metricsCount} measurable outcomes and ${strongVerbCount} action verbs throughout experience entries.`,
  };

  const educationInsight: EducationInsight = {
    degreeDetected: hasEducation ? "Bachelor of Science / Degree detected" : undefined,
    institutionDetected: hasEducation ? "University / College" : undefined,
    summaryRemarks: hasEducation ? "Education records are clearly formatted." : "Ensure education details are easily discoverable.",
  };

  return {
    id: "analysis_" + Math.random().toString(36).substring(2, 10),
    userId,
    resumeId: "res_" + Math.random().toString(36).substring(2, 10),
    filename,
    createdAt: new Date().toISOString(),
    atsScore,
    scoreTier,
    summary: `Comprehensive ATS audit calculated an overall score of ${atsScore}/100. Identified ${techFound.length} technical skills, ${metricsCount} quantifiable outcomes, and ${strongVerbCount} action verbs.`,
    strengths,
    weaknesses,
    missingKeywords,
    detectedSkills,
    categoryScores,
    sectionScores,
    sectionDetails,
    bulletPointImprovements,
    formattingIssues,
    experienceInsight,
    educationInsight,
    extractedTextSnippet: clean.substring(0, 400),
    targetRole: targetRole || "Software Professional",
  };
}

export function runClientJobMatch(
  resumeText: string,
  jobDescription: string,
  jobTitle = "Target Role",
  userId = "demo-user-123"
): JobMatchResult {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  const matching: string[] = [];
  const missing: string[] = [];

  COMMON_TECH_SKILLS.forEach((skill) => {
    const reg = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (reg.test(jobDescription)) {
      if (reg.test(resumeText)) {
        matching.push(skill);
      } else {
        missing.push(skill);
      }
    }
  });

  const matchRatio = matching.length + missing.length > 0 ? matching.length / (matching.length + missing.length) : 0.7;
  const matchScore = Math.max(35, Math.min(95, Math.round(matchRatio * 75 + 20)));

  return {
    id: "match_" + Math.random().toString(36).substring(2, 10),
    userId,
    resumeId: "res_active",
    jobTitle,
    jobDescriptionSnippet: jobDescription.substring(0, 180),
    matchScore,
    matchingKeywords: matching.slice(0, 8),
    missingKeywords: missing.slice(0, 8),
    matchingSkills: matching.slice(0, 6),
    missingSkills: missing.slice(0, 6),
    recommendedChanges: [
      `Integrate missing keywords: ${missing.slice(0, 3).join(", ") || "target role frameworks"} into your experience section.`,
      `Highlight recent projects that align with ${jobTitle} requirements.`,
      "Quantify your accomplishments using metrics similar to the job requirements.",
    ],
    sectionsToImprove: [
      {
        section: "Technical Skills",
        advice: `Add ${missing.slice(0, 3).join(", ") || "relevant tooling"} if you have experience with them.`,
      },
      {
        section: "Experience Bullets",
        advice: "Tailor your project descriptions to mirror the core responsibilities in this job description.",
      },
    ],
    tailoredBulletSuggestions: [
      {
        original: "Developed web application components and APIs.",
        tailoredForJob: `Architected scalable web components aligned with ${jobTitle} standards, integrating ${matching[0] || "modern frameworks"} to enhance response times by 30%.`,
        reason: `Directly emphasizes ${jobTitle} terminology and business outcomes.`,
      },
    ],
    createdAt: new Date().toISOString(),
  };
}
