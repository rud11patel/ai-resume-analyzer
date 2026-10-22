import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings as SettingsIcon, 
  RotateCcw, 
  LogOut, 
  Save, 
  CheckCircle2, 
  Server
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
      <div className="pb-6 border-b border-[#1E222D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-zinc-400" />
            Workspace Settings & Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage user profile preferences, local demo storage, and live system health.
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
      <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#232734]">
          <User className="w-4 h-4 text-zinc-400" />
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100">User Profile</h2>
            <p className="text-xs text-zinc-400">Contextual preferences for candidate evaluations.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              id="pref-name"
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
            />
            <TextInput
              id="pref-title"
              label="Professional Headline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
            <TextInput
              id="pref-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Seniority Level
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#0D0F14] border border-[#232734] text-zinc-100 outline-none focus:border-zinc-500 cursor-pointer transition-colors"
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
                <CheckCircle2 className="w-4 h-4" /> Preferences updated successfully
              </span>
            ) : <span />}

            <Button type="submit" variant="primary" size="sm" icon={Save}>
              Save Preferences
            </Button>
          </div>
        </form>
      </section>

      {/* 2. Demonstration Workspace Data Management */}
      <section className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#232734]">
          <RotateCcw className="w-4 h-4 text-zinc-400" />
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Data Management</h2>
            <p className="text-xs text-zinc-400">Manage sample evaluation records stored in browser storage.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D0F14] border border-[#232734] text-xs">
          <div>
            <h4 className="font-semibold text-zinc-200">Reset Sample Evaluations</h4>
            <p className="text-zinc-500 mt-0.5">
              Restores initial evaluation reports ({analyses.length} currently saved).
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

      {/* 3. System Health Verification */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-zinc-400" />
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
              System & Service Diagnostics
            </h2>
            <p className="text-xs text-zinc-400">
              Live status probe of Node.js API and database connectivity.
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
        title="Reset Sample Records?"
        description="This will restore the standard evaluation records. Custom analyses will be replaced."
        confirmText="Confirm Reset"
        confirmVariant="primary"
        onConfirm={handleResetData}
      />
    </div>
  );
}
