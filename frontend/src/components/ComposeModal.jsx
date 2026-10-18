import React, { useState, useEffect } from 'react';
import { emailService } from '../services/emailService.js';
import { X, Calendar, Clock, Send, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatDateUTC } from '../utils/formatters.js';

export function ComposeModal({ isOpen, onClose, onEmailScheduled }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Set default scheduledAt to 5 minutes in the future on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setPresetMinutes(2); // Default to 2 minutes from now for easy testing
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const setPresetMinutes = (minutes) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm format required by datetime-local input in local timezone
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
    setError(null);
    setSuccessMsg(null);

    if (!recipient.trim() || !subject.trim() || !body.trim() || !scheduledAt) {
      setError('Please fill out all required fields.');
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

      setSuccessMsg('Email scheduled successfully in BullMQ queue!');
      setTimeout(() => {
        onEmailScheduled(res.data);
        onClose();
        // Reset form
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Compose Scheduled Email</h2>
              <p className="text-xs text-slate-400">Deliver test emails asynchronously via BullMQ & Ethereal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Recipient Email <span className="text-rose-400">*</span>
            </label>
            <input
              id="compose-recipient"
              type="email"
              placeholder="e.g. client@example.com, reviewer@test.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Subject <span className="text-rose-400">*</span>
            </label>
            <input
              id="compose-subject"
              type="text"
              placeholder="e.g. Monthly Performance Summary & Deliverables"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Message Body <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="compose-body"
              rows={5}
              placeholder="Write your email message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all resize-y"
            />
          </div>

          {/* Scheduling Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Schedule Dispatch Time
              </span>
              <span className="text-[11px] text-indigo-400 font-medium">Auto-executes in background</span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 py-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => setPresetMinutes(1)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700/60 text-slate-300 transition-colors"
              >
                +1 Minute
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(5)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700/60 text-slate-300 transition-colors"
              >
                +5 Minutes
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(30)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700/60 text-slate-300 transition-colors"
              >
                +30 Minutes
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(60)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700/60 text-slate-300 transition-colors"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={setPresetTomorrowMorning}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700/60 text-slate-300 transition-colors"
              >
                Tomorrow 9:00 AM
              </button>
            </div>

            {/* Datetime Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <input
                  id="compose-datetime"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white outline-none"
                />
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between sm:justify-end gap-2 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-500">UTC Target:</span>
                <span className="font-mono text-slate-200">
                  {scheduledAt ? formatDateUTC(scheduledAt) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-schedule-email"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Enqueuing Job...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
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
