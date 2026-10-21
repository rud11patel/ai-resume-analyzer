import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  UploadCloud, 
  History, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  Trash2, 
  Sparkles, 
  FileText, 
  ExternalLink,
  Layers,
  Award,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { useMockAuth } from '../hooks/useMockAuth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { formatDate, formatRelativeDate, getScoreTheme, formatBytes } from '../utils/formatters';

export function DashboardPage() {
  const { analyses, stats, removeAnalysis, resetHistory, loading } = useAnalysisHistory();
  const { user } = useMockAuth();
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

  const statCards = [
    {
      label: 'Analyses Evaluated',
      value: stats.totalCount,
      subtext: 'Saved in local history',
      icon: FileText,
      color: 'indigo',
    },
    {
      label: 'Average Match Score',
      value: stats.totalCount > 0 ? `${stats.averageScore}%` : '0%',
      subtext: stats.totalCount > 0 ? (stats.averageScore >= 75 ? 'Above target benchmark' : 'Moderate alignment') : 'No records yet',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Top Compatibility Tier',
      value: stats.highMatchCount,
      subtext: 'Scored 80% or higher',
      icon: Award,
      color: 'amber',
    },
    {
      label: 'Primary Target Role',
      value: stats.topRole || 'Software Engineer',
      subtext: 'Most frequent evaluation',
      icon: Layers,
      color: 'blue',
      isText: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Candidate Overview Dashboard
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {user?.isBackendAuthenticated ? 'Active Workspace' : 'Workspace'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Welcome back, <strong className="text-slate-200">{user?.name || 'Candidate'}</strong>. Track your compatibility scores across target job postings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/analyze">
            <Button variant="primary" icon={UploadCloud}>
              New Resume Match
            </Button>
          </Link>
          <Link to="/history">
            <Button variant="secondary" icon={History}>
              Full History
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        {statCards.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all duration-150"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {st.label}
                </span>
                <span className="p-2 rounded-xl bg-slate-800 text-indigo-400">
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className={`font-mono font-extrabold text-white tracking-tight ${st.isText ? 'text-lg truncate' : 'text-3xl'}`}>
                {st.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">{st.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Evaluations Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Recent Job Match Evaluations
              <span className="text-xs font-mono font-normal text-slate-400">
                ({analyses.length} total)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any report to view missing skills, keyword gaps, and tailored recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={() => window.location.reload()}
              title="Refresh recent evaluations"
            >
              Refresh
            </Button>
          </div>
        </div>

        {analyses.length === 0 ? (
          <EmptyState
            title="No resume evaluations yet"
            description="Upload your resume and paste a job description to generate your first match report."
            actionLabel="Run First Analysis"
            actionIcon={UploadCloud}
            onAction={() => navigate('/analyze')}
          />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 sm:px-6">Role & Company</th>
                    <th className="py-3.5 px-4">Compatibility Score</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Resume Document</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {analyses.slice(0, 5).map((item) => {
                    const theme = getScoreTheme(item.overallScore);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-850/50 transition-colors group"
                      >
                        {/* Role & Company */}
                        <td className="py-4 px-4 sm:px-6">
                          <Link
                            to={`/results/${item.id}`}
                            className="font-semibold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5 group-hover:translate-x-0.5"
                          >
                            <span>{item.roleTitle}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.company}</p>
                        </td>

                        {/* Overall Score */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${theme.badgeClass}`}
                            >
                              {item.overallScore}%
                            </span>
                            <span className="text-[11px] text-slate-400 hidden lg:inline">
                              {item.scoreLabel}
                            </span>
                          </div>
                        </td>

                        {/* Resume File */}
                        <td className="py-4 px-4 hidden md:table-cell">
                          <span className="text-slate-300 truncate max-w-[180px] block font-mono text-[11px]">
                            {item.fileName}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {formatBytes(item.fileSize)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 hidden sm:table-cell text-slate-400 text-[11px]">
                          {formatRelativeDate(item.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right space-x-2">
                          <Link to={`/results/${item.id}`}>
                            <Button variant="secondary" size="sm">
                              View Report
                            </Button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this record"
                            aria-label={`Delete record for ${item.roleTitle}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {analyses.length > 5 && (
              <div className="p-3.5 bg-slate-950/40 border-t border-slate-800 text-center">
                <Link
                  to="/history"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                >
                  View all {analyses.length} saved evaluations in History <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Analysis Record?"
        description="Are you sure you want to remove this evaluation report from your local history? This action cannot be undone."
        confirmText="Yes, Delete Record"
        confirmVariant="danger"
        isConfirmLoading={isDeleting}
        onConfirm={confirmDelete}
      >
        {deleteTarget && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <p className="font-semibold text-white">{deleteTarget.roleTitle}</p>
            <p className="text-slate-400">{deleteTarget.company}</p>
            <p className="text-slate-500 font-mono text-[11px]">File: {deleteTarget.fileName}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
