import React, { useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';

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
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer bg-[#111318] hover:bg-[#16181F] border-[#232734] text-zinc-300"
        title="System Connection Status"
      >
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          )}
        </span>
        <span className="text-[11px] hidden sm:inline text-zinc-400">
          {isOnline ? 'System Online' : 'Standby'}
        </span>
      </button>

      {/* Popover / Mini Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#090A0E]/80 backdrop-blur-xs" onClick={() => setIsOpen(false)} />
          
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-[#111318] border border-[#262A37] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#232734]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-400" />
                <h4 className="text-sm font-semibold text-zinc-100">System Connection Status</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#232734]/70">
                <span className="text-zinc-400">Analysis Service:</span>
                <span className={`font-semibold flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isOnline ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {isOnline ? 'Operational' : 'Standby'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#232734]/70">
                <span className="text-zinc-400">Data Storage:</span>
                <span className={`font-semibold flex items-center gap-1 ${isDbConnected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {isDbConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {isDbConnected ? 'Connected' : 'Local Storage Mode'}
                </span>
              </div>

              <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
                Connects to the deterministic semantic matching engine and document processing services.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
