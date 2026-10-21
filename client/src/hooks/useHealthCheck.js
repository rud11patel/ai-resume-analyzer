import { useState, useEffect, useCallback } from 'react';
import { getHealthStatus } from '../services/healthService';

/**
 * Custom React hook for polling or manually requesting health status
 */
export function useHealthCheck(autoRefreshInterval = null) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    const result = await getHealthStatus();
    setHealth(result);
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();

    if (autoRefreshInterval && autoRefreshInterval > 0) {
      const timer = setInterval(fetchHealth, autoRefreshInterval);
      return () => clearInterval(timer);
    }
  }, [fetchHealth, autoRefreshInterval]);

  return {
    health,
    loading,
    lastChecked,
    refetch: fetchHealth,
  };
}
