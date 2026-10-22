import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { validateResumeFile } from '../../utils/validators';
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
        <div className="rounded-2xl border border-[#262A37] bg-[#111318] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-200 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate max-w-[260px] sm:max-w-md">
                    {file.name}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {getExtensionLabel(file.name)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                  <span>{formatBytes(file.size)}</span>
                  <span>&bull;</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready for evaluation
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleChooseClick}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Replace resume file"
                aria-label="Replace file"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-150 cursor-pointer ${
            isDragging
              ? 'border-zinc-400 bg-zinc-800/25'
              : error
              ? 'border-rose-500/50 bg-rose-950/10 hover:border-rose-400'
              : 'border-[#232734] hover:border-zinc-600 bg-[#0D0F14]/70 hover:bg-[#111318]'
          }`}
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                isDragging
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-600'
                  : 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/70'
              }`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-xs sm:text-sm font-medium text-zinc-200">
              <span className="text-white underline decoration-zinc-600 underline-offset-2 hover:decoration-white">Select resume document</span> or drag & drop here
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
              Supports <strong className="text-zinc-400 font-medium">PDF (.pdf)</strong> and <strong className="text-zinc-400 font-medium">Word (.docx)</strong> up to 5MB
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
