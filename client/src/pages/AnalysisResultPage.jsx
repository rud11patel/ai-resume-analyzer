import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  Building, 
  Calendar, 
  Copy, 
  Check, 
  ShieldCheck, 
  Briefcase, 
  TrendingUp, 
  ChevronRight
} from 'lucide-react';
import { fetchAnalysisById } from '../services/mockAnalysisService';
import { CompatibilityGauge } from '../components/analysis/CompatibilityGauge';
import { SkillMatchList } from '../components/analysis/SkillMatchList';
import { KeywordCloud } from '../components/analysis/KeywordCloud';
import { RecommendationsList } from '../components/analysis/RecommendationsList';
import { LlmAdvisorFeedback } from '../components/analysis/LlmAdvisorFeedback';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useMockAuth } from '../hooks/useMockAuth';
import { formatDate, formatBytes, getScoreTheme } from '../utils/formatters';

export function AnalysisResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useMockAuth();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedBulletIndex, setCopiedBulletIndex] = useState(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const userKey = user?.id || user?.email;
        const data = await fetchAnalysisById(id, userKey);
        setAnalysis(data);
      } catch (err) {
        console.error('Error fetching analysis report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id, user]);

  const handleCopyBullet = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIndex(index);
    setTimeout(() => setCopiedBulletIndex(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" className="text-zinc-200" />
        <p className="text-xs text-zinc-400">Loading analysis report...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="Analysis Report Not Found"
          description={`No evaluation was found for record identifier "${id}". It may have been removed.`}
          actionLabel="View Analysis History"
          onAction={() => navigate('/history')}
        />
      </div>
    );
  }

  const theme = getScoreTheme(analysis.overallScore);
  const displayTitle = analysis.roleTitle && analysis.roleTitle !== 'Untitled Role'
    ? analysis.roleTitle
    : 'Job Description Alignment Audit';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Report Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1E222D]">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link to="/dashboard" className="hover:text-zinc-200 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <Link to="/history" className="hover:text-zinc-200 transition-colors">
              History
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-300">Report</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            {displayTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-2">
            {analysis.company && (
              <>
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <Building className="w-3.5 h-3.5 text-zinc-400" />
                  {analysis.company}
                </span>
                <span>&bull;</span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              {analysis.fileName} ({formatBytes(analysis.fileSize)})
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              {formatDate(analysis.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Export
          </Button>
          <Link to="/analyze">
            <Button variant="primary" size="sm" icon={UploadCloud}>
              New Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Overall Compatibility Gauge */}
      <section aria-label="Overall Compatibility Score">
        <CompatibilityGauge
          score={analysis.overallScore}
          subScores={analysis.subScores}
          label={analysis.scoreLabel}
        />
      </section>

      {/* Deterministic Scoring Formula & Weighted Components */}
      {analysis.scoreBreakdown && analysis.scoreBreakdown.components && analysis.scoreBreakdown.components.length > 0 && (
        <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#232734]">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-400" />
                Scoring Formula & Weight Distribution
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Transparent multi-factor calculation based on deterministic NLP alignment.
              </p>
            </div>
            {analysis.scoreBreakdown.calculationFormula && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0D0F14] text-zinc-300 border border-[#232734] w-fit">
                Formula: {analysis.scoreBreakdown.calculationFormula}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {analysis.scoreBreakdown.components.map((comp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#0D0F14] border border-[#232734] text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">{comp.name}</span>
                  <span className="font-mono text-zinc-300 font-bold">
                    {Math.round(comp.weight * 100)}% weight
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Raw: <strong className="text-zinc-200 font-mono">{comp.rawScore}/100</strong></span>
                  <span>Contribution: <strong className="text-emerald-400 font-mono">+{comp.weightedScore} pts</strong></span>
                </div>
                <p className="text-[11px] text-zinc-400 pt-1 border-t border-[#1C1F2B] leading-relaxed">
                  {comp.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Recruiter Critique & LLM Career Advisor */}
      <LlmAdvisorFeedback llmFeedback={analysis.llmFeedback} />

      {/* 2. Skills Match Breakdown */}
      <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm">
        <SkillMatchList
          matchedSkills={analysis.matchedSkills}
          partiallyMatchedSkills={analysis.partiallyMatchedSkills}
          missingSkills={analysis.missingSkills}
          uncertainSkills={analysis.uncertainSkills}
          summary={analysis.skillMatchSummary}
        />
      </section>

      {/* 3. Keywords Cloud Detected vs Missing */}
      <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
            ATS Keyword Coverage Analysis
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Applicant Tracking Systems match resume text against high-priority phrases from the job description.
          </p>
        </div>
        <KeywordCloud
          keywordsFound={analysis.keywordsFound}
          keywordsMissing={analysis.keywordsMissing}
        />
      </section>

      {/* 4. Experience Relevance Assessment */}
      {analysis.experienceRelevance && (
        <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#232734]">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                Experience & Seniority Fit
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evaluation of career tenure and depth versus job posting requirements.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                {analysis.experienceRelevance.yearsDetected} detected / {analysis.experienceRelevance.yearsRequired} req
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed bg-[#0D0F14] p-3.5 rounded-xl border border-[#232734]">
            {analysis.experienceRelevance.levelAssessment}
          </p>

          <div className="space-y-3 pt-1">
            {analysis.experienceRelevance.breakdown?.map((area, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#0D0F14] border border-[#232734] text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-200">{area.area}</span>
                  <span className="font-mono text-zinc-300 font-semibold">{area.score}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#1E222D] overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-zinc-300 transition-all duration-500"
                    style={{ width: `${area.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">{area.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Actionable Recommendations */}
      <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm">
        <RecommendationsList recommendations={analysis.recommendations} />
      </section>

      {/* 6. Example Improved Bullet Points (Before vs After) */}
      {analysis.improvedBulletPoints && analysis.improvedBulletPoints.length > 0 && (
        <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#232734]">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
                Bullet Point Enhancements
              </h3>
              <p className="text-xs text-zinc-400">
                Measurable metric additions and action verb optimizations based on the job requirements.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {analysis.improvedBulletPoints.map((bp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#0D0F14] border border-[#232734] space-y-3 text-xs"
              >
                {/* Original */}
                <div>
                  <span className="text-[10px] font-mono uppercase font-semibold text-zinc-500 tracking-wider">
                    Original phrasing:
                  </span>
                  <p className="text-zinc-400 italic mt-1 pl-3 border-l-2 border-zinc-700">
                    "{bp.original}"
                  </p>
                </div>

                {/* Improved */}
                <div className="bg-[#14181F] border border-[#262A37] p-3.5 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase font-semibold text-emerald-400 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Recommended High-Impact Phrasing:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBullet(bp.improved, idx)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors text-[11px] font-medium cursor-pointer"
                      title="Copy improved bullet to clipboard"
                    >
                      {copiedBulletIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-zinc-100 font-medium leading-relaxed">
                    "{bp.improved}"
                  </p>
                </div>

                {/* Rationale */}
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-300">Why this improves match:</strong> {bp.rationale}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. ATS Readability & Formatting Checks */}
      {analysis.atsChecks && (
        <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#232734]">
            <ShieldCheck className="w-5 h-5 text-zinc-300" />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
                ATS Document Compatibility & Formatting Audit
              </h3>
              <p className="text-xs text-zinc-400">
                Structural factors audited to verify clean extraction across enterprise applicant tracking systems.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {analysis.atsChecks.map((check, idx) => {
              const isPassed = check.status === 'Passed';
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#0D0F14] border border-[#232734] flex items-start gap-3 text-xs"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-zinc-200 truncate">{check.item}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-medium ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {check.status}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                      {check.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#111318] border border-[#232734]">
        <Link to="/history" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Return to saved evaluations
        </Link>
        <Link to="/analyze">
          <Button variant="primary" size="md" icon={UploadCloud}>
            Run Another Resume Match
          </Button>
        </Link>
      </div>
    </div>
  );
}
