import { apiRequest } from './api';

/**
 * Service to execute backend health-check verification
 */
export async function getHealthStatus() {
  const startTime = performance.now();
  try {
    const data = await apiRequest('/health');
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      latencyMs,
      data,
      error: null,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      latencyMs,
      data: err.data || null,
      error: err.message || 'Unable to connect to backend API server',
    };
  }
}
