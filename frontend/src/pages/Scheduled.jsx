import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { emailService } from '../services/emailService.js';
import { EmailTable } from '../components/EmailTable.jsx';
import { Clock, Plus } from 'lucide-react';

export function Scheduled() {
  const { refreshTrigger, onViewDetails, onCancelEmail, onOpenCompose, autoRefresh } = useOutletContext();
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const fetchScheduledEmails = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      setError(null);
      const res = await emailService.getEmails({
        page,
        limit: 10,
        status: 'scheduled',
        search: searchTerm,
      });
      setEmails(res.data || []);
      setPagination(res.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchScheduledEmails(false);
  }, [fetchScheduledEmails, refreshTrigger]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchScheduledEmails(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchScheduledEmails]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>BullMQ Delayed Queue</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-zinc-900 dark:text-zinc-100 tracking-tight">
            Scheduled Emails
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Pending email dispatches queued for future delivery. You can cancel any scheduled email prior to worker execution.
          </p>
        </div>
        <button
          onClick={onOpenCompose}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Schedule Email</span>
        </button>
      </div>

      <EmailTable
        title="Pending Queue"
        emails={emails}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onRefresh={() => fetchScheduledEmails(false)}
        onPageChange={(p) => setPage(p)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showStatusFilter={false}
        onViewDetails={onViewDetails}
        onCancelEmail={onCancelEmail}
        onOpenCompose={onOpenCompose}
      />
    </div>
  );
}
