import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Cpu, 
  Activity, 
  Clock, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export function HealthStatusCard({ health, loading, lastChecked, onRefresh }) {
  const [showRawJson, setShowRawJson] = useState(false);

  const isBackendReachable = health?.success;
  const isDbConnected = health?.data?.services?.database?.connected;
  const isDegraded = isBackendReachable && !isDbConnected;

  return (
    <div id="card-health-status" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">System Health Monitor</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time verification of frontend, backend services, and database connectivity.
          </p>
        </div>

        <button
          id="btn-refresh-health"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {/* Target URL Info */}
      <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span>Target API Base URL:</span>
        <code className="text-indigo-300 font-mono bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
          {API_BASE_URL}
        </code>
      </div>

      {/* Grid of Microservices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Frontend Status */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Frontend Client</span>
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Operational
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-base font-semibold text-white">React 19 + Vite</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Client runtime active on Port 5173</p>
          </div>
        </div>

        {/* Backend API Status */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Backend API</span>
            {isBackendReachable ? (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Unreachable
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Server className={`w-5 h-5 ${isBackendReachable ? 'text-indigo-400' : 'text-rose-400'}`} />
              <span className="text-base font-semibold text-white">
                {isBackendReachable ? 'Express Service' : 'API Offline'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Latency:</span>
              <span className="font-mono text-indigo-300 font-medium">
                {health?.latencyMs !== undefined ? `${health.latencyMs}ms` : '--'}
              </span>
              {health?.data?.uptime !== undefined && (
                <span className="text-slate-500">
                  (Up {health.data.uptime}s)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MongoDB Database Status */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">MongoDB Database</span>
            {isDbConnected ? (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Connected
              </span>
            ) : isDegraded ? (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Disconnected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                Unknown
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Database className={`w-5 h-5 ${isDbConnected ? 'text-emerald-400' : isDegraded ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-base font-semibold text-white">
                {isDbConnected ? 'Mongoose Active' : isDegraded ? 'Database Disconnected' : 'Pending API Check'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isDbConnected 
                ? (health.data.services.database.databaseName ? `Database: ${health.data.services.database.databaseName}` : 'Cluster connected')
                : isDegraded 
                ? 'Check local MongoDB or Atlas URI' 
                : 'Waiting for server response'}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Health Alert Box */}
      {isDegraded && (
        <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <p className="font-semibold text-amber-300">Degraded State Detected</p>
            <p className="mt-0.5 text-amber-300/80">
              The Express backend is running, but Mongoose is not connected to MongoDB. Ensure your local MongoDB service is running (e.g. <code className="bg-amber-900/40 px-1 py-0.5 rounded">mongod</code>) or update <code className="bg-amber-900/40 px-1 py-0.5 rounded">MONGODB_URI</code> in <code className="bg-amber-900/40 px-1 py-0.5 rounded">server/.env</code>.
            </p>
          </div>
        </div>
      )}

      {!isBackendReachable && health?.error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200">
            <p className="font-semibold text-rose-300">Cannot Reach Backend API</p>
            <p className="mt-0.5 text-rose-300/80">
              {health.error}. Make sure the Node.js server is started on port 5000 (<code className="bg-rose-900/40 px-1 py-0.5 rounded">npm run dev</code> inside <code className="bg-rose-900/40 px-1 py-0.5 rounded">server/</code>).
            </p>
          </div>
        </div>
      )}

      {/* Footer Info & Raw Response Toggle */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last tested: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}</span>
        </div>

        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <span>{showRawJson ? 'Hide Raw API JSON' : 'View Raw API JSON'}</span>
          {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Raw JSON viewer */}
      {showRawJson && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs overflow-x-auto">
          <pre className="text-slate-300 font-mono">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
