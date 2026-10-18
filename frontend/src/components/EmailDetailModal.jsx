import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Clock, CheckCircle2, AlertTriangle, Trash2, Mail } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { formatDate, formatDateUTC } from '../utils/formatters.js';

export function EmailDetailModal({ email, isOpen, onClose, onCancelEmail }) {
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !email) return null;

  const canCancel = email.status === 'scheduled' || email.status === 'queued';

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this scheduled email?')) return;
    try {
      setIsCancelling(true);
      await onCancelEmail(email._id);
      onClose();
    } catch {
      // Handled by parent
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 id="email-detail-title" className="text-base font-bold font-heading text-zinc-900 dark:text-zinc-100">
                Email Dispatch Details
              </h2>
              <p className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">ID: {email._id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={email.status} />
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Failure Alert Banner */}
          {email.lastError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Delivery Error Log
              </div>
              <p className="font-mono text-xs">{email.lastError}</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                Attempts made: {email.attempts} / {email.maxAttempts || 3}
              </p>
            </div>
          )}

          {/* Ethereal Preview Banner */}
          {email.etherealPreviewUrl && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Ethereal SMTP Sandbox Preview
                </span>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-0.5">
                  Delivered safely to development inbox. View HTML & text renderings.
                </p>
              </div>
              <a
                href={email.etherealPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all self-start sm:self-auto"
              >
                <span>Open Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block font-semibold mb-1">
                Recipient
              </span>
              <span className="text-zinc-900 dark:text-zinc-100 font-mono bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 inline-block">
                {email.recipient}
              </span>
            </div>

            <div>
              <span className="text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block font-semibold mb-1">
                BullMQ Job ID
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 font-mono">
                {email.jobId || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block font-semibold mb-1">
                Scheduled Target
              </span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">{formatDate(email.scheduledAt)}</span>
              <span className="block text-[11px] text-zinc-500 font-mono mt-0.5">{formatDateUTC(email.scheduledAt)}</span>
            </div>

            <div>
              <span className="text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block font-semibold mb-1">
                {email.sentAt ? 'Sent Timestamp' : 'Created Timestamp'}
              </span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                {email.sentAt ? formatDate(email.sentAt) : formatDate(email.createdAt)}
              </span>
              {email.sentAt && (
                <span className="block text-[11px] text-zinc-500 font-mono mt-0.5">{formatDateUTC(email.sentAt)}</span>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
              Subject
            </span>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {email.subject}
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
              Message Content
            </span>
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-[100px]">
              {email.body}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCancelling ? 'Cancelling...' : 'Cancel Scheduled Email'}</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
