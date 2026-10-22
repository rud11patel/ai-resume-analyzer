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
      label: 'Total Evaluations',
      value: stats.totalCount,
      subtext: 'Completed audits',
      icon: FileText,
    },
    {
      label: 'Average Match Score',
      value: stats.totalCount > 0 ? `${stats.averageScore}%` : '0%',
      subtext: stats.totalCount > 0 ? (stats.averageScore >= 75 ? 'Strong alignment baseline' : 'Moderate alignment baseline') : 'No evaluations yet',
      icon: TrendingUp,
    },
    {
      label: 'High Match Tier (≥80%)',
      value: stats.highMatchCount,
      subtext: 'Ready for application',
      icon: Award,
    },
    {
      label: 'Moderate Tier (60-79%)',
      value: analyses.filter(a => a.overallScore >= 60 && a.overallScore < 80).length,
      subtext: 'Targeted skill improvements recommended',
      icon: Layers,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#1E222D]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              Candidate Overview
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              Workspace
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Welcome, <strong className="text-zinc-200">{user?.name || 'User'}</strong>. Monitor alignment rates across your resume evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/analyze">
            <Button variant="primary" icon={UploadCloud} size="sm">
              New Analysis
            </Button>
          </Link>
          <Link to="/history">
            <Button variant="secondary" icon={History} size="sm">
              All Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#111318] border border-[#232734] shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">
                  {stat.value}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {stat.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Evaluations Table */}
      <div className="rounded-2xl bg-[#111318] border border-[#232734] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#232734] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
              Recent Evaluations
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review recent job alignment assessments and compatibility breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/history" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
              <span>View full history</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            Loading evaluations...
          </div>
        ) : analyses.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No evaluations performed yet"
              description="Upload your resume and paste a job description to generate your first match report."
              actionLabel="Start First Analysis"
              onAction={() => navigate('/analyze')}
              actionIcon={UploadCloud}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C0E12] border-b border-[#232734] text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Evaluation</th>
                  <th className="py-3 px-4">Resume Document</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E222D]">
                {analyses.slice(0, 6).map((item) => {
                  const theme = getScoreTheme(item.overallScore);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#16181F] transition-colors cursor-pointer group"
                      onClick={() => navigate(`/results/${item.id}`)}
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-medium text-zinc-100 text-xs sm:text-sm">
                          {item.roleTitle && item.roleTitle !== 'Untitled Role' ? item.roleTitle : 'Job Alignment Evaluation'}
                        </div>
                        {item.company && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {item.company}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="truncate max-w-[160px]">{item.fileName || 'Resume.pdf'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium border ${theme.badgeClass}`}
                        >
                          {item.overallScore}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                        {formatRelativeDate(item.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/results/${item.id}`)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="View report"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Analysis Evaluation?"
        description="Are you sure you want to remove this record? This action cannot be reversed."
        confirmText="Delete Record"
        confirmVariant="danger"
        isConfirmLoading={isDeleting}
        onConfirm={confirmDelete}
      >
        <p className="text-xs text-zinc-400">
          Target record: <strong className="text-zinc-200">{deleteTarget?.roleTitle || deleteTarget?.fileName || 'Analysis Record'}</strong>
        </p>
      </Modal>
    </div>
  );
}
