import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  ArrowUpRight, 
  UploadCloud, 
  Calendar, 
  Building, 
  FileText, 
  RotateCcw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { formatDate, formatRelativeDate, getScoreTheme, formatBytes } from '../utils/formatters';

export function HistoryPage() {
  const {
    analyses,
    filteredAnalyses,
    loading,
    searchTerm,
    setSearchTerm,
    selectedScoreTier,
    setSelectedScoreTier,
    sortBy,
    setSortBy,
    removeAnalysis,
    resetHistory,
  } = useAnalysisHistory();

  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await removeAnalysis(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Analysis History & Reports
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredAnalyses.length} shown
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, search, and review all previous resume evaluations and ATS optimization reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={() => window.location.reload()}
            title="Refresh analysis history"
          >
            Refresh
          </Button>
          <Link to="/analyze">
            <Button variant="primary" size="sm" icon={UploadCloud}>
              New Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role title, company, or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tier Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedScoreTier}
              onChange={(e) => setSelectedScoreTier(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Match Scores</option>
              <option value="high">Strong Match (&ge; 80%)</option>
              <option value="medium">Good / Moderate (60% - 79%)</option>
              <option value="low">Needs Work (&lt; 60%)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="date-desc">Newest Evaluated First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Score First</option>
              <option value="score-asc">Lowest Score First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analyses List View */}
      {analyses.length === 0 ? (
        <EmptyState
          icon={History}
          title="No analysis history"
          description="Your evaluation history is currently empty. Upload a resume and evaluate against a job posting."
          actionLabel="Run First Analysis"
          actionIcon={UploadCloud}
          onAction={() => navigate('/analyze')}
        />
      ) : filteredAnalyses.length === 0 ? (
        <EmptyState
          title="No matching analyses found"
          description={`No evaluations match the search "${searchTerm}" or the selected score filters.`}
          actionLabel="Clear Search Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedScoreTier('all');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredAnalyses.map((item) => {
            const theme = getScoreTheme(item.overallScore);
            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left Information */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${theme.badgeClass}`}
                    >
                      {item.overallScore}%
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {item.scoreLabel}
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatRelativeDate(item.createdAt)}
                    </span>
                  </div>

                  <Link
                    to={`/results/${item.id}`}
                    className="block font-bold text-base text-white hover:text-indigo-400 transition-colors truncate group-hover:translate-x-0.5"
                  >
                    {item.roleTitle}
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      {item.company}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {item.fileName} ({formatBytes(item.fileSize)})
                    </span>
                    {item.skillMatchSummary && (
                      <>
                        <span>&bull;</span>
                        <span className="text-emerald-400">
                          {item.skillMatchSummary.matchedCount} of {item.skillMatchSummary.totalIdentified} skills aligned
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <Link to={`/results/${item.id}`}>
                    <Button variant="secondary" size="sm" icon={ArrowUpRight} iconPosition="right">
                      View Report
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete analysis record"
                    aria-label={`Delete report for ${item.roleTitle}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Analysis Report?"
        description="This will permanently delete this analysis record from your local storage history."
        confirmText="Confirm Delete"
        confirmVariant="danger"
        isConfirmLoading={isDeleting}
        onConfirm={confirmDelete}
      >
        {deleteTarget && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <p className="font-semibold text-white">{deleteTarget.roleTitle}</p>
            <p className="text-slate-400">{deleteTarget.company}</p>
            <p className="text-slate-500 font-mono text-[11px]">{deleteTarget.fileName}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
