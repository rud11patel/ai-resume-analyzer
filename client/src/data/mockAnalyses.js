/**
 * Curated mock analyses showcasing diverse scores and roles
 * All records represent demo/sample data for Phase 2 UI demonstration.
 */
export const INITIAL_MOCK_ANALYSES = [
  {
    id: 'analysis-01',
    roleTitle: 'Senior Frontend Engineer',
    company: 'Stripe / FinTech Cloud',
    createdAt: '2026-10-12T10:30:00.000Z',
    fileName: 'Alex_Morgan_Resume_2026.pdf',
    fileSize: 142850,
    fileType: 'application/pdf',
    overallScore: 84,
    scoreLabel: 'Strong Match',
    subScores: {
      technicalSkills: 88,
      experienceRelevance: 82,
      atsFormatting: 92,
      keywordDensity: 74,
    },
    skillMatchSummary: {
      totalIdentified: 18,
      matchedCount: 15,
      missingCount: 3,
      percentage: 83,
    },
    matchedSkills: [
      { name: 'React', category: 'Frontend', level: 'Expert', confidence: 96 },
      { name: 'TypeScript', category: 'Languages', level: 'Proficient', confidence: 92 },
      { name: 'Tailwind CSS', category: 'Styling', level: 'Expert', confidence: 95 },
      { name: 'JavaScript (ES6+)', category: 'Languages', level: 'Expert', confidence: 98 },
      { name: 'REST APIs', category: 'Integration', level: 'Proficient', confidence: 90 },
      { name: 'Git & GitHub', category: 'DevOps', level: 'Proficient', confidence: 88 },
      { name: 'Performance Optimization', category: 'Engineering', level: 'Intermediate', confidence: 80 },
      { name: 'Web Vitals & Profiling', category: 'Engineering', level: 'Intermediate', confidence: 78 },
      { name: 'Unit Testing (Jest)', category: 'Testing', level: 'Intermediate', confidence: 75 },
    ],
    missingSkills: [
      { 
        name: 'GraphQL', 
        category: 'Integration', 
        priority: 'High', 
        context: 'Explicitly highlighted in API consumption requirements for client-side queries.' 
      },
      { 
        name: 'Cypress / Playwright', 
        category: 'Testing', 
        priority: 'Medium', 
        context: 'End-to-end browser testing mentioned as a critical QA gate.' 
      },
      { 
        name: 'Docker / Containerization', 
        category: 'DevOps', 
        priority: 'Low', 
        context: 'Helpful for local reproducible development environments.' 
      },
    ],
    keywordsFound: [
      { keyword: 'React 18', count: 6, relevance: 'High' },
      { keyword: 'Responsive Design', count: 4, relevance: 'High' },
      { keyword: 'Component Architecture', count: 3, relevance: 'Medium' },
      { keyword: 'State Management', count: 3, relevance: 'Medium' },
      { keyword: 'Vite Tooling', count: 2, relevance: 'Medium' },
      { keyword: 'Accessibility (a11y)', count: 2, relevance: 'High' },
    ],
    keywordsMissing: [
      { keyword: 'Micro-frontends', importance: 'Medium', suggestion: 'If you have worked on modular federated UI components, consider adding this context.' },
      { keyword: 'CI/CD Pipelines', importance: 'High', suggestion: 'Mention your experience with automated build and release workflows.' },
      { keyword: 'WCAG 2.1 AA Compliance', importance: 'High', suggestion: 'Quantify specific accessibility standards applied to customer-facing projects.' },
    ],
    experienceRelevance: {
      yearsRequired: '5+ years',
      yearsDetected: '4.5 years',
      levelAssessment: 'Strong alignment with senior technical depth and architectural responsibilities.',
      breakdown: [
        { area: 'Frontend Architecture', score: 90, comment: 'Substantial hands-on leadership building scalable web applications.' },
        { area: 'Cross-functional Collaboration', score: 85, comment: 'Active participation in design reviews and backend contract negotiations.' },
        { area: 'Testing & Reliability', score: 70, comment: 'Demonstrated unit testing; automated end-to-end test coverage could be highlighted further.' },
      ],
    },
    recommendations: [
      {
        impact: 'High Impact',
        title: 'Highlight E2E testing frameworks',
        description: 'The job posting explicitly emphasizes Cypress or Playwright. If you have testing experience with browser runners, add 1-2 bullet points highlighting test suites you authored.',
      },
      {
        impact: 'Medium Impact',
        title: 'Include GraphQL query integration',
        description: 'Detail any past work with Apollo Client, Urql, or GraphQL queries alongside your REST API integrations.',
      },
      {
        impact: 'Quick Win',
        title: 'Specify quantifiable web performance metrics',
        description: 'Replace generic "improved page speed" with concrete metrics like "reduced Largest Contentful Paint (LCP) by 38%".',
      },
    ],
    improvedBulletPoints: [
      {
        original: 'Worked on frontend web pages and fixed multiple user interface bugs using React.',
        improved: 'Architected 14+ reusable React components and resolved critical rendering bottlenecks, reducing UI bug reports by 42% across 85,000 monthly active users.',
        rationale: 'Replaces passive verb "worked" with active leadership "architected", adds quantified metrics, and establishes production scale.',
      },
      {
        original: 'Made the website faster by optimizing images and code splitting with Vite.',
        improved: 'Engineered route-based code splitting and lazy loading via Vite, cutting initial JavaScript bundle size by 35% and improving Largest Contentful Paint (LCP) from 3.2s to 1.4s.',
        rationale: 'Specifies exact engineering techniques and demonstrates direct business impact with measurable performance numbers.',
      },
    ],
    atsChecks: [
      { item: 'File format & encoding', status: 'Passed', message: 'PDF text layer is fully searchable and machine-parseable.' },
      { item: 'Contact information', status: 'Passed', message: 'Email, phone, LinkedIn, and GitHub links detected in standard header.' },
      { item: 'Standard section headings', status: 'Passed', message: 'Experience, Education, Skills, and Projects clearly delineated.' },
      { item: 'Tables & multi-column layouts', status: 'Passed', message: 'Clean single/dual column structure without problematic nested tables.' },
      { item: 'Font compatibility', status: 'Passed', message: 'Uses standard clean sans-serif typography recognizable by legacy parsers.' },
      { item: 'Chronological timeline order', status: 'Warning', message: 'Ensure most recent employment is listed first without date overlaps.' },
    ],
    llmFeedback: {
      generatedAt: '2026-10-12T10:30:15.000Z',
      executiveSummary: 'Candidate presents a strong frontend foundation with extensive React, TypeScript, and modern styling experience that aligns closely with Stripe\'s core UI engineering requirements. Primary gap is lack of documented end-to-end testing (Cypress/Playwright) and containerization in production environments.',
      strengths: [
        'Demonstrated mastery of React, TypeScript, and Tailwind CSS with demonstrable client-side state management.',
        'Clear focus on Core Web Vitals optimization and bundle size reduction techniques.',
        'Production track record building scalable reusable component design systems.',
      ],
      criticalGaps: [
        'Missing Evidence: No explicit mention of E2E browser automation (Cypress, Playwright) required by Stripe\'s QA pipeline.',
        'Missing Evidence: GraphQL client integration (Apollo/Urql) absent despite job description prioritizing client-side schema consumption.',
        'Skill Gap: Minimal containerization and CI/CD workflow details for local and deployed micro-frontend environments.',
      ],
      actionableRecommendations: [
        {
          section: 'Work Experience - Recent Projects',
          currentObservation: 'Highlights React component creation and bug fixes but does not showcase automated testing.',
          suggestedImprovement: 'Add a bullet point demonstrating how you validated components using integration and E2E testing to prevent production regressions.',
          exampleRewrite: 'Engineered comprehensive test coverage using [Jest/React Testing Library/Cypress], decreasing regression escape rates by [X%] across [N] core checkout flows.',
        },
        {
          section: 'Technical Skills & API Integration',
          currentObservation: 'Lists REST APIs and JSON endpoints without detailing API query abstraction or caching layers.',
          suggestedImprovement: 'Explicitly mention experience querying GraphQL endpoints or managing optimistic UI updates with caching libraries.',
          exampleRewrite: 'Implemented client-side data fetching and normalized caching utilizing [Apollo Client / TanStack Query], reducing redundant network roundtrips by [X%].',
        },
        {
          section: 'Professional Summary',
          currentObservation: 'Generic introductory statement that does not highlight high-scale distributed frontend architecture.',
          suggestedImprovement: 'Position yourself directly as a Senior Frontend Specialist with focus on mission-critical financial or SaaS user interfaces.',
          exampleRewrite: 'Senior Frontend Engineer with [N] years building high-reliability, accessible React/TypeScript interfaces serving [N,000+] active users with sub-second page loads.',
        },
      ],
    },
  },
  {
    id: 'analysis-02',
    roleTitle: 'Full Stack Software Engineer',
    company: 'Linear / SaaS Workflow',
    createdAt: '2026-10-10T14:15:00.000Z',
    fileName: 'Alex_Morgan_Technical_CV.docx',
    fileSize: 98400,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    overallScore: 76,
    scoreLabel: 'Good Match',
    subScores: {
      technicalSkills: 78,
      experienceRelevance: 75,
      atsFormatting: 85,
      keywordDensity: 66,
    },
    skillMatchSummary: {
      totalIdentified: 16,
      matchedCount: 12,
      missingCount: 4,
      percentage: 75,
    },
    matchedSkills: [
      { name: 'Node.js', category: 'Backend', level: 'Proficient', confidence: 90 },
      { name: 'Express.js', category: 'Backend', level: 'Proficient', confidence: 88 },
      { name: 'MongoDB', category: 'Database', level: 'Proficient', confidence: 86 },
      { name: 'React', category: 'Frontend', level: 'Expert', confidence: 94 },
      { name: 'REST APIs', category: 'Architecture', level: 'Proficient', confidence: 90 },
      { name: 'JavaScript', category: 'Languages', level: 'Expert', confidence: 95 },
      { name: 'Docker', category: 'DevOps', level: 'Intermediate', confidence: 74 },
    ],
    missingSkills: [
      { 
        name: 'PostgreSQL / SQL', 
        category: 'Database', 
        priority: 'High', 
        context: 'Relational database schema modeling and complex joins are emphasized in the description.' 
      },
      { 
        name: 'Redis / Caching', 
        category: 'Backend', 
        priority: 'Medium', 
        context: 'In-memory caching and session synchronization mentioned for high-throughput endpoints.' 
      },
      { 
        name: 'WebSockets', 
        category: 'Networking', 
        priority: 'Medium', 
        context: 'Real-time collaborative updates require socket event handling experience.' 
      },
      { 
        name: 'Kubernetes', 
        category: 'DevOps', 
        priority: 'Low', 
        context: 'Container orchestration listed under nice-to-have qualifications.' 
      },
    ],
    keywordsFound: [
      { keyword: 'Full Stack', count: 4, relevance: 'High' },
      { keyword: 'API Design', count: 3, relevance: 'High' },
      { keyword: 'NoSQL Database', count: 2, relevance: 'Medium' },
      { keyword: 'Microservices', count: 2, relevance: 'Medium' },
    ],
    keywordsMissing: [
      { keyword: 'Relational Database', importance: 'High', suggestion: 'Mention any SQL experience or transactional schema design.' },
      { keyword: 'Optimistic UI', importance: 'Medium', suggestion: 'Describe how you handle instant user feedback during asynchronous server sync.' },
      { keyword: 'Automated CI/CD', importance: 'Medium', suggestion: 'Reference test execution and automated deployment gates.' },
    ],
    experienceRelevance: {
      yearsRequired: '3+ years',
      yearsDetected: '4.5 years',
      levelAssessment: 'Exceeds minimum tenure requirements; backend distributed systems emphasis could be accentuated.',
      breakdown: [
        { area: 'Frontend & UI', score: 92, comment: 'Very strong React capabilities that match Linear product standards.' },
        { area: 'Backend & APIs', score: 74, comment: 'Solid Express and Node.js foundation; add depth on data migration and relational queries.' },
        { area: 'DevOps & Tooling', score: 62, comment: 'Basic Docker familiarity present; showcase deployment automation.' },
      ],
    },
    recommendations: [
      {
        impact: 'High Impact',
        title: 'Include SQL / relational database experience',
        description: 'The job posting specifically asks for PostgreSQL knowledge. If you have built relational schemas or written SQL queries, add them prominently in your technical skills and project bullets.',
      },
      {
        impact: 'Medium Impact',
        title: 'Highlight real-time event systems',
        description: 'Mention any WebSocket, Socket.io, or SSE implementations you built for live data updates.',
      },
      {
        impact: 'Quick Win',
        title: 'Document API performance benchmarks',
        description: 'State the requests-per-second or response latency achievements for your backend services.',
      },
    ],
    improvedBulletPoints: [
      {
        original: 'Built backend endpoints in Express to handle user accounts and data storage.',
        improved: 'Developed 22+ authenticated REST endpoints in Express with Mongoose validation, serving 120k requests daily with sub-80ms median response times.',
        rationale: 'Demonstrates security mindfulness, API scope, throughput, and concrete latency benchmarks.',
      },
    ],
    atsChecks: [
      { item: 'File format & encoding', status: 'Passed', message: 'Valid DOCX structure with clear XML schema.' },
      { item: 'Contact information', status: 'Passed', message: 'Valid contact email and location header.' },
      { item: 'Standard section headings', status: 'Passed', message: 'Clear section divisions recognized.' },
      { item: 'Tables & multi-column layouts', status: 'Warning', message: 'Two-column skill table may cause text reading order issues in older ATS parsers.' },
      { item: 'Font compatibility', status: 'Passed', message: 'Calibri typography with standard line heights.' },
      { item: 'Chronological timeline order', status: 'Passed', message: 'Reverse chronological order followed strictly.' },
    ],
  },
  {
    id: 'analysis-03',
    roleTitle: 'AI / Machine Learning Engineer',
    company: 'Cohere / Generative AI Labs',
    createdAt: '2026-10-06T18:40:00.000Z',
    fileName: 'Alex_Morgan_ML_Candidate.pdf',
    fileSize: 184500,
    fileType: 'application/pdf',
    overallScore: 59,
    scoreLabel: 'Needs Work',
    subScores: {
      technicalSkills: 54,
      experienceRelevance: 58,
      atsFormatting: 88,
      keywordDensity: 36,
    },
    skillMatchSummary: {
      totalIdentified: 15,
      matchedCount: 8,
      missingCount: 7,
      percentage: 53,
    },
    matchedSkills: [
      { name: 'Python', category: 'Languages', level: 'Proficient', confidence: 88 },
      { name: 'NumPy', category: 'Data Science', level: 'Intermediate', confidence: 75 },
      { name: 'Pandas', category: 'Data Science', level: 'Intermediate', confidence: 72 },
      { name: 'FastAPI', category: 'API Serving', level: 'Intermediate', confidence: 78 },
      { name: 'Git', category: 'Tooling', level: 'Proficient', confidence: 90 },
      { name: 'Docker', category: 'DevOps', level: 'Intermediate', confidence: 70 },
    ],
    missingSkills: [
      { 
        name: 'PyTorch / TensorFlow', 
        category: 'Deep Learning', 
        priority: 'High', 
        context: 'Core deep learning framework required for neural network modeling and fine-tuning.' 
      },
      { 
        name: 'Hugging Face / Transformers', 
        category: 'NLP', 
        priority: 'High', 
        context: 'Standard industry library for LLM inference, tokenization, and pipeline development.' 
      },
      { 
        name: 'Vector Databases (e.g. Pinecone/Chroma)', 
        category: 'Data Retrieval', 
        priority: 'High', 
        context: 'Critical for Retrieval-Augmented Generation (RAG) and semantic similarity search.' 
      },
      { 
        name: 'MLflow / Experiment Tracking', 
        category: 'MLOps', 
        priority: 'Medium', 
        context: 'Required for tracking model hyperparameter runs and metric artifacts.' 
      },
      { 
        name: 'LangChain / LlamaIndex', 
        category: 'LLM Orchestration', 
        priority: 'Medium', 
        context: 'Prompt orchestration and document chunking frameworks.' 
      },
    ],
    keywordsFound: [
      { keyword: 'Python Scripting', count: 3, relevance: 'High' },
      { keyword: 'Data Analysis', count: 2, relevance: 'Medium' },
      { keyword: 'API Endpoints', count: 2, relevance: 'Medium' },
    ],
    keywordsMissing: [
      { keyword: 'Large Language Models (LLM)', importance: 'High', suggestion: 'Mention your hands-on experience or coursework with generative models.' },
      { keyword: 'Embeddings & Semantic Search', importance: 'High', suggestion: 'Highlight vector representations or cosine similarity experience.' },
      { keyword: 'Fine-Tuning & Evaluation', importance: 'High', suggestion: 'Specify any benchmark evaluations (e.g. BLEU, ROUGE, F1).' },
    ],
    experienceRelevance: {
      yearsRequired: '3+ years specialized ML',
      yearsDetected: '1.2 years applied Python',
      levelAssessment: 'Significant skill transition needed. Resume currently emphasizes software engineering rather than deep ML modeling.',
      breakdown: [
        { area: 'Deep Learning & NLP', score: 45, comment: 'Resume lacks transformer architecture or fine-tuning specifics.' },
        { area: 'API Serving & Deployment', score: 76, comment: 'FastAPI serving experience is an asset for ML engineering pipelines.' },
        { area: 'Data Pipelines', score: 60, comment: 'Basic Pandas usage noted; scale of data processing is not yet clear.' },
      ],
    },
    recommendations: [
      {
        impact: 'High Impact',
        title: 'Showcase hands-on NLP projects',
        description: 'Add dedicated projects featuring PyTorch, Hugging Face transformer models, or fine-tuned LLMs with clear metrics (e.g., accuracy, latency reduction, F1 score).',
      },
      {
        impact: 'High Impact',
        title: 'Include vector search / RAG pipelines',
        description: 'Detail any document embedding workflows built using ChromaDB, FAISS, or Pinecone.',
      },
      {
        impact: 'Medium Impact',
        title: 'Bridge software engineering with MLOps',
        description: 'Position your strong software engineering background as an advantage for productionizing and deploying models reliably.',
      },
    ],
    improvedBulletPoints: [
      {
        original: 'Wrote Python scripts for data processing and tested some machine learning models.',
        improved: 'Developed end-to-end Python NLP pipeline leveraging Hugging Face Transformers and Scikit-learn, processing 50k+ raw text documents with an F1 score of 0.89.',
        rationale: 'Replaces generic scripts with specific libraries, data volume, and verified quantitative evaluation metrics.',
      },
    ],
    atsChecks: [
      { item: 'File format & encoding', status: 'Passed', message: 'PDF text layer is clean and readable.' },
      { item: 'Contact information', status: 'Passed', message: 'Contact details accurately parsed.' },
      { item: 'Standard section headings', status: 'Passed', message: 'Standard headings found.' },
      { item: 'Tables & multi-column layouts', status: 'Passed', message: 'Single column layout parsed without structural issues.' },
      { item: 'Font compatibility', status: 'Passed', message: 'Standard Helvetica font used.' },
      { item: 'Chronological timeline order', status: 'Passed', message: 'Chronological order validated.' },
    ],
  },
  {
    id: 'analysis-04',
    roleTitle: 'DevOps & Cloud Systems Engineer',
    company: 'Vercel / Edge Infrastructure',
    createdAt: '2026-09-28T11:20:00.000Z',
    fileName: 'Alex_Morgan_DevOps_Resume.pdf',
    fileSize: 112000,
    fileType: 'application/pdf',
    overallScore: 91,
    scoreLabel: 'Exceptional Match',
    subScores: {
      technicalSkills: 94,
      experienceRelevance: 89,
      atsFormatting: 95,
      keywordDensity: 86,
    },
    skillMatchSummary: {
      totalIdentified: 17,
      matchedCount: 16,
      missingCount: 1,
      percentage: 94,
    },
    matchedSkills: [
      { name: 'Docker', category: 'Containers', level: 'Expert', confidence: 98 },
      { name: 'Kubernetes', category: 'Containers', level: 'Proficient', confidence: 92 },
      { name: 'Terraform', category: 'IaC', level: 'Proficient', confidence: 90 },
      { name: 'AWS (ECS, S3, IAM)', category: 'Cloud', level: 'Expert', confidence: 95 },
      { name: 'GitHub Actions CI/CD', category: 'Automation', level: 'Expert', confidence: 96 },
      { name: 'Linux / Bash Scripting', category: 'Systems', level: 'Expert', confidence: 96 },
      { name: 'Prometheus & Grafana', category: 'Observability', level: 'Proficient', confidence: 88 },
    ],
    missingSkills: [
      { 
        name: 'Rust / Go for Systems Tooling', 
        category: 'Systems Programming', 
        priority: 'Low', 
        context: 'Preferred for low-overhead edge daemon development.' 
      },
    ],
    keywordsFound: [
      { keyword: 'Infrastructure as Code', count: 5, relevance: 'High' },
      { keyword: 'Zero-Downtime Deployments', count: 3, relevance: 'High' },
      { keyword: 'Multi-Region High Availability', count: 2, relevance: 'High' },
      { keyword: 'Observability & Alerting', count: 4, relevance: 'High' },
    ],
    keywordsMissing: [
      { keyword: 'eBPF Profiling', importance: 'Low', suggestion: 'Mention if you have used kernel tracing for networking diagnostics.' },
    ],
    experienceRelevance: {
      yearsRequired: '4+ years',
      yearsDetected: '5 years',
      levelAssessment: 'Outstanding match across cloud orchestration, security policies, and automated pipelines.',
      breakdown: [
        { area: 'Cloud & Container Orchestration', score: 96, comment: 'Comprehensive production Kubernetes and AWS track record.' },
        { area: 'CI/CD & Developer Experience', score: 92, comment: 'High-velocity deployment automation with strict compliance checks.' },
        { area: 'Incident Response & Reliability', score: 86, comment: 'Demonstrated 99.98% uptime SLA adherence.' },
      ],
    },
    recommendations: [
      {
        impact: 'Medium Impact',
        title: 'Mention Go or Rust utility tooling',
        description: 'Vercel heavily utilizes Go and Rust for edge routing. If you have written internal CLI tools in either language, add a brief mention.',
      },
      {
        impact: 'Quick Win',
        title: 'Specify cost reduction achievements',
        description: 'State exact monthly AWS cost reductions achieved through rightsizing and automated resource cleanup.',
      },
    ],
    improvedBulletPoints: [
      {
        original: 'Maintained AWS infrastructure and created CI/CD pipelines in GitHub Actions.',
        improved: 'Provisioned immutable multi-region AWS infrastructure via Terraform and automated 45+ daily zero-downtime production deployments with GitHub Actions, cutting release cycle time from 40m to 6m.',
        rationale: 'Shows Infrastructure as Code proficiency, high deployment frequency, and direct 85% reduction in release duration.',
      },
    ],
    atsChecks: [
      { item: 'File format & encoding', status: 'Passed', message: 'PDF format parsed cleanly.' },
      { item: 'Contact information', status: 'Passed', message: 'Clean header with verified contacts.' },
      { item: 'Standard section headings', status: 'Passed', message: 'Clear ATS headings.' },
      { item: 'Tables & multi-column layouts', status: 'Passed', message: 'Clean layout structure.' },
      { item: 'Font compatibility', status: 'Passed', message: 'Standard Inter / Roboto fonts.' },
      { item: 'Chronological timeline order', status: 'Passed', message: 'Standard reverse timeline.' },
    ],
  },
];
