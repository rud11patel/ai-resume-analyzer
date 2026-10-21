import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
        404 Not Found
      </span>
      <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
        Page Does Not Exist
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-2 leading-relaxed">
        The requested page or route could not be found. Check the URL or return to the dashboard.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" icon={Home}>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
