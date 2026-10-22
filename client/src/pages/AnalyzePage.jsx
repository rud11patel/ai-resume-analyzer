import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Info,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { ResumeUploader } from '../components/resume/ResumeUploader';
import { TextArea } from '../components/forms/TextArea';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SAMPLE_JOB_DESCRIPTIONS } from '../data/sampleJobDescriptions';
import { resumesApi, jobDescriptionsApi, analysesApi } from '../services/api';
import { validateJobDescription, validateResumeFile } from '../utils/validators';
import { formatDate, formatBytes } from '../utils/formatters';

export function AnalyzePage() {
  const navigate = useNavigate();

  // Mode Selection: 'upload' | 'library' for resume; 'text' | 'saved' for job description
  const [resumeMode, setResumeMode] = useState('upload');
  const [jdMode, setJdMode] = useState('text');

  // Form State - ONLY Resume and Job Description
  const [file, setFile] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [existingResumes, setExistingResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  const [jobDescription, setJobDescription] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  const [savedJds, setSavedJds] = useState([]);
  const [loadingJds, setLoadingJds] = useState(false);

  // Validation & Loading State
  const [errors, setErrors] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);

  const analysisSteps = [
    'Parsing resume structure and formatting...',
    'Extracting technical proficiencies and domain keywords...',
    'Evaluating semantic alignment with job requirements...',
    'Calculating deterministic compatibility score...',
    'Generating targeted bullet point recommendations...',
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

  // Quick preset template loader - only populates job description text
  const handleSelectPreset = (preset) => {
    setJdMode('text');
    setJobDescription(preset.description);
    if (errors.jobDescription) {
      setErrors((prev) => ({ ...prev, jobDescription: null }));
    }
  };

  const handleClearForm = () => {
    setFile(null);
    setJobDescription('');
    setErrors({});
  };

  // Delete existing resume from library
  const handleDeleteResume = async (e, resumeId) => {
    e.stopPropagation();
    try {
      await resumesApi.delete(resumeId);
      setExistingResumes((prev) => prev.filter((r) => r._id !== resumeId));
      if (selectedResumeId === resumeId) {
        setSelectedResumeId('');
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: `Failed to remove resume: ${err.message}` }));
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
      setErrors((prev) => ({ ...prev, form: `Failed to remove job description: ${err.message}` }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate resume
    if (resumeMode === 'upload') {
      if (!file) {
        newErrors.file = 'Please upload a resume file (PDF or DOCX).';
      } else {
        const fileValidation = validateResumeFile(file);
        if (!fileValidation.isValid) {
          newErrors.file = fileValidation.error;
        }
      }
    } else {
      if (!selectedResumeId) {
        newErrors.file = 'Please select a resume from your library.';
      }
    }

    // Validate job description
    if (jdMode === 'text') {
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
          throw new Error('Failed to upload and parse resume on the server.');
        }
        if (uploadedResume.extractionStatus === 'failed') {
          throw new Error(
            uploadedResume.extractionError || 'Document text extraction failed. Please ensure the file is an unencrypted PDF or DOCX.'
          );
        }
        effectiveResumeId = uploadedResume._id;
      }

      // 2. Resolve Job Description ID (no company or title required)
      let effectiveJdId = selectedJdId;
      if (jdMode === 'text') {
        const createdJd = await jobDescriptionsApi.create({
          rawText: jobDescription.trim(),
        });
        if (!createdJd || !createdJd._id) {
          throw new Error('Failed to store target job description.');
        }
        effectiveJdId = createdJd._id;
      }

      // 3. Trigger Compatibility Analysis
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
        form: err.message || 'An error occurred during analysis. Please verify service availability.',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#16181F] text-zinc-300 border border-[#262A37] mb-3.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>Deterministic Match Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
          Analyze Resume & Job Fit
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed">
          Provide your resume and target job requirements to generate a comprehensive compatibility audit, skill gap breakdown, and targeted bullet recommendations.
        </p>
      </div>

      {/* Analysis In-Progress Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090A0E]/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#111318] border border-[#262A37] p-8 text-center shadow-2xl space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
                <LoadingSpinner size="md" className="text-zinc-200" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Evaluating Match Score
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-2 min-h-[1.5rem]">
                {analysisSteps[analysisStepIndex]}
              </p>
            </div>

            {/* Step progress dots */}
            <div className="flex items-center justify-center gap-1.5">
              {analysisSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i <= analysisStepIndex ? 'w-6 bg-zinc-200' : 'w-2 bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            <p className="text-[11px] text-zinc-500">
              Processing semantic alignment and keyword extraction...
            </p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Resume Upload / Library Section */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#232734]">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-[11px] font-semibold">
                1
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Candidate Resume</h2>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0D0F14] border border-[#232734] rounded-xl">
              <button
                type="button"
                onClick={() => setResumeMode('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  resumeMode === 'upload'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('library')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  resumeMode === 'library'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
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
                <div className="py-8 flex justify-center items-center text-xs text-zinc-400">
                  <LoadingSpinner size="sm" className="mr-2" /> Loading library resumes...
                </div>
              ) : existingResumes.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#232734] bg-[#0D0F14]/40">
                  <FileText className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No resumes stored in your library yet.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-zinc-300"
                    onClick={() => setResumeMode('upload')}
                  >
                    Upload a resume
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
                            ? 'bg-[#171A23] border-zinc-500 ring-1 ring-zinc-500/50'
                            : 'bg-[#0D0F14] border-[#232734] hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-zinc-850 text-zinc-400 border border-zinc-800'}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-100 truncate">
                              {res.originalName}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                              <span>{formatBytes(res.fileSize)}</span>
                              <span>&bull;</span>
                              <span>{formatDate(res.createdAt)}</span>
                            </div>
                            <span
                              className={`inline-block mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                                res.extractionStatus === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              {res.extractionStatus === 'completed' ? 'Extracted & Indexed' : res.extractionStatus}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4 text-zinc-200" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteResume(e, res._id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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

        {/* Step 2: Target Job Description Section - ONLY asks for Job Description text */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#232734]">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-[11px] font-semibold">
                2
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Job Description</h2>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0D0F14] border border-[#232734] rounded-xl">
              <button
                type="button"
                onClick={() => setJdMode('text')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  jdMode === 'text'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Paste Description
              </button>
              <button
                type="button"
                onClick={() => setJdMode('saved')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  jdMode === 'saved'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Saved Postings ({savedJds.length})
              </button>
            </div>
          </div>

          {jdMode === 'text' ? (
            <>
              {/* Quick Sample Presets - Directly fill the description */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <span className="text-xs text-zinc-400">Load sample job requirements:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SAMPLE_JOB_DESCRIPTIONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#16181F] hover:bg-[#1D202A] text-zinc-300 border border-[#262A37] hover:border-zinc-600 transition-colors cursor-pointer"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Description Text Area */}
              <TextArea
                id="job-description"
                name="jobDescription"
                label="Job Requirements & Responsibilities"
                required
                rows={10}
                minChars={40}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (errors.jobDescription) {
                    setErrors((prev) => ({ ...prev, jobDescription: null }));
                  }
                }}
                placeholder="Paste the full job description here, including required technologies, qualifications, and core duties..."
                error={errors.jobDescription}
                headerAction={
                  jobDescription ? (
                    <button
                      type="button"
                      onClick={() => setJobDescription('')}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
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
                <div className="py-8 flex justify-center items-center text-xs text-zinc-400">
                  <LoadingSpinner size="sm" className="mr-2" /> Loading saved job postings...
                </div>
              ) : savedJds.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#232734] bg-[#0D0F14]/40">
                  <Layers className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No saved job descriptions found.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-zinc-300"
                    onClick={() => setJdMode('text')}
                  >
                    Paste a job description
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedJds.map((jd) => {
                    const isSelected = selectedJdId === jd._id;
                    const previewText = jd.rawText || '';
                    return (
                      <div
                        key={jd._id}
                        onClick={() => {
                          setSelectedJdId(jd._id);
                          if (errors.jobDescription) setErrors((prev) => ({ ...prev, jobDescription: null }));
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#171A23] border-zinc-500 ring-1 ring-zinc-500/50'
                            : 'bg-[#0D0F14] border-[#232734] hover:border-zinc-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-200 line-clamp-3 leading-relaxed">
                            {previewText}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-2 font-mono">
                            <span>{previewText.length} characters</span>
                            <span>&bull;</span>
                            <span>{formatDate(jd.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {isSelected && <Check className="w-4 h-4 text-zinc-200" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteJd(e, jd._id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white font-semibold">Analysis Failed:</strong> {errors.form}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#111318] border border-[#232734] shadow-sm">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span>
              Deterministic NLP parsing performs skill extraction, keyword density analysis, and weighted scoring.
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
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Sparkles}
              isLoading={isAnalyzing}
            >
              Run Analysis
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
