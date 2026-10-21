import React, { useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { API_BASE_URL } from '../../services/api';

export function ApiHealthBadge({ showDetailsModal = true }) {
  const { health, loading, refetch } = useHealthCheck();
  const [isOpen, setIsOpen] = useState(false);

  const isOnline = health?.success;
  const isDbConnected = health?.data?.services?.database?.connected;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300"
        title="Backend API Connection Status"
      >
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          )}
        </span>
        <span className="text-[11px] hidden sm:inline">
          {isOnline ? 'API Connected' : 'Mock Mode (Local)'}
        </span>
      </button>

      {/* Popover / Mini Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setIsOpen(false)} />
          
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">API Health Status</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Express Backend:</span>
                <span className={`font-semibold flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isOnline ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {isOnline ? 'Reachable' : 'Not running (Mock Active)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">MongoDB Database:</span>
                <span className={`font-semibold flex items-center gap-1 ${isDbConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isDbConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {isDbConnected ? 'Connected' : 'Offline / Standby'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Target Endpoint:</span>
                <span className="font-mono text-slate-300 truncate max-w-[180px]">{API_BASE_URL}</span>
              </div>

              <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                Phase 2 UI uses client-side mock evaluation. When the Express server is running, the health probe confirms end-to-end network connectivity.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Testing...' : 'Retest Health'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
