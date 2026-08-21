import { ResumeAnalysisResult } from "../types.js";

export interface SampleResumePreset {
  id: string;
  role: string;
  filename: string;
  description: string;
  experienceLevel: "Entry" | "Mid-Level" | "Senior";
  text: string;
  sampleJobDescription?: string;
  precomputedAnalysis?: Partial<ResumeAnalysisResult>;
}

export const SAMPLE_RESUMES: SampleResumePreset[] = [
  {
    id: "sample-senior-swe",
    role: "Senior Full Stack Software Engineer",
    filename: "Alex_Morgan_Senior_SWE_Resume.pdf",
    experienceLevel: "Senior",
    description:
      "Cloud-native web developer with 6+ years experience in React, Node.js, AWS, and distributed microservices.",
    sampleJobDescription: `Senior Full Stack Engineer
Company: CloudScale Dynamics
Location: Remote / Hybrid

About the Role:
We are seeking a Senior Full Stack Engineer with strong proficiency in TypeScript, React, Node.js, GraphQL, and AWS. The ideal candidate has experience building distributed high-throughput web applications, designing RESTful and GraphQL APIs, optimizing database performance on PostgreSQL and Redis, implementing CI/CD pipelines with GitHub Actions, and collaborating in an Agile environment.

Requirements:
- 5+ years of experience with modern frontend frameworks (React, Next.js, Tailwind CSS)
- 4+ years of backend development (Node.js/Express, Go, or Python)
- Strong experience with relational databases (PostgreSQL) and caching (Redis)
- Practical experience with AWS services (ECS, Lambda, S3, CloudFront)
- Proven track record of improving system latency, test coverage, and mentoring junior engineers
- Excellent communication skills and automated testing mindset (Jest, Playwright)`,
    text: `Alex Morgan
alex.morgan.tech@example.com | (555) 234-5678 | San Francisco, CA
LinkedIn: linkedin.com/in/alexmorgandev | GitHub: github.com/alexmorgan-dev

PROFESSIONAL SUMMARY
Results-driven Senior Full Stack Engineer with 6+ years of experience architecting high-availability web applications and microservices. Proven track record in migrating monolithic architectures to serverless cloud infrastructure on AWS, reducing operational costs by 32%, and accelerating page load speeds by 45%. Adept at leading cross-functional engineering teams, establishing automated CI/CD workflows, and championing test-driven development.

TECHNICAL SKILLS
- Programming Languages: TypeScript, JavaScript (ES6+), Python, Go, SQL, HTML5/CSS3
- Frontend: React 18, Next.js, Redux Toolkit, Tailwind CSS, Vue.js, Webpack, Vite
- Backend & Cloud: Node.js, Express.js, GraphQL, REST APIs, AWS (Lambda, ECS, S3, RDS, CloudFront), Docker, Kubernetes
- Databases & Caching: PostgreSQL, MongoDB, Redis, Elasticsearch
- DevOps & Tools: Git, GitHub Actions, Terraform, Jest, Cypress, Datadog, Jira

PROFESSIONAL EXPERIENCE
Lead Full Stack Engineer | Apex Cloud Solutions, San Francisco, CA
June 2022 - Present
- Architected and deployed multi-tenant SaaS analytics platform using React, Node.js, and PostgreSQL serving 120,000+ daily active users.
- Redesigned core query engine and integrated Redis caching layer, decreasing p95 API response latency from 680ms to 95ms (86% reduction).
- Spearheaded migration of 14 monolithic services into containerized microservices orchestrated via Docker and AWS ECS, boosting system uptime to 99.98%.
- Mentored cohort of 5 junior and mid-level software engineers; instituted automated code review guidelines and PR workflows that reduced deployment rollbacks by 40%.
- Integrated comprehensive Jest and Playwright end-to-end automated test suites, expanding code coverage from 52% to 89%.

Full Stack Developer | Veloce Systems Inc., Austin, TX
August 2019 - May 2022
- Developed responsive client dashboard in React/TypeScript with real-time WebSocket telemetry charts, driving 28% increase in user session duration.
- Built scalable payment processing pipeline using Stripe API and Express.js, successfully processing over $4.2M in monthly transaction volume.
- Configured CI/CD automation pipelines via GitHub Actions, decreasing standard release deployment cycle time from 4 hours to 18 minutes.
- Collaborated closely with Product and UX teams to execute A/B conversion experiments, generating a 14% lift in checkout conversions.

Software Engineering Intern | NextGen Software, Seattle, WA
June 2018 - August 2019
- Assisted in developing RESTful endpoints in Python/Django and refactored relational database queries in PostgreSQL.
- Authored technical documentation and internal developer onboarding guides.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley (2015 - 2019)
- Honors: Dean's Honor List (3 Semesters), Magna Cum Laude
- Relevant Coursework: Data Structures & Algorithms, Operating Systems, Database Systems, Computer Networks

PROJECTS
- DevSync (Open Source): Collaborative code review extension with over 3,500 active GitHub stars. Built using TypeScript, WebSockets, and WebAssembly.
- CloudPulse: Serverless AWS health monitoring dashboard utilizing Next.js, Tailwind, and DynamoDB.

CERTIFICATIONS
- AWS Certified Solutions Architect - Associate (2023)
- Certified Kubernetes Application Developer (CKAD) (2022)`,
  },
  {
    id: "sample-product-manager",
    role: "Product Manager (B2B SaaS)",
    filename: "Jordan_Taylor_PM_Resume.docx",
    experienceLevel: "Mid-Level",
    description:
      "Product leader with 4+ years driving user growth, roadmap prioritization, user research, and revenue growth in B2B enterprise software.",
    sampleJobDescription: `Product Manager - Growth & Monetization
Company: SaaSify Global
Location: New York, NY

We are looking for a data-driven Product Manager to lead our self-serve product growth, activation, and monetization funnels. You will collaborate with engineering, product marketing, sales, and design to identify user friction, design experiments, and scale our ARR.

Key Requirements:
- 3+ years experience as a PM in B2B SaaS or consumer tech
- Strong proficiency with product analytics tools (Mixpanel, Amplitude, Segment, SQL)
- Proven experience running A/B testing programs and user interviews
- Deep understanding of product-led growth (PLG) strategies and onboarding flows
- Exceptional stakeholder communication and cross-functional leadership`,
    text: `Jordan Taylor
jordan.taylor.pm@example.com | (555) 876-5432 | New York, NY
linkedin.com/in/jordantaylor-pm

SUMMARY
Data-driven Product Manager with 4+ years of experience steering product strategy, PLG user onboarding, and enterprise SaaS feature delivery. Successfully launched 3 zero-to-one product initiatives resulting in $1.8M ARR growth. Expert at bridging technical roadmaps with user research, statistical A/B testing, and cross-functional leadership across engineering, UX, and sales.

CORE SKILLS
- Product Strategy: Product Roadmap, Agile/Scrum, OKR Alignment, User Journey Mapping, Feature Prioritization (RICE/MoSCoW)
- Analytics & Testing: SQL, Amplitude, Mixpanel, Google Analytics 4, Optimizely, A/B Testing, Cohort Analysis
- Technical & Tools: Jira, Confluence, Figma, Notion, Postman, Zapier, Python (Basic)
- Leadership: Stakeholder Management, Customer Discovery, Sprint Planning, Go-To-Market (GTM)

EXPERIENCE
Product Manager | Datastream SaaS, New York, NY
January 2021 - Present
- Owned self-serve onboarding funnel and PLG activation flow, lifting free-to-paid user conversion rate from 3.2% to 5.8% within 9 months.
- Led cross-functional team of 8 engineers and 2 product designers to launch enterprise SSO and role-based access control (RBAC), unblocking $650k in pipeline deals.
- Conducted 60+ qualitative user interviews and analyzed event telemetry in Amplitude to discover key onboarding drop-offs, driving a redesign that reduced time-to-first-value by 35%.
- Authored PRDs, user stories, and acceptance criteria in Jira with a 96% sprint delivery adherence rate.

Associate Product Manager | VentureLoop, Boston, MA
June 2019 - December 2020
- Managed customer feedback portal and prioritized 45+ feature requests into quarterly roadmap milestones using RICE framework.
- Partnered with product marketing to coordinate feature release communications, boosting monthly feature adoption by 22%.
- Analyzed churn cohorts in SQL and designed in-app re-engagement workflows that curtailed quarterly account churn by 1.4%.

EDUCATION
Bachelor of Business Administration, Information Systems
Boston University (2015 - 2019)
- Magna Cum Laude, President of Undergraduate Tech Club

CERTIFICATIONS
- Pragmatic Institute Certified (PMC-III) (2022)
- Certified Scrum Product Owner (CSPO) (2021)`,
  },
  {
    id: "sample-data-analyst",
    role: "Junior Data Analyst / BI Specialist",
    filename: "Sam_Patel_Data_Analyst_Resume.pdf",
    experienceLevel: "Entry",
    description:
      "Analytical problem solver skilled in SQL, Python, Tableau, Power BI, and statistical modeling with internships in retail and finance.",
    sampleJobDescription: `Junior Data Analyst
Company: Metro Analytics Group
Location: Chicago, IL / Remote

Join our business intelligence team to transform raw data into actionable dashboards and strategic insights. You will write SQL queries, build automated Tableau reports, analyze marketing KPIs, and present recommendations to department heads.

Qualifications:
- Bachelor's in Data Science, Statistics, Mathematics, Economics, or related field
- Strong SQL skills (joins, window functions, CTEs)
- Hands-on experience with Tableau, Power BI, or Looker
- Python or R for exploratory data analysis (Pandas, NumPy, Matplotlib)
- Strong attention to detail and data storytelling ability`,
    text: `Sam Patel
sam.patel.data@example.com | (555) 345-6789 | Chicago, IL
linkedin.com/in/sampatel-analytics | github.com/sampatel-data

OBJECTIVE
Motivated Data Analyst with strong technical background in SQL, Python, and Tableau. Experienced in transforming complex datasets into intuitive BI dashboards and predictive models that improve operational decision-making.

SKILLS
- Data Analysis: SQL (PostgreSQL, MySQL), Python (Pandas, NumPy, Scikit-learn), Excel (VLOOKUP, Pivot Tables, Power Query)
- Visualization: Tableau Desktop, Power BI, Looker Studio, Seaborn, Matplotlib
- Databases & Tools: Snowflake, BigQuery, Git, Jupyter Notebooks, Jira

WORK EXPERIENCE
Data Analyst Intern | Apex Retail Group, Chicago, IL
June 2023 - December 2023
- Built automated SQL ETL pipelines in PostgreSQL to consolidate daily sales records across 42 store locations.
- Designed executive Tableau dashboards tracking weekly inventory turnover and gross margins, reducing manual reporting hours by 12 hours/week.
- Performed customer segmentation analysis using K-Means clustering in Python, identifying high-value buyer personas responsible for 38% of holiday revenue.

Junior Research Assistant | University Data Lab, Urbana-Champaign, IL
September 2022 - May 2023
- Cleaned and normalized messy survey datasets containing over 85,000 responses using Python Pandas.
- Created interactive visualization charts for academic faculty publications.

EDUCATION
Bachelor of Science in Statistics & Data Science
University of Illinois Urbana-Champaign (2019 - 2023)
- GPA: 3.82/4.0
- Coursework: Applied Regression Analysis, Relational Database Modeling, Statistical Computing, Machine Learning Fundamentals

PROJECTS
- E-Commerce Churn Predictor: Built logistic regression and random forest models in Python achieving 84% accuracy in predicting customer subscription cancellations.
- Real Estate Market Dashboard: Interactive Power BI dashboard visualizing price trends across 50 US metropolitan regions.`,
  },
];
