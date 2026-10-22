/**
 * Utility functions for formatting dates, file sizes, and scores
 */

/**
 * Format bytes into human-readable string (KB, MB)
 * @param {number} bytes 
 * @param {number} [decimals=1] 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format ISO date string into readable user-facing format
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Recent';
  }
}

/**
 * Format relative date (e.g., '2 days ago', 'Just now')
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return 'Recently';
  }
}

/**
 * Get color scheme based on match score
 * @param {number} score (0-100)
 */
export function getScoreTheme(score) {
  if (score >= 80) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
      stroke: '#10b981',
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25',
      label: 'Strong Match',
    };
  }
  if (score >= 65) {
    return {
      text: 'text-zinc-200',
      bg: 'bg-zinc-800/80',
      border: 'border-zinc-700',
      stroke: '#E4E4E7',
      badgeClass: 'bg-zinc-800 text-zinc-200 border border-zinc-700',
      label: 'Good Match',
    };
  }
  if (score >= 50) {
    return {
      text: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      stroke: '#f59e0b',
      badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
      label: 'Moderate Match',
    };
  }
  return {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
    stroke: '#f43f5e',
    badgeClass: 'bg-rose-500/10 text-rose-300 border border-rose-500/25',
    label: 'Needs Optimization',
  };
}
