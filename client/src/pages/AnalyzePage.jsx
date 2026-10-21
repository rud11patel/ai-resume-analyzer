import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Briefcase, 
  Building, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Info,
  Layers,
  RotateCcw,
  Check,
  Calendar,
  Clock
} from 'lucide-react';
import { ResumeUploader } from '../components/resume/ResumeUploader';
import { TextInput } from '../components/forms/TextInput';
import { TextArea } from '../components/forms/TextArea';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SAMPLE_JOB_DESCRIPTIONS } from '../data/sampleJobDescriptions';
import { resumesApi, jobDescriptionsApi, analysesApi } from '../services/api';
import { validateJobDescription, validateResumeFile } from '../utils/validators';
import { formatDate, formatBytes } from '../utils/formatters';

export function AnalyzePage() {
  const navigate = useNavigate();

  // Mode Selection: 'upload' | 'existing' for resume; 'new' | 'saved' for job description
  const [resumeMode, setResumeMode] = useState('upload');
  const [jdMode, setJdMode] = useState('new');

  // Form State
  const [file, setFile] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [existingResumes, setExistingResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  const [roleTitle, setRoleTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  const [savedJds, setSavedJds] = useState([]);
  const [loadingJds, setLoadingJds] = useState(false);

  // Validation & Loading State
  const [errors, setErrors] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);

  const analysisSteps = [
    'Parsing resume structure and section layout...',
    'Extracting technical skills, libraries & tools...',
    'Performing semantic job description alignment...',
    'Computing compatibility scores and keyword density...',
    'Synthesizing tailored bullet point improvements...',
  ];

  // Fetch existing resumes and job descriptions on mount
  useEffect(() => {
    async function loadResources() {
      setLoadingResumes(true);
      setLoadingJds(true);
      try {
        const [resumes, jds] = await Promise.all([
          resumesApi.getAll().catch(() => []),
          jobDescriptionsApi.getAll().catch(() => []),
        ]);
        setExistingResumes(resumes || []);
        if (resumes && resumes.length > 0) {
          setSelectedResumeId(resumes[0]._id);
        }
        setSavedJds(jds || []);
        if (jds && jds.length > 0) {
          setSelectedJdId(jds[0]._id);
        }
      } catch (err) {
        console.warn('Failed to load candidate resources:', err);
      } finally {
        setLoadingResumes(false);
        setLoadingJds(false);
      }
    }
    loadResources();
  }, []);

  // Preset loader
  const handleSelectPreset = (preset) => {
    setJdMode('new');
    setRoleTitle(preset.title);
    setCompany(preset.company);
    setJobDescription(preset.description);
    if (errors.jobDescription) {
      setErrors((prev) => ({ ...prev, jobDescription: null }));
    }
  };

  const handleClearForm = () => {
    setFile(null);
    setRoleTitle('');
    setCompany('');
    setJobDescription('');
    setErrors({});
  };

  // Delete existing resume
  const handleDeleteResume = async (e, resumeId) => {
    e.stopPropagation();
    try {
      await resumesApi.delete(resumeId);
      setExistingResumes((prev) => prev.filter((r) => r._id !== resumeId));
      if (selectedResumeId === resumeId) {
        setSelectedResumeId('');
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: `Failed to delete resume: ${err.message}` }));
    }
  };

  // Delete saved job description
  const handleDeleteJd = async (e, jdId) => {
    e.stopPropagation();
    try {
      await jobDescriptionsApi.delete(jdId);
      setSavedJds((prev) => prev.filter((j) => j._id !== jdId));
      if (selectedJdId === jdId) {
        setSelectedJdId('');
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: `Failed to delete job description: ${err.message}` }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate resume
    if (resumeMode === 'upload') {
      if (!file) {
        newErrors.file = 'Please upload a resume file (PDF or DOCX) before analyzing.';
      } else {
        const fileValidation = validateResumeFile(file);
        if (!fileValidation.isValid) {
          newErrors.file = fileValidation.error;
        }
      }
    } else {
      if (!selectedResumeId) {
        newErrors.file = 'Please select a previously uploaded resume from your library.';
      }
    }

    // Validate job description
    if (jdMode === 'new') {
      const jdValidation = validateJobDescription(jobDescription, 40);
      if (!jdValidation.isValid) {
        newErrors.jobDescription = jdValidation.error;
      }
    } else {
      if (!selectedJdId) {
        newErrors.jobDescription = 'Please select a saved job description.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsAnalyzing(true);
    setAnalysisStepIndex(0);

    // Progressive step indicator
    const stepInterval = setInterval(() => {
      setAnalysisStepIndex((prev) => {
        if (prev < analysisSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      // 1. Resolve Resume ID
      let effectiveResumeId = selectedResumeId;
      if (resumeMode === 'upload') {
        const uploadedResume = await resumesApi.upload(file);
        if (!uploadedResume || !uploadedResume._id) {
          throw new Error('Failed to upload and store resume on the server.');
        }
        if (uploadedResume.extractionStatus === 'failed') {
          throw new Error(
            uploadedResume.extractionError || 'Document text extraction failed. Please ensure the file is an unencrypted PDF or DOCX.'
          );
        }
        effectiveResumeId = uploadedResume._id;
      }

      // 2. Resolve Job Description ID
      let effectiveJdId = selectedJdId;
      if (jdMode === 'new') {
        const createdJd = await jobDescriptionsApi.create({
          roleTitle: roleTitle.trim() || undefined,
          company: company.trim() || undefined,
          rawText: jobDescription.trim(),
        });
        if (!createdJd || !createdJd._id) {
          throw new Error('Failed to persist target job description.');
        }
        effectiveJdId = createdJd._id;
      }

      // 3. Trigger Real AI/NLP Compatibility Analysis
      const analysisRecord = await analysesApi.create({
        resumeId: effectiveResumeId,
        jobDescriptionId: effectiveJdId,
      });

      if (!analysisRecord || !analysisRecord._id) {
        throw new Error('Analysis completed without generating a valid identifier.');
      }

      clearInterval(stepInterval);
      navigate(`/results/${analysisRecord._id}`);
    } catch (err) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setErrors({
        form: err.message || 'An error occurred during resume analysis. Please verify service availability.',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Compatibility Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Evaluate Resume & Job Fit
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          Upload or select a resume and compare against a target job posting to receive a deterministic match score, missing skills breakdown, and AI bullet suggestions.
        </p>
      </div>

      {/* Analysis In-Progress Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <LoadingSpinner size="lg" className="text-indigo-400" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Evaluating Resume Match
              </h3>
              <p className="text-xs text-indigo-300 font-mono mt-2 min-h-[1.5rem] transition-all">
                {analysisSteps[analysisStepIndex]}
              </p>
            </div>

            {/* Step progress dots */}
            <div className="flex items-center justify-center gap-2">
              {analysisSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= analysisStepIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Generating your multi-dimensional report via Python AI engine...
            </p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Resume Upload / Selection Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h2 className="text-base font-bold text-white">Select Candidate Resume</h2>
            </div>

            {/* Toggle Tabs: Upload New vs Choose Existing */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setResumeMode('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  resumeMode === 'upload'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('existing')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  resumeMode === 'existing'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Library ({existingResumes.length})
              </button>
            </div>
          </div>

          {resumeMode === 'upload' ? (
            <ResumeUploader
              file={file}
              onFileSelect={(selected) => {
                setFile(selected);
                if (errors.file) setErrors((prev) => ({ ...prev, file: null }));
              }}
              onFileRemove={() => setFile(null)}
              error={errors.file}
            />
          ) : (
            <div className="space-y-3">
              {loadingResumes ? (
                <div className="py-8 flex justify-center items-center text-xs text-slate-400">
                  <LoadingSpinner size="sm" className="mr-2" /> Loading uploaded resumes...
                </div>
              ) : existingResumes.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No resumes in your library yet.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-indigo-400"
                    onClick={() => setResumeMode('upload')}
                  >
                    Upload your first resume
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingResumes.map((res) => {
                    const isSelected = selectedResumeId === res._id;
                    return (
                      <div
                        key={res._id}
                        onClick={() => {
                          setSelectedResumeId(res._id);
                          if (errors.file) setErrors((prev) => ({ ...prev, file: null }));
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/50'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white truncate">
                              {res.originalName}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                              <span>{formatBytes(res.fileSize)}</span>
                              <span>&bull;</span>
                              <span>{formatDate(res.createdAt)}</span>
                            </div>
                            <span
                              className={`inline-block mt-2 text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                                res.extractionStatus === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              Status: {res.extractionStatus}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteResume(e, res._id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete resume"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.file && <p className="text-xs text-rose-400 mt-1">{errors.file}</p>}
            </div>
          )}
        </div>

        {/* Step 2: Target Job Details & Description */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h2 className="text-base font-bold text-white">Target Job Description</h2>
            </div>

            {/* Toggle Tabs: Enter New vs Saved Job Descriptions */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setJdMode('new')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  jdMode === 'new'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                New Posting
              </button>
              <button
                type="button"
                onClick={() => setJdMode('saved')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  jdMode === 'saved'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Saved Library ({savedJds.length})
              </button>
            </div>
          </div>

          {jdMode === 'new' ? (
            <>
              {/* Quick Sample Presets */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-400">Quick template presets:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SAMPLE_JOB_DESCRIPTIONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition-colors cursor-pointer"
                    >
                      {preset.title.split(' ')[1] || preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role and Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  id="role-title"
                  name="roleTitle"
                  label="Target Role Title (Optional)"
                  placeholder="e.g. Senior Frontend Engineer"
                  icon={Briefcase}
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  helperText="Auto-detected if left empty"
                />
                <TextInput
                  id="company-name"
                  name="company"
                  label="Target Company (Optional)"
                  placeholder="e.g. Stripe, Linear, Netflix"
                  icon={Building}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  helperText="Helps contextualize the evaluation"
                />
              </div>

              {/* Job Description Text Area */}
              <TextArea
                id="job-description"
                name="jobDescription"
                label="Job Description Requirements & Responsibilities"
                required
                rows={9}
                minChars={40}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (errors.jobDescription) {
                    setErrors((prev) => ({ ...prev, jobDescription: null }));
                  }
                }}
                placeholder="Paste the full job description here, including required skills, qualifications, and core responsibilities..."
                error={errors.jobDescription}
                headerAction={
                  jobDescription ? (
                    <button
                      type="button"
                      onClick={() => setJobDescription('')}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear Text
                    </button>
                  ) : null
                }
              />
            </>
          ) : (
            <div className="space-y-3">
              {loadingJds ? (
                <div className="py-8 flex justify-center items-center text-xs text-slate-400">
                  <LoadingSpinner size="sm" className="mr-2" /> Loading saved job descriptions...
                </div>
              ) : savedJds.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                  <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No saved job descriptions found.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-indigo-400"
                    onClick={() => setJdMode('new')}
                  >
                    Enter a new job description
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedJds.map((jd) => {
                    const isSelected = selectedJdId === jd._id;
                    return (
                      <div
                        key={jd._id}
                        onClick={() => {
                          setSelectedJdId(jd._id);
                          if (errors.jobDescription) setErrors((prev) => ({ ...prev, jobDescription: null }));
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/50'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">
                            {jd.roleTitle || 'Untitled Position'}
                          </h4>
                          <p className="text-[11px] text-indigo-400 font-medium">
                            {jd.company || 'Enterprise Role'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {jd.rawText}
                          </p>
                          <span className="inline-block mt-2 text-[10px] text-slate-500">
                            Saved {formatDate(jd.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteJd(e, jd._id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete job description"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.jobDescription && (
                <p className="text-xs text-rose-400 mt-1">{errors.jobDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Global Error Notice */}
        {errors.form && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white font-semibold">Analysis Failed:</strong> {errors.form}
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              Real-Time AI Pipeline: Runs text extraction, TF-IDF semantic matching, and deterministic scoring.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClearForm}
              disabled={isAnalyzing}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Sparkles}
              isLoading={isAnalyzing}
            >
              Run Compatibility Analysis
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
