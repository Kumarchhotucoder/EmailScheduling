import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { emailService } from '../services/emailService.js';
import { EmailTable } from '../components/EmailTable.jsx';
import { Clock, Plus } from 'lucide-react';

export function Scheduled() {
  const { refreshTrigger, onViewDetails, onCancelEmail, onOpenCompose } = useOutletContext();
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const fetchScheduledEmails = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchScheduledEmails();
  }, [fetchScheduledEmails, refreshTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>BullMQ Delayed Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scheduled Emails</h1>
          <p className="text-xs text-slate-400 mt-1">
            Pending email dispatches queued for future delivery. Eligible for cancellation prior to worker pickup.
          </p>
        </div>
        <button
          onClick={onOpenCompose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Email</span>
        </button>
      </div>

      <EmailTable
        title="Pending Scheduled Dispatches"
        emails={emails}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchScheduledEmails}
        onPageChange={(p) => setPage(p)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showStatusFilter={false}
        onViewDetails={onViewDetails}
        onCancelEmail={onCancelEmail}
      />
    </div>
  );
}
