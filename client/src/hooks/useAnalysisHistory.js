import { useState, useEffect, useCallback, useMemo } from 'react';
import { analysesApi } from '../services/api';
import { fetchAnalyses, deleteAnalysisById, resetAnalysesToDefault } from '../services/mockAnalysisService';
import { useMockAuth } from './useMockAuth';

export function useAnalysisHistory() {
  const { isAuthenticated, isBackendAuthenticated, user } = useMockAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScoreTier, setSelectedScoreTier] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'score-desc', 'score-asc'

  const userKey = user?.id || user?.email;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If not authenticated or no user context, clear analyses immediately
    if (!isAuthenticated || !userKey) {
      setAnalyses([]);
      setLoading(false);
      return;
    }

    // 1. Fetch user's real persisted analysis records from the backend API
    try {
      const backendAnalyses = await analysesApi.getAll();
      const mapped = (backendAnalyses || []).map((a) => {
        const structured = a.structuredOutput || {};
        return {
          id: a._id || a.id,
          roleTitle: a.jobDescriptionId?.roleTitle || structured.jobRequirements?.roleTitle || 'Target Role',
          company: a.jobDescriptionId?.company || structured.jobRequirements?.company || 'Target Company',
          fileName: a.resumeId?.originalName || 'Resume.pdf',
          fileSize: a.resumeId?.fileSize || 50000,
          fileType: a.resumeId?.fileType || 'application/pdf',
          overallScore: a.overallScore ?? structured.overallScore ?? 0,
          scoreLabel: a.scoreLabel || structured.scoreLabel || 'Evaluation',
          createdAt: a.createdAt,
          status: a.status || 'completed',
          isDemoData: a.isDemoData ?? false,
          subScores: structured.subScores || null,
        };
      });

      // Strict user isolation: mapped results belong solely to this authenticated user
      setAnalyses(mapped);
      setLoading(false);
      return;
    } catch (err) {
      // If user session is invalid (401/403), keep history empty
      if (err.status === 401 || err.status === 403) {
        setAnalyses([]);
        setLoading(false);
        return;
      }
      console.warn('[useAnalysisHistory] Backend fetch failed, checking user-isolated local store:', err.message);
      setError(err.message);
    }

    // 2. Offline fallback: retrieve ONLY this specific user's scoped local evaluations
    try {
      const data = await fetchAnalyses(userKey);
      setAnalyses(data || []);
    } catch (err) {
      console.error('Failed to load user local analysis history:', err);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const removeAnalysis = useCallback(async (id) => {
    // If it's a 24-char hex MongoDB ID, call backend delete
    if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        await analysesApi.delete(id);
      } catch (err) {
        console.warn('[useAnalysisHistory] Backend delete failed:', err.message);
      }
    } else if (userKey) {
      await deleteAnalysisById(id, userKey);
    }

    setAnalyses((prev) => prev.filter((item) => item.id !== id));
  }, [userKey]);

  const resetHistory = useCallback(() => {
    if (userKey) {
      resetAnalysesToDefault(userKey);
    }
    setAnalyses([]);
  }, [userKey]);

  // Filtered and sorted analyses
  const filteredAnalyses = useMemo(() => {
    return analyses
      .filter((item) => {
        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchRole = item.roleTitle?.toLowerCase().includes(term);
          const matchCompany = item.company?.toLowerCase().includes(term);
          const matchFile = item.fileName?.toLowerCase().includes(term);
          if (!matchRole && !matchCompany && !matchFile) return false;
        }

        // Score tier filter
        if (selectedScoreTier === 'high' && item.overallScore < 80) return false;
        if (selectedScoreTier === 'medium' && (item.overallScore < 60 || item.overallScore >= 80)) return false;
        if (selectedScoreTier === 'low' && item.overallScore >= 60) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.overallScore - a.overallScore;
        if (sortBy === 'score-asc') return a.overallScore - b.overallScore;
        if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [analyses, searchTerm, selectedScoreTier, sortBy]);

  // Summary statistics for dashboard
  const stats = useMemo(() => {
    if (analyses.length === 0) {
      return {
        totalCount: 0,
        averageScore: 0,
        highestScore: 0,
        highMatchCount: 0,
        topRole: 'N/A',
      };
    }

    const totalCount = analyses.length;
    const sumScore = analyses.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
    const averageScore = Math.round(sumScore / totalCount);
    const highestScore = Math.max(...analyses.map((a) => a.overallScore || 0));
    const highMatchCount = analyses.filter((a) => (a.overallScore || 0) >= 80).length;
    const topRole = analyses[0]?.roleTitle || 'Software Engineer';

    return {
      totalCount,
      averageScore,
      highestScore,
      highMatchCount,
      topRole,
    };
  }, [analyses]);

  return {
    analyses,
    filteredAnalyses,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedScoreTier,
    setSelectedScoreTier,
    sortBy,
    setSortBy,
    removeAnalysis,
    resetHistory,
    stats,
    refetch: loadData,
  };
}
