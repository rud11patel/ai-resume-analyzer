import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings as SettingsIcon, 
  Activity, 
  RotateCcw, 
  LogOut, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Layers
} from 'lucide-react';
import { useMockAuth } from '../hooks/useMockAuth';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { TextInput } from '../components/forms/TextInput';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { HealthStatusCard } from '../components/HealthStatusCard';

export function SettingsPage() {
  const { user, updateProfile, logout } = useMockAuth();
  const { resetHistory, analyses } = useAnalysisHistory();
  const { health, loading: healthLoading, lastChecked, refetch: refetchHealth } = useHealthCheck();
  const navigate = useNavigate();

  // Profile Form State
  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [title, setTitle] = useState(user?.title || 'Full Stack Engineer');
  const [email, setEmail] = useState(user?.email || 'alex.morgan@example.com');
  const [targetLevel, setTargetLevel] = useState('Senior');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile({ name, title, email });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetData = () => {
    resetHistory();
    setIsResetModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            Candidate Settings & Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your candidate profile preferences, local demo storage, and live system health.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={LogOut}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>

      {/* 1. Candidate Profile Settings */}
      <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <User className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Candidate Profile</h2>
            <p className="text-xs text-slate-400">Used for contextualizing resume match assessments.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              id="pref-name"
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Candidate Name"
            />
            <TextInput
              id="pref-title"
              label="Professional Headline / Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
            />
            <TextInput
              id="pref-email"
              label="Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Seniority Level
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Entry">Entry / Junior Level (0-2 years)</option>
                <option value="Mid">Mid-Level (2-5 years)</option>
                <option value="Senior">Senior Level (5-8 years)</option>
                <option value="Lead">Staff / Principal / Lead (8+ years)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved in local profile!
              </span>
            ) : <span />}

            <Button type="submit" variant="primary" size="sm" icon={Save}>
              Save Profile Preferences
            </Button>
          </div>
        </form>
      </section>

      {/* 2. Demonstration Workspace Data Management */}
      <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <RotateCcw className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Data Management</h2>
            <p className="text-xs text-slate-400">Manage mock records stored in your browser's localStorage.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div>
            <h4 className="font-semibold text-white">Reset Demo Analysis Dataset</h4>
            <p className="text-slate-400 mt-0.5">
              Restores the default suite of curated evaluation reports ({analyses.length} currently saved).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={() => setIsResetModalOpen(true)}
          >
            Reset to Defaults
          </Button>
        </div>
      </section>

      {/* 3. Phase 1 System Health Verification (Preserved) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Phase 1 Backend & Architecture Diagnostics
            </h2>
            <p className="text-xs text-slate-400">
              Live probe of the Node.js backend API and MongoDB connectivity.
            </p>
          </div>
        </div>

        <HealthStatusCard
          health={health}
          loading={healthLoading}
          lastChecked={lastChecked}
          onRefresh={refetchHealth}
        />
      </section>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Demo Analyses?"
        description="This will restore the initial demonstration evaluation reports in your local browser storage. Any custom analyses you ran will be replaced with the standard demo set."
        confirmText="Yes, Reset Records"
        confirmVariant="primary"
        onConfirm={handleResetData}
      />
    </div>
  );
}
