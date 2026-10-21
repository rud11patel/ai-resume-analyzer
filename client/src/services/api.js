/**
 * Base API client configuration & services for Phase 3
 */
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'ai_resume_analyzer_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Failed to persist auth token:', err);
  }
}

/**
 * Standard fetch wrapper with timeout, credentials, and token support
 * @param {string} endpoint - Relative path (e.g., '/auth/login')
 * @param {RequestInit} [options] - Fetch options
 * @param {number} [timeoutMs=15000] - Request timeout in milliseconds
 */
export async function apiRequest(endpoint, options = {}, timeoutMs = 15000) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // Add token header if available
  const token = getStoredToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Do not set Content-Type if body is FormData (browser will set multipart/form-data boundary)
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include HTTP-only cookies
      signal: controller.signal,
    });

    clearTimeout(id);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  }
}

/**
 * Authentication API methods
 */
export const authApi = {
  async register({ name, email, password }) {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.data?.token) setStoredToken(res.data.token);
    return res.data;
  },

  async login({ email, password }) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) setStoredToken(res.data.token);
    return res.data;
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async getMe() {
    const res = await apiRequest('/auth/me');
    return res.data?.user;
  },
};

/**
 * Resume documents API methods
 */
export const resumesApi = {
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiRequest('/resumes', {
      method: 'POST',
      body: formData,
    });
    return res.data?.resume;
  },

  async getAll() {
    const res = await apiRequest('/resumes');
    return res.data?.resumes || [];
  },

  async getById(id) {
    const res = await apiRequest(`/resumes/${id}`);
    return res.data?.resume;
  },

  async delete(id) {
    const res = await apiRequest(`/resumes/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};

/**
 * Job descriptions API methods
 */
export const jobDescriptionsApi = {
  async create({ roleTitle, company, rawText }) {
    const res = await apiRequest('/job-descriptions', {
      method: 'POST',
      body: JSON.stringify({ roleTitle, company, rawText }),
    });
    return res.data?.jobDescription;
  },

  async getAll() {
    const res = await apiRequest('/job-descriptions');
    return res.data?.jobDescriptions || [];
  },

  async getById(id) {
    const res = await apiRequest(`/job-descriptions/${id}`);
    return res.data?.jobDescription;
  },

  async delete(id) {
    const res = await apiRequest(`/job-descriptions/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};

/**
 * Analysis records API methods
 */
export const analysesApi = {
  async getAll() {
    const res = await apiRequest('/analyses');
    return res.data?.analyses || [];
  },

  async getById(id) {
    const res = await apiRequest(`/analyses/${id}`);
    return res.data?.analysis;
  },

  async create({ resumeId, jobDescriptionId, overallScore, scoreLabel }) {
    const res = await apiRequest('/analyses', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jobDescriptionId, overallScore, scoreLabel }),
    });
    return res.data?.analysis;
  },

  async delete(id) {
    const res = await apiRequest(`/analyses/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};
