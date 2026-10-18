import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { emailService } from '../services/emailService.js';
import { EmailTable } from '../components/EmailTable.jsx';
import { AlertCircle } from 'lucide-react';

export function Failed() {
  const { refreshTrigger, onViewDetails, onCancelEmail } = useOutletContext();
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const fetchFailedEmails = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchFailedEmails();
  }, [fetchFailedEmails, refreshTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Dead Letter / Exhausted Retries</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Failed Emails</h1>
          <p className="text-xs text-slate-400 mt-1">
            Emails that failed delivery attempts after bounded exponential backoff retries. Click any row to review error details.
          </p>
        </div>
      </div>

      <EmailTable
        title="Failed Dispatches"
        emails={emails}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchFailedEmails}
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
