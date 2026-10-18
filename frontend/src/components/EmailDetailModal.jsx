import React, { useState } from 'react';
import { X, ExternalLink, Clock, CheckCircle2, AlertTriangle, Trash2, Mail, ShieldAlert } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { formatDate, formatDateUTC } from '../utils/formatters.js';

export function EmailDetailModal({ email, isOpen, onClose, onCancelEmail }) {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen || !email) return null;

  const canCancel = email.status === 'scheduled' || email.status === 'queued';

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this scheduled email?')) return;
    try {
      setIsCancelling(true);
      await onCancelEmail(email._id);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Email Details</h2>
              <p className="text-xs font-mono text-slate-500">ID: {email._id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={email.status} />
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Failure Alert */}
          {email.lastError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider mb-1">
                <AlertTriangle className="w-4 h-4" />
                Delivery Failure Log
              </div>
              <p className="text-sm font-mono text-rose-200">{email.lastError}</p>
              <p className="text-xs text-rose-400/80 mt-1">Attempts made: {email.attempts} / {email.maxAttempts || 3}</p>
            </div>
          )}

          {/* Ethereal Preview Banner */}
          {email.etherealPreviewUrl && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ethereal SMTP Test Preview
                </span>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Message accepted by Ethereal development mail server.
                </p>
              </div>
              <a
                href={email.etherealPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 transition-all"
              >
                <span>Open Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider block font-semibold mb-1">Recipient</span>
              <span className="text-white font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                {email.recipient}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider block font-semibold mb-1">BullMQ Job ID</span>
              <span className="text-slate-300 font-mono">
                {email.jobId || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider block font-semibold mb-1">Scheduled Time</span>
              <span className="text-slate-200">{formatDate(email.scheduledAt)}</span>
              <span className="block text-[11px] text-slate-500 font-mono mt-0.5">{formatDateUTC(email.scheduledAt)}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider block font-semibold mb-1">
                {email.sentAt ? 'Sent Time' : 'Created Time'}
              </span>
              <span className="text-slate-200">
                {email.sentAt ? formatDate(email.sentAt) : formatDate(email.createdAt)}
              </span>
              {email.sentAt && (
                <span className="block text-[11px] text-slate-500 font-mono mt-0.5">{formatDateUTC(email.sentAt)}</span>
              )}
            </div>
          </div>

          {/* Subject & Message Body */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Subject</span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-white">
              {email.subject}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Message Content</span>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed min-h-[120px]">
              {email.body}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <div>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCancelling ? 'Cancelling Job...' : 'Cancel Scheduled Email'}</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
