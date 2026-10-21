import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { validateResumeFile, MAX_FILE_SIZE_BYTES } from '../../utils/validators';
import { formatBytes } from '../../utils/formatters';

export function ResumeUploader({ file, onFileSelect, onFileRemove, error: externalError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const fileInputRef = useRef(null);

  const error = externalError || internalError;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (selectedFile) => {
    setInternalError(null);
    if (!selectedFile) return;

    const validation = validateResumeFile(selectedFile);
    if (!validation.isValid) {
      setInternalError(validation.error);
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleChooseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setInternalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileRemove();
  };

  const getExtensionLabel = (fileName) => {
    if (!fileName) return 'FILE';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'DOC';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileInputChange}
        className="hidden"
        id="resume-file-input"
        aria-label="Upload Resume File"
      />

      {file ? (
        // Selected File Preview Card
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                    {file.name}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {getExtensionLabel(file.name)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{formatBytes(file.size)}</span>
                  <span>&bull;</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Validated & Ready for Analysis
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleChooseClick}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Replace resume file"
                aria-label="Replace file"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Remove resume file"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Drop Zone
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleChooseClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChooseClick();
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-indigo-400 bg-indigo-950/20 scale-[1.01]'
              : error
              ? 'border-rose-500/50 bg-rose-950/10 hover:border-rose-400'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 transition-colors ${
                isDragging
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-400/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <UploadCloud className="w-7 h-7" />
            </div>

            <p className="text-sm font-semibold text-white">
              <span className="text-indigo-400 hover:underline">Choose your resume</span> or drag and drop here
            </p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
              Supports <strong className="text-slate-300">PDF (.pdf)</strong> and <strong className="text-slate-300">Word (.docx)</strong> up to 5MB
            </p>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {error && (
        <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
}
