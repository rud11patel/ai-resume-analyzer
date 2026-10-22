import { INITIAL_MOCK_ANALYSES } from '../data/mockAnalyses';
import { analysesApi } from './api';

const STORAGE_KEY = 'ai_resume_analyzer_mock_history_v1';

/**
 * Helper to get all stored analyses or seed initial mock records
 */
export function getStoredAnalyses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ANALYSES));
      return INITIAL_MOCK_ANALYSES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ANALYSES));
      return INITIAL_MOCK_ANALYSES;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to read localStorage, falling back to initial mock analyses:', err);
    return INITIAL_MOCK_ANALYSES;
  }
}

/**
 * Save analyses array to localStorage
 */
function saveAnalyses(analyses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch (err) {
    console.warn('Failed to save analyses to localStorage:', err);
  }
}

/**
 * Fetch all analyses
 */
export async function fetchAnalyses() {
  // Simulate slight asynchronous behavior
  await new Promise((res) => setTimeout(res, 120));
  return getStoredAnalyses();
}

/**
 * Fetch single analysis by ID
 * @param {string} id 
 */
export async function fetchAnalysisById(id) {
  // If MongoDB ObjectId, fetch directly from backend API
  if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      const backendData = await analysesApi.getById(id);
      if (backendData) {
        const structured = backendData.structuredOutput || {};
        return {
          id: backendData._id,
          roleTitle: backendData.jobDescriptionId?.roleTitle || structured.jobRequirements?.roleTitle || 'Target Role',
          company: backendData.jobDescriptionId?.company || structured.jobRequirements?.company || 'Target Company',
          createdAt: backendData.createdAt,
          fileName: backendData.resumeId?.originalName || 'Resume.pdf',
          fileSize: backendData.resumeId?.fileSize || 50000,
          fileType: backendData.resumeId?.fileType || 'application/pdf',
          overallScore: backendData.overallScore ?? structured.overallScore ?? 80,
          scoreLabel: backendData.scoreLabel || structured.scoreLabel || 'Evaluation',
          subScores: structured.subScores || {
            technicalSkills: 80,
            experienceRelevance: 75,
            atsFormatting: 85,
            keywordDensity: 70,
          },
          skillMatchSummary: structured.skillMatchSummary || {
            totalIdentified: (structured.matchedSkills?.length || 0) + (structured.missingSkills?.length || 0),
            matchedCount: structured.matchedSkills?.length || 0,
            missingCount: structured.missingSkills?.length || 0,
            percentage: 80,
          },
          matchedSkills: structured.matchedSkills || [],
          missingSkills: structured.missingSkills || [],
          partiallyMatchedSkills: structured.partiallyMatchedSkills || [],
          uncertainSkills: structured.uncertainSkills || [],
          keywordsFound: structured.keywordsFound || [],
          keywordsMissing: structured.keywordsMissing || [],
          experienceRelevance: structured.experienceRelevance || {
            yearsRequired: structured.jobRequirements?.experienceYearsRequired || 'Not specified',
            yearsDetected: 'Detected',
            levelAssessment: 'Evaluated against job posting.',
            breakdown: [],
          },
          recommendations: structured.recommendations || [],
          improvedBulletPoints: structured.improvedBulletPoints || [],
          atsChecks: structured.atsChecks || [],
          scoreBreakdown: backendData.scoreBreakdown || structured.scoreBreakdown || null,
          llmFeedback: backendData.llmFeedback || structured.llmFeedback || null,
          isDemoData: backendData.isDemoData ?? false,
        };
      }
    } catch (err) {
      console.warn('[mockAnalysisService] Backend analysis fetch failed, falling back to local store:', err.message);
    }
  }

  await new Promise((res) => setTimeout(res, 120));
  const list = getStoredAnalyses();
  const found = list.find((item) => item.id === id);
  return found || null;
}

/**
 * Delete an analysis record
 * @param {string} id 
 */
export async function deleteAnalysisById(id) {
  await new Promise((res) => setTimeout(res, 150));
  const current = getStoredAnalyses();
  const filtered = current.filter((item) => item.id !== id);
  saveAnalyses(filtered);
  return true;
}

/**
 * Reset history back to default sample records
 */
export function resetAnalysesToDefault() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ANALYSES));
  return INITIAL_MOCK_ANALYSES;
}

/**
 * Generates a realistic mock analysis based on the uploaded file and job description text.
 * NOTE: This is client-side mock evaluation for Phase 2 UI development.
 * Real ML text extraction & LLM inference will be connected in Phase 4.
 */
export async function simulateAnalyzeResume({ file, roleTitle, company, jobDescription }) {
  // Simulate analysis pipeline delay: 1800ms
  await new Promise((res) => setTimeout(res, 1800));

  const textLower = (jobDescription || '').toLowerCase();
  const effectiveRole = roleTitle?.trim() || detectRoleTitle(jobDescription) || 'Software Engineer';
  const effectiveCompany = company?.trim() || 'Target Enterprise';

  // Keyword detection heuristics for realistic mock breakdown
  const hasFrontend = /react|vue|angular|frontend|css|html|tailwind|javascript|typescript/.test(textLower);
  const hasBackend = /node|express|python|django|fastapi|java|spring|golang|database|sql|mongodb/.test(textLower);
  const hasDevops = /docker|kubernetes|aws|ci\/cd|pipeline|terraform|cloud|devops/.test(textLower);
  const hasTesting = /test|testing|jest|cypress|playwright|qa|unit test/.test(textLower);

  // Deterministic score based on string length and keyword density
  let baseScore = 74;
  if (hasFrontend) baseScore += 5;
  if (hasBackend) baseScore += 4;
  if (hasDevops) baseScore += 3;
  if (hasTesting) baseScore += 2;
  const scoreLengthFactor = (jobDescription.length % 11) - 5;
  const finalScore = Math.min(94, Math.max(58, baseScore + scoreLengthFactor));

  let scoreLabel = 'Moderate Match';
  if (finalScore >= 85) scoreLabel = 'Exceptional Match';
  else if (finalScore >= 80) scoreLabel = 'Strong Match';
  else if (finalScore >= 68) scoreLabel = 'Good Match';
  else if (finalScore < 60) scoreLabel = 'Needs Work';

  const newId = `analysis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const newAnalysis = {
    id: newId,
    roleTitle: effectiveRole,
    company: effectiveCompany,
    createdAt: new Date().toISOString(),
    fileName: file?.name || 'Candidate_Resume.pdf',
    fileSize: file?.size || 128400,
    fileType: file?.type || 'application/pdf',
    overallScore: finalScore,
    scoreLabel,
    subScores: {
      technicalSkills: Math.min(98, Math.max(50, finalScore + 4)),
      experienceRelevance: Math.min(96, Math.max(52, finalScore - 3)),
      atsFormatting: 90,
      keywordDensity: Math.min(92, Math.max(48, finalScore - 8)),
    },
    skillMatchSummary: {
      totalIdentified: 15,
      matchedCount: Math.round(15 * (finalScore / 100)),
      missingCount: 15 - Math.round(15 * (finalScore / 100)),
      percentage: Math.round((Math.round(15 * (finalScore / 100)) / 15) * 100),
    },
    matchedSkills: [
      { name: 'JavaScript / ES6+', category: 'Languages', level: 'Expert', confidence: 94 },
      { name: hasFrontend ? 'React' : 'Python', category: 'Core Stack', level: 'Proficient', confidence: 91 },
      { name: 'Git & Version Control', category: 'DevOps', level: 'Proficient', confidence: 89 },
      { name: 'RESTful API Integration', category: 'Architecture', level: 'Proficient', confidence: 86 },
      { name: 'Responsive Web Design', category: 'UI/UX', level: 'Proficient', confidence: 85 },
      { name: 'Problem Solving & Debugging', category: 'Engineering', level: 'Advanced', confidence: 88 },
    ],
    missingSkills: [
      {
        name: hasDevops ? 'Kubernetes Helm Charts' : 'CI/CD Automation (GitHub Actions)',
        category: 'DevOps',
        priority: 'High',
        context: 'Explicitly referenced in job posting workflow infrastructure specifications.',
      },
      {
        name: hasBackend ? 'Redis Caching & Session Storage' : 'TypeScript Generics & Utility Types',
        category: 'Architecture',
        priority: 'Medium',
        context: 'Required for resilient production data access patterns.',
      },
      {
        name: 'End-to-End Test Automation (Playwright/Cypress)',
        category: 'Quality Assurance',
        priority: 'Medium',
        context: 'Identified as a core qualification for verifying user journeys before deployment.',
      },
    ],
    keywordsFound: [
      { keyword: 'Web Application', count: 4, relevance: 'High' },
      { keyword: 'Agile / Scrum', count: 3, relevance: 'Medium' },
      { keyword: 'API Integration', count: 3, relevance: 'High' },
      { keyword: 'Code Review', count: 2, relevance: 'Medium' },
    ],
    keywordsMissing: [
      {
        keyword: 'Automated CI/CD',
        importance: 'High',
        suggestion: 'If you have maintained deployment scripts or GitHub Actions, detail them in your project bullets.',
      },
      {
        keyword: 'System Scalability',
        importance: 'Medium',
        suggestion: 'Add context on traffic volume or concurrent users your projects handled.',
      },
      {
        keyword: 'Performance Profiling',
        importance: 'Medium',
        suggestion: 'Detail specific tools used for tracking bottlenecks (e.g., Lighthouse, Chrome DevTools).',
      },
    ],
    experienceRelevance: {
      yearsRequired: '3-5+ years',
      yearsDetected: '4 years',
      levelAssessment: `Candidate profile displays good alignment with ${effectiveRole} core responsibilities.`,
      breakdown: [
        { area: 'Core Technical Execution', score: finalScore + 2, comment: 'Strong match on primary technologies and system implementation.' },
        { area: 'System Architecture & Scope', score: finalScore - 4, comment: 'Sufficient depth shown; could expand on multi-tier service integration.' },
        { area: 'Testing & Operational Reliability', score: finalScore - 8, comment: 'Highlight test automation and production monitoring experience.' },
      ],
    },
    recommendations: [
      {
        impact: 'High Impact',
        title: 'Include specific performance metrics in work history',
        description: 'Quantify your engineering accomplishments using the STAR framework (Situation, Task, Action, Result) with tangible percentage gains or latency reductions.',
      },
      {
        impact: 'Medium Impact',
        title: 'Align technical terminology with the job description',
        description: 'Ensure skills like testing frameworks, container tools, and build orchestrators use standard naming conventions recognized by ATS parsers.',
      },
      {
        impact: 'Quick Win',
        title: 'Refine professional summary statement',
        description: `Tailor your 2-3 line resume summary at the top to target ${effectiveRole} positions specifically.`,
      },
    ],
    improvedBulletPoints: [
      {
        original: 'Responsible for writing code and maintaining application features according to requirements.',
        improved: `Engineered 18+ high-priority features for ${effectiveRole} scope, boosting release velocity by 34% while maintaining 99.9% uptime across production releases.`,
        rationale: 'Replaces passive "responsible for" phrasing with active impact verbs, measurable throughput, and operational stability.',
      },
      {
        original: 'Collaborated with team members to resolve bugs and improve application speed.',
        improved: 'Spearheaded cross-functional code optimization sprints, resolving 40+ performance bottlenecks and lowering average page load time by 450ms.',
        rationale: 'Specifies leadership initiatives, concrete issue counts, and measurable millisecond response time improvements.',
      },
    ],
    atsChecks: [
      { item: 'File format & encoding', status: 'Passed', message: 'Clean text structure parsed without encoding artifacts.' },
      { item: 'Contact information', status: 'Passed', message: 'Candidate contact details detected in readable header.' },
      { item: 'Standard section headings', status: 'Passed', message: 'Clear Experience, Education, and Skills headings present.' },
      { item: 'Tables & multi-column layouts', status: 'Passed', message: 'Single stream layout passes parsing checks.' },
      { item: 'Font compatibility', status: 'Passed', message: 'Standard standard font family detected.' },
      { item: 'Chronological timeline order', status: 'Passed', message: 'Reverse chronological sequence maintained.' },
    ],
    isMock: true,
  };

  // Add to stored history
  const current = getStoredAnalyses();
  const updated = [newAnalysis, ...current];
  saveAnalyses(updated);

  return newAnalysis;
}

/**
 * Simple heuristic to guess role title from text
 */
function detectRoleTitle(text) {
  if (!text) return null;
  const firstLine = text.trim().split('\n')[0];
  if (firstLine && firstLine.length < 60 && /engineer|developer|designer|manager|architect|scientist/i.test(firstLine)) {
    return firstLine.replace(/^(we are looking for a|hiring:|job title:)/i, '').trim();
  }
  return null;
}
