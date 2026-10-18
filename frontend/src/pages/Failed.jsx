import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { emailService } from '../services/emailService.js';
import { EmailTable } from '../components/EmailTable.jsx';
import { AlertCircle } from 'lucide-react';

export function Failed() {
  const { refreshTrigger, onViewDetails, onCancelEmail, onOpenCompose, autoRefresh } = useOutletContext();
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const fetchFailedEmails = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      setError(null);
      const res = await emailService.getEmails({
        page,
        limit: 10,
        status: 'failed',
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
    fetchFailedEmails(false);
  }, [fetchFailedEmails, refreshTrigger]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchFailedEmails(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchFailedEmails]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Dead Letter / Exhausted Retries</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-zinc-900 dark:text-zinc-100 tracking-tight">
            Failed Queue
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Emails that failed delivery attempts after bounded exponential backoff retries. Click any row to review the failure log.
          </p>
        </div>
      </div>

      <EmailTable
        title="Failed Dispatches"
        emails={emails}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onRefresh={() => fetchFailedEmails(false)}
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
