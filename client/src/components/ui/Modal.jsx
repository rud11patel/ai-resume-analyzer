import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmVariant = 'danger',
  isConfirmLoading = false,
  maxWidth = 'max-w-md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#090A0E]/80 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-[#111318] border border-[#262A37] p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#232734]">
          <div>
            <h3 id="modal-title" className="text-base font-bold text-zinc-100 tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-zinc-400 mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 text-xs sm:text-sm text-zinc-300">
          {children}
        </div>

        {onConfirm && (
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#232734]">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isConfirmLoading}>
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              size="sm"
              onClick={onConfirm}
              isLoading={isConfirmLoading}
            >
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
