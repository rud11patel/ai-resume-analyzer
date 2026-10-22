import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#1E222D] bg-[#090A0E] text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-zinc-100 text-sm tracking-tight">ResumeAI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Enterprise
              </span>
            </div>
            <p className="text-zinc-400 text-xs max-w-md leading-relaxed">
              Intelligent applicant tracking system compatibility engine. Compare candidate resumes against target job descriptions, discover skill gaps, and receive targeted resume enhancements.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Deterministic Matching Engine
              </span>
              <span>&bull;</span>
              <span>Secure Document Processing</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium text-zinc-200 uppercase tracking-wider text-[11px] mb-3">
              Application
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/analyze" className="text-zinc-400 hover:text-white transition-colors">
                  Resume Analysis
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
                  Overview Dashboard
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-zinc-400 hover:text-white transition-colors">
                  Analysis Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* System */}
          <div>
            <h4 className="font-medium text-zinc-200 uppercase tracking-wider text-[11px] mb-3">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/settings" className="text-zinc-400 hover:text-white transition-colors">
                  System Diagnostics
                </Link>
              </li>
              <li>
                <span className="text-zinc-500">
                  WCAG AAA High Contrast
                </span>
              </li>
              <li>
                <span className="text-zinc-500">
                  Strict Confidentiality
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#1C1F2B] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>
            &copy; {new Date().getFullYear()} ResumeAI. Professional Resume & Job Alignment Intelligence.
          </p>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>FastAPI &bull; Node.js &bull; React &bull; Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
