import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Github, Sparkles, Shield, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight">AI Resume Analyzer</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 2
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Intelligent applicant tracking system compatibility engine. Compare your resume against 
              target job descriptions, discover missing skills, and receive AI-driven bullet point enhancements.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                UI Prototype Ready
              </span>
              <span>&bull;</span>
              <span>Client-side Mock Simulation</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Application
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Product Overview
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analyze" className="hover:text-white transition-colors">
                  New Resume Analysis
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white transition-colors">
                  Analysis History & Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              System & Diagnostics
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/settings" className="hover:text-white transition-colors">
                  Preferences & Health Monitor
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Phase 3: Real JWT Auth (Upcoming)
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Phase 4: ML NLP Engine (Upcoming)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} AI Resume Analyzer. Built for technical candidates and recruiters.
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-400">React 19 &bull; Vite 6 &bull; Tailwind CSS v4</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
