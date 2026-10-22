import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Database, 
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
    <div id="card-health-status" className="bg-[#111318] border border-[#232734] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#232734]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">System Health Monitor</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time status of backend API services, database connection, and pipeline health.
          </p>
        </div>

        <button
          id="btn-refresh-health"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {/* Target URL Info */}
      <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-[#0D0F14] border border-[#232734] flex items-center justify-between text-xs text-zinc-400">
        <span>Target API Base URL:</span>
        <code className="text-zinc-300 font-mono bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700 text-[11px]">
          {API_BASE_URL}
        </code>
      </div>

      {/* Grid of Microservices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* Frontend Status */}
        <div className="bg-[#0D0F14] border border-[#232734] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Frontend Client</span>
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Operational
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-zinc-100">React 19 + Vite</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Client runtime active</p>
          </div>
        </div>

        {/* Backend API Status */}
        <div className="bg-[#0D0F14] border border-[#232734] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Backend API</span>
            {isBackendReachable ? (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Standby / Mock Active
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Server className={`w-4 h-4 ${isBackendReachable ? 'text-zinc-200' : 'text-zinc-500'}`} />
              <span className="text-sm font-semibold text-zinc-100">
                {isBackendReachable ? 'Express Service' : 'Local Fallback'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Node.js Express Server</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-[#0D0F14] border border-[#232734] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Database</span>
            {isDbConnected ? (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                Standby
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${isDbConnected ? 'text-zinc-200' : 'text-zinc-500'}`} />
              <span className="text-sm font-semibold text-zinc-100">
                {isDbConnected ? 'MongoDB Connected' : 'Offline / Mock'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Mongoose ODM</p>
          </div>
        </div>
      </div>

      {/* Raw Payload Toggle */}
      <div className="mt-5 pt-4 border-t border-[#232734] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showRawJson ? 'Hide raw health JSON' : 'Inspect raw health JSON'}</span>
        </button>

        {lastChecked && (
          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Checked: {new Date(lastChecked).toLocaleTimeString()}
          </span>
        )}
      </div>

      {showRawJson && (
        <pre className="mt-3 p-3.5 rounded-xl bg-[#090A0E] border border-[#232734] text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-60">
          {JSON.stringify(health || { status: 'No payload received' }, null, 2)}
        </pre>
      )}
    </div>
  );
}
