import React, { useState, useEffect } from 'react';
import { emailService } from '../services/emailService.js';
import { X, Calendar, Clock, Send, AlertCircle, Sparkles, CheckCircle2, Globe } from 'lucide-react';
import { formatDateUTC } from '../utils/formatters.js';

export function ComposeModal({ isOpen, onClose, onEmailScheduled }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Set default scheduledAt on open & handle Escape key
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setPresetMinutes(2); // Default to 2 minutes from now for easy testing

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const setPresetMinutes = (minutes) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    const offset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - offset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setError(null);
  };

  const setPresetTomorrowMorning = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const offset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - offset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate clicks
    setError(null);
    setSuccessMsg(null);

    if (!recipient.trim() || !subject.trim() || !body.trim() || !scheduledAt) {
      setError('Please fill in all required fields.');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      setError('Invalid date and time selected.');
      return;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      setError('Scheduled time must be in the future.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await emailService.scheduleEmail({
        recipient: recipient.trim(),
        subject: subject.trim(),
        body: body.trim(),
        scheduledAt: scheduledDate.toISOString(),
      });

      setSuccessMsg('Email scheduled successfully into BullMQ queue.');
      setTimeout(() => {
        onEmailScheduled(res.data);
        onClose();
        // Reset fields
        setRecipient('');
        setSubject('');
        setBody('');
      }, 700);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || err.message;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 id="compose-modal-title" className="text-base font-bold font-heading text-zinc-900 dark:text-zinc-100">
                Compose Scheduled Email
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Queued into Redis BullMQ & tested with Ethereal SMTP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Recipient Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="compose-recipient"
              type="email"
              placeholder="e.g. client@example.com, reviewer@test.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all font-mono"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="compose-subject"
              type="text"
              placeholder="e.g. Monthly Performance Summary & Deliverables"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Message Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="compose-body"
              rows={4}
              placeholder="Write your email message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Scheduling Section */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Dispatch Schedule
              </span>
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Zone: {timeZoneName}</span>
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 py-1 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
              </span>
              <button
                type="button"
                onClick={() => setPresetMinutes(1)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                +1 min
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(5)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                +5 min
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(30)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                +30 min
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(60)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                +1 hr
              </button>
              <button
                type="button"
                onClick={setPresetTomorrowMorning}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                Tomorrow 9 AM
              </button>
            </div>

            {/* Datetime Input & UTC Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <input
                  id="compose-datetime"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                />
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center justify-between sm:justify-end gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono">
                <span>UTC:</span>
                <span className="text-zinc-800 dark:text-zinc-200 truncate">
                  {scheduledAt ? formatDateUTC(scheduledAt) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-schedule-email"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Enqueuing...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
