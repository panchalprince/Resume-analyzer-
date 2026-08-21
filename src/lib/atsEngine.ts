import {
  ResumeAnalysisResult,
  JobMatchResult,
  DetailedCategoryScores,
  FormattingIssue,
  DetectedSkills,
} from "../types.js";

// Role-specific skill dictionaries for deep matching
export const ROLE_SKILL_PROFILES: Record<
  string,
  {
    keywords: string[];
    coreSkills: string[];
    recommendedSkills: string[];
    tools: string[];
  }
> = {
  "embedded systems engineer": {
    keywords: [
      "embedded c",
      "c++",
      "c",
      "rtos",
      "freertos",
      "microcontroller",
      "microcontrollers",
      "arm cortex",
      "stm32",
      "arduino",
      "uart",
      "spi",
      "i2c",
      "can bus",
      "firmware",
      "device driver",
      "device drivers",
      "dsp",
      "assembly",
      "jtag",
      "oscilloscope",
      "logic analyzer",
      "zephyr",
      "pcb",
      "fpga",
      "ble",
      "bluetooth",
      "gpio",
      "timer",
      "interrupts",
      "dma",
      "embedded linux",
    ],
    coreSkills: ["C", "C++", "Microcontrollers", "Embedded C", "UART", "SPI", "I2C", "ARM Cortex"],
    recommendedSkills: ["FreeRTOS", "STM32", "CAN Bus", "Oscilloscope", "Device Drivers", "JTAG"],
    tools: ["Keil uVision", "STM32CubeIDE", "PlatformIO", "Oscilloscope", "Logic Analyzer", "Git"],
  },
  "vlsi engineer": {
    keywords: [
      "verilog",
      "systemverilog",
      "vhdl",
      "fpga",
      "asic",
      "rtl design",
      "rtl",
      "synopsys",
      "cadence",
      "vivado",
      "modelsim",
      "sta",
      "static timing analysis",
      "synthesis",
      "uvm",
      "place and route",
      "pnr",
      "cmos",
      "dft",
      "physical design",
      "clock domain crossing",
      "cdc",
      "linting",
      "innovus",
      "primetime",
      "tcl",
    ],
    coreSkills: ["Verilog", "SystemVerilog", "RTL Design", "FPGA", "VHDL", "Static Timing Analysis"],
    recommendedSkills: ["UVM", "ASIC", "Synopsys Design Compiler", "Vivado", "DFT", "ModelSim"],
    tools: ["Cadence Virtuoso", "Synopsys PrimeTime", "Xilinx Vivado", "ModelSim", "Tcl"],
  },
  "automotive engineer": {
    keywords: [
      "autosar",
      "can",
      "can bus",
      "lin",
      "flexray",
      "iso 26262",
      "functional safety",
      "matlab",
      "simulink",
      "ecu",
      "embedded c",
      "vector canoe",
      "canalyzer",
      "hil",
      "sil",
      "hil testing",
      "adas",
      "telematics",
      "powertrain",
      "uds",
      "diagnostic",
      "diagnostics",
      "ev",
      "bms",
      "battery management",
    ],
    coreSkills: ["Embedded C", "CAN Bus", "MATLAB / Simulink", "ECU", "ISO 26262", "AUTOSAR"],
    recommendedSkills: ["Vector CANoe", "HIL Testing", "UDS Diagnostics", "LIN", "Functional Safety"],
    tools: ["CANoe", "CANalyzer", "Simulink", "dSPACE HIL", "INCA", "Git"],
  },
  "software engineer": {
    keywords: [
      "javascript",
      "typescript",
      "python",
      "java",
      "c++",
      "c#",
      "react",
      "node.js",
      "express",
      "next.js",
      "rest api",
      "graphql",
      "sql",
      "postgresql",
      "mongodb",
      "redis",
      "docker",
      "kubernetes",
      "aws",
      "git",
      "ci/cd",
      "microservices",
      "system design",
      "agile",
      "unit testing",
      "linux",
    ],
    coreSkills: ["TypeScript", "Python", "React", "Node.js", "SQL", "Git", "REST APIs"],
    recommendedSkills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Microservices", "System Design"],
    tools: ["VS Code", "Docker", "Git", "Postman", "GitHub Actions", "Jira"],
  },
  "data analyst": {
    keywords: [
      "sql",
      "python",
      "r",
      "pandas",
      "numpy",
      "tableau",
      "power bi",
      "excel",
      "advanced excel",
      "statistics",
      "data visualization",
      "data cleaning",
      "etl",
      "data warehousing",
      "bigquery",
      "snowflake",
      "looker",
      "a/b testing",
      "dashboards",
      "business intelligence",
      "eda",
    ],
    coreSkills: ["SQL", "Python", "Tableau", "Power BI", "Excel", "Data Visualization", "Pandas"],
    recommendedSkills: ["ETL Pipelines", "Snowflake", "BigQuery", "A/B Testing", "Statistical Modeling"],
    tools: ["Tableau Desktop", "Power BI", "Jupyter Notebook", "PostgreSQL", "Excel", "Git"],
  },
};

const COMMON_ACTION_VERBS = [
  "Spearheaded", "Engineered", "Architected", "Orchestrated", "Optimized", "Designed",
  "Implemented", "Pioneered", "Automated", "Delivered", "Transformed", "Maximized",
  "Reduced", "Increased", "Accelerated", "Built", "Developed", "Deployed", "Led",
];

/**
 * Match best role profile based on target role string
 */
function findClosestRoleProfile(roleStr: string) {
  const clean = (roleStr || "").toLowerCase();
  for (const [key, profile] of Object.entries(ROLE_SKILL_PROFILES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return { roleName: key, profile };
    }
  }
  // Check word intersections
  if (clean.includes("embedded") || clean.includes("firmware") || clean.includes("iot") || clean.includes("hardware")) {
    return { roleName: "embedded systems engineer", profile: ROLE_SKILL_PROFILES["embedded systems engineer"] };
  }
  if (clean.includes("vlsi") || clean.includes("chip") || clean.includes("rtl") || clean.includes("asic") || clean.includes("fpga") || clean.includes("semiconductor")) {
    return { roleName: "vlsi engineer", profile: ROLE_SKILL_PROFILES["vlsi engineer"] };
  }
  if (clean.includes("automotive") || clean.includes("auto") || clean.includes("vehicle") || clean.includes("ecu") || clean.includes("autosar")) {
    return { roleName: "automotive engineer", profile: ROLE_SKILL_PROFILES["automotive engineer"] };
  }
  if (clean.includes("data") || clean.includes("analyst") || clean.includes("analytics") || clean.includes("bi")) {
    return { roleName: "data analyst", profile: ROLE_SKILL_PROFILES["data analyst"] };
  }
  return { roleName: "software engineer", profile: ROLE_SKILL_PROFILES["software engineer"] };
}

/**
 * Extract contact information from resume
 */
function extractCandidateContact(text: string) {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  
  // Extract likely name from first 2 non-empty lines
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 2 && l.length < 50);
  let name = "";
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (!firstLine.includes("@") && !firstLine.match(/\d{3}/) && !firstLine.toLowerCase().includes("resume") && !firstLine.toLowerCase().includes("curriculum")) {
      name = firstLine;
    }
  }

  return {
    name: name || "Candidate",
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
  };
}

/**
 * Client-Side ATS & Role Analysis Engine
 * Performs deep deterministic parsing when server/AI is offline or busy.
 */
export function runClientATSAnalysis(
  resumeText: string,
  filename = "Resume.pdf",
  targetRole = "Embedded Systems Engineer",
  jobDescription?: string,
): ResumeAnalysisResult {
  const clean = resumeText.trim();
  const lower = clean.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const candidate = extractCandidateContact(clean);
  const { roleName, profile } = findClosestRoleProfile(targetRole);

  // 1. Skill Extraction
  const matchedSkills: string[] = [];
  const partialSkills: string[] = [];
  const missingSkills: string[] = [];

  profile.keywords.forEach((keyword) => {
    const reg = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (reg.test(lower)) {
      // Capitalize nicely
      const pretty = keyword
        .split(" ")
        .map((w) => (w.length <= 4 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(" ");
      if (!matchedSkills.includes(pretty)) {
        matchedSkills.push(pretty);
      }
    }
  });

  // Check core vs recommended
  profile.recommendedSkills.forEach((skill) => {
    const reg = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (!reg.test(lower)) {
      if (!missingSkills.includes(skill)) {
        missingSkills.push(skill);
      }
    } else if (!matchedSkills.includes(skill)) {
      partialSkills.push(skill);
    }
  });

  // Also check if other known tools or skills are present
  profile.tools.forEach((tool) => {
    const reg = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (reg.test(lower) && !matchedSkills.includes(tool)) {
      partialSkills.push(tool);
    }
  });

  // 2. Metrics & Action Verbs
  const metricMatches = clean.match(/(\d+[\d,.]*\s*(%|k|m|ms|us|ghz|mhz|kb|mb|gb|users|clients|x|\+))/gi) || [];
  const metricsCount = metricMatches.length;

  let strongVerbCount = 0;
  COMMON_ACTION_VERBS.forEach((verb) => {
    const reg = new RegExp(`\\b${verb}\\b`, "i");
    if (reg.test(clean)) strongVerbCount++;
  });

  // 3. Section Checks
  const hasSummary = /summary|profile|about me|objective/i.test(clean);
  const hasExperience = /experience|work history|employment|internship/i.test(clean);
  const hasProjects = /projects|portfolio|academic projects/i.test(clean);
  const hasEducation = /education|university|college|bachelor|master|b\.tech|degree/i.test(clean);
  const hasSkillsSec = /skills|technical skills|technologies|proficiencies/i.test(clean);

  // 4. Calculate Scores
  // Skills Match (0-100)
  const skillsRatio = profile.coreSkills.length > 0
    ? Math.min(1, (matchedSkills.length + partialSkills.length * 0.5) / Math.max(4, profile.coreSkills.length))
    : 0.7;
  const skillsMatch = Math.min(100, Math.round(skillsRatio * 55 + 40));

  // Experience Relevance
  const experienceRelevance = Math.min(
    100,
    Math.round((hasExperience ? 40 : 15) + (metricsCount > 2 ? 30 : metricsCount * 10) + (strongVerbCount > 3 ? 25 : strongVerbCount * 6)),
  );

  // Education Relevance
  const educationRelevance = hasEducation ? 90 : 60;

  // Projects Relevance
  const projectsRelevance = hasProjects ? Math.min(100, 75 + Math.min(25, matchedSkills.length * 4)) : 65;

  // Keyword Match
  const keywordMatch = Math.min(100, Math.round(skillsRatio * 50 + (wordCount > 300 ? 35 : 20) + (hasSkillsSec ? 15 : 5)));

  // Structure Score
  let structureScore = 50;
  if (hasSummary) structureScore += 10;
  if (hasExperience) structureScore += 12;
  if (hasProjects) structureScore += 10;
  if (hasEducation) structureScore += 10;
  if (hasSkillsSec) structureScore += 8;
  structureScore = Math.min(100, structureScore);

  // Target Role Fit
  const targetRoleFit = Math.round(
    skillsMatch * 0.35 +
    experienceRelevance * 0.25 +
    projectsRelevance * 0.2 +
    keywordMatch * 0.2
  );

  // ATS Compatibility
  const atsScore = Math.round(
    structureScore * 0.35 +
    keywordMatch * 0.35 +
    (candidate.email && candidate.phone ? 20 : 10) +
    (wordCount >= 350 && wordCount <= 900 ? 10 : 5)
  );

  // Overall Score (Weighted)
  const overallScore = Math.round(
    targetRoleFit * 0.4 +
    atsScore * 0.3 +
    skillsMatch * 0.2 +
    experienceRelevance * 0.1
  );

  const scoreTier =
    overallScore >= 85
      ? "Excellent"
      : overallScore >= 75
      ? "Strong"
      : overallScore >= 60
      ? "Good"
      : overallScore >= 45
      ? "Needs Improvement"
      : "Weak";

  // 5. Strengths & Weaknesses specifically for target role
  const strengths: string[] = [];
  if (matchedSkills.length >= 3) {
    strengths.push(`Demonstrated proficiency in key ${targetRole} technologies: ${matchedSkills.slice(0, 4).join(", ")}.`);
  } else {
    strengths.push(`Core technical foundations present with relevant academic or engineering terminology.`);
  }

  if (metricsCount >= 3) {
    strengths.push(`Effective use of quantifiable metrics (${metricsCount} measurable outcomes found) proving project impact.`);
  } else if (hasProjects) {
    strengths.push(`Hands-on project work explicitly listed showcasing practical application.`);
  }

  if (hasExperience) {
    strengths.push(`Structured professional experience aligned with technical problem-solving standards.`);
  }
  if (hasEducation) {
    strengths.push(`Clear educational credentials and engineering foundation detected.`);
  }

  const weaknesses: string[] = [];
  if (missingSkills.length > 0) {
    weaknesses.push(`Missing high-demand ${targetRole} skills: ${missingSkills.slice(0, 4).join(", ")}.`);
  }
  if (metricsCount < 3) {
    weaknesses.push("Bullet points lack quantifiable performance metrics (throughput, latency, error reduction, user scale).");
  }
  if (!hasSummary) {
    weaknesses.push(`No targeted professional summary at the top explicitly positioning you for ${targetRole}.`);
  }
  if (wordCount < 300) {
    weaknesses.push("Resume content is relatively brief; expanding on technical responsibilities will boost ATS keyword density.");
  }

  // 6. Practical Recommended Improvements
  const recommendedImprovements: string[] = [
    `Integrate missing industry keywords: ${missingSkills.slice(0, 3).join(", ") || "domain protocols and frameworks"} into project descriptions.`,
    "Add measurable results (percentages, throughput, user count, or speedups) to your bullet points.",
    `Include a concise 2-line target summary tailored specifically to "${targetRole}".`,
    "Highlight version control (Git/GitHub) and industry-standard testing methodologies.",
  ];

  // 7. ATS Formatting Issues
  const atsIssues: FormattingIssue[] = [];
  if (!candidate.email) {
    atsIssues.push({
      severity: "high",
      category: "Contact Information",
      issue: "No professional email address was detected in the header.",
      fix: "Place a clean email address at the very top of your resume.",
    });
  }
  if (!candidate.phone) {
    atsIssues.push({
      severity: "medium",
      category: "Contact Information",
      issue: "No direct contact phone number was recognized.",
      fix: "Include a formatted telephone number with country/area code in the header.",
    });
  }
  if (!hasSummary) {
    atsIssues.push({
      severity: "medium",
      category: "Section Hierarchy",
      issue: "Missing target professional profile summary.",
      fix: "Add a 2-3 line Summary section under your contact info to hook recruiters and ATS parsers.",
    });
  }
  if (wordCount < 350) {
    atsIssues.push({
      severity: "medium",
      category: "Content Density",
      issue: "Resume is shorter than the standard 400-600 word benchmark for technical roles.",
      fix: "Expand each project with technical tools, challenges overcome, and concrete outcomes.",
    });
  }
  if (atsIssues.length === 0) {
    atsIssues.push({
      severity: "low",
      category: "Layout & Spacing",
      issue: "Formatting is clean. Ensure standard 1-inch margins and uniform bullet spacing.",
      fix: "Maintain single-column hierarchy for flawless ATS text stream extraction.",
    });
  }

  // 8. Priority Suggestions
  const highPrioritySuggestions = [
    `Add missing core keywords: ${missingSkills.slice(0, 3).join(", ") || "specialized domain tools"} to relevant project bullet points.`,
    "Quantify your work with concrete metrics (e.g., 'reduced latency by 25%', 'tested across 10+ hardware revisions').",
  ];

  const mediumPrioritySuggestions = [
    `Add a target role title '${targetRole}' directly under your name to establish immediate role alignment.`,
    "Group technical skills into clear categories (Languages, Tools, Protocols/Frameworks, Platforms).",
  ];

  const lowPrioritySuggestions = [
    "Ensure consistent past-tense action verbs across all previous work experiences.",
    "Include direct links to GitHub repositories or online demonstration portfolios.",
  ];

  // Summary tailored specifically to role
  const summary = `Your resume demonstrates a ${scoreTier.toLowerCase()} match for a ${targetRole} position, highlighted by experience with ${matchedSkills.slice(0, 3).join(", ") || "core technical concepts"}. Targeting key missing skills (${missingSkills.slice(0, 3).join(", ") || "specialized tooling"}) and adding quantifiable metrics will optimize your ATS visibility.`;

  const detectedSkills: DetectedSkills = {
    technical: matchedSkills.slice(0, 6),
    programmingLanguages: matchedSkills.filter((s) => ["C", "C++", "Python", "Java", "JavaScript", "TypeScript", "Verilog", "VHDL"].includes(s)),
    tools: partialSkills.slice(0, 5),
    soft: ["Problem Solving", "Collaboration", "Technical Communication"],
  };

  const categoryScores: DetailedCategoryScores = {
    atsCompatibility: atsScore,
    skillsMatch,
    experienceRelevance,
    educationRelevance,
    projectsRelevance,
    keywordMatch,
    resumeStructure: structureScore,
    targetRoleFit,
  };

  return {
    id: "analysis_" + Math.random().toString(36).substring(2, 10),
    filename,
    targetRole,
    createdAt: new Date().toISOString(),
    overallScore,
    atsScore,
    scoreTier,
    skillsMatch,
    experienceRelevance,
    educationRelevance,
    projectsRelevance,
    keywordMatch,
    structureScore,
    targetRoleFit,
    summary,
    candidate,
    matchedSkills,
    partialSkills,
    missingSkills,
    strengths,
    weaknesses,
    recommendedImprovements,
    atsIssues,
    missingKeywords: missingSkills.concat(["Git", "Unit Testing", "Documentation"]),
    highPrioritySuggestions,
    mediumPrioritySuggestions,
    lowPrioritySuggestions,
    detectedSkills,
    categoryScores,
    extractedTextSnippet: clean.substring(0, 600),
    jobDescriptionSnippet: jobDescription ? jobDescription.substring(0, 300) : undefined,
  };
}

export function runClientJobMatch(
  resumeText: string,
  jobDescription: string,
  jobTitle = "Target Role",
): JobMatchResult {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  const matching: string[] = [];
  const missing: string[] = [];

  const allKeywords = [
    ...ROLE_SKILL_PROFILES["embedded systems engineer"].keywords,
    ...ROLE_SKILL_PROFILES["software engineer"].keywords,
    ...ROLE_SKILL_PROFILES["vlsi engineer"].keywords,
    ...ROLE_SKILL_PROFILES["automotive engineer"].keywords,
    ...ROLE_SKILL_PROFILES["data analyst"].keywords,
  ];

  const unique = Array.from(new Set(allKeywords));

  unique.forEach((skill) => {
    const reg = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (reg.test(jdLower)) {
      const pretty = skill.charAt(0).toUpperCase() + skill.slice(1);
      if (reg.test(resumeLower)) {
        matching.push(pretty);
      } else {
        missing.push(pretty);
      }
    }
  });

  const matchRatio =
    matching.length + missing.length > 0
      ? matching.length / (matching.length + missing.length)
      : 0.75;
  const matchScore = Math.max(35, Math.min(95, Math.round(matchRatio * 70 + 25)));

  return {
    id: "match_" + Math.random().toString(36).substring(2, 10),
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
    createdAt: new Date().toISOString(),
  };
}
