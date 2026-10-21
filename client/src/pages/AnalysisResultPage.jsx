import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  Printer, 
  Share2, 
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
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { fetchAnalysisById } from '../services/mockAnalysisService';
import { CompatibilityGauge } from '../components/analysis/CompatibilityGauge';
import { SkillMatchList } from '../components/analysis/SkillMatchList';
import { KeywordCloud } from '../components/analysis/KeywordCloud';
import { RecommendationsList } from '../components/analysis/RecommendationsList';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, formatBytes, getScoreTheme } from '../utils/formatters';

export function AnalysisResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedBulletIndex, setCopiedBulletIndex] = useState(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const data = await fetchAnalysisById(id);
        setAnalysis(data);
      } catch (err) {
        console.error('Error fetching analysis report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

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
        <LoadingSpinner size="lg" className="text-indigo-400" />
        <p className="text-xs text-slate-400">Loading analysis report...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="Analysis Report Not Found"
          description={`No evaluation was found for record identifier "${id}". It may have been deleted or never existed.`}
          actionLabel="View Analysis History"
          onAction={() => navigate('/history')}
        />
      </div>
    );
  }

  const theme = getScoreTheme(analysis.overallScore);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Demo vs Live Analysis Banner */}
      {analysis.isDemoData !== false ? (
        <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              <strong className="text-white font-semibold">Simulated Evaluation:</strong> This report represents
              a realistic client-side demonstration of Phase 2 capabilities. Real backend ML parsing activates in Phase 4.
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-fit">
            Demo Record: {analysis.id}
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong className="text-white font-semibold">Live AI Analysis:</strong> Evaluated using the Phase 4 deterministic semantic similarity & information extraction engine.
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit">
            Live Analysis: {analysis.id}
          </span>
        </div>
      )}

      {/* Report Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link to="/dashboard" className="hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link to="/history" className="hover:text-slate-200 transition-colors">
              History
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-300">Report Details</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {analysis.roleTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Building className="w-4 h-4 text-indigo-400" />
              {analysis.company}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              {analysis.fileName} ({formatBytes(analysis.fileSize)})
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
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
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Deterministic Scoring Formula & Weight Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Transparent multi-factor calculation based on empirical NLP alignment.
              </p>
            </div>
            {analysis.scoreBreakdown.calculationFormula && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-950 text-indigo-300 border border-slate-800 w-fit">
                Formula: {analysis.scoreBreakdown.calculationFormula}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {analysis.scoreBreakdown.components.map((comp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{comp.name}</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {Math.round(comp.weight * 100)}% weight
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Raw score: <strong className="text-white font-mono">{comp.rawScore}/100</strong></span>
                  <span>Contribution: <strong className="text-emerald-400 font-mono">+{comp.weightedScore} pts</strong></span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 leading-relaxed">
                  {comp.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Skills Match Breakdown */}
      <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <SkillMatchList
          matchedSkills={analysis.matchedSkills}
          partiallyMatchedSkills={analysis.partiallyMatchedSkills}
          missingSkills={analysis.missingSkills}
          uncertainSkills={analysis.uncertainSkills}
          summary={analysis.skillMatchSummary}
        />
      </section>

      {/* 3. Keywords Cloud Detected vs Missing */}
      <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            ATS Keyword Coverage Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Applicant Tracking Systems match resume text against high-priority phrases from the job listing.
          </p>
        </div>
        <KeywordCloud
          keywordsFound={analysis.keywordsFound}
          keywordsMissing={analysis.keywordsMissing}
        />
      </section>

      {/* 4. Experience Relevance Assessment */}
      {analysis.experienceRelevance && (
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Experience & Seniority Fit
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluation of career tenure and depth versus job posting expectations.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                {analysis.experienceRelevance.yearsDetected} detected / {analysis.experienceRelevance.yearsRequired} req
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            {analysis.experienceRelevance.levelAssessment}
          </p>

          <div className="space-y-3 pt-2">
            {analysis.experienceRelevance.breakdown?.map((area, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-white">{area.area}</span>
                  <span className="font-mono text-indigo-300 font-bold">{area.score}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${area.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">{area.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Actionable Recommendations */}
      <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <RecommendationsList recommendations={analysis.recommendations} />
      </section>

      {/* 6. Example Improved Bullet Points (Before vs After) */}
      {analysis.improvedBulletPoints && analysis.improvedBulletPoints.length > 0 && (
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                AI-Suggested Bullet Point Transformations
              </h3>
              <p className="text-xs text-slate-400">
                Before & after comparisons with measurable metrics and active leadership verbs.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {analysis.improvedBulletPoints.map((bp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 text-xs"
              >
                {/* Original */}
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                    Original phrasing:
                  </span>
                  <p className="text-slate-400 italic mt-1 pl-3 border-l-2 border-slate-700">
                    "{bp.original}"
                  </p>
                </div>

                {/* Improved */}
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Recommended High-Impact Phrasing:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBullet(bp.improved, idx)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-[11px] font-medium cursor-pointer"
                      title="Copy improved bullet to clipboard"
                    >
                      {copiedBulletIndex === idx ? (
                        <>
                          <Check className="w-3 h-3" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-emerald-100 font-medium leading-relaxed">
                    "{bp.improved}"
                  </p>
                </div>

                {/* Rationale */}
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Why this improves score:</strong> {bp.rationale}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. ATS Readability & Formatting Checks */}
      {analysis.atsChecks && (
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                ATS Document Compatibility & Formatting Audit
              </h3>
              <p className="text-xs text-slate-400">
                Structural elements checked to ensure legacy parsers extract your information cleanly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {analysis.atsChecks.map((check, idx) => {
              const isPassed = check.status === 'Passed';
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs"
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
                      <span className="font-semibold text-white truncate">{check.item}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {check.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <Link to="/history" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Return to all saved analyses
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
