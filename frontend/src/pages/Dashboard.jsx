import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { emailService } from '../services/emailService.js';
import { StatCard } from '../components/StatCard.jsx';
import { EmailTable } from '../components/EmailTable.jsx';
import {
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Plus,
  Radio,
  Sparkles,
} from 'lucide-react';

export function Dashboard() {
  const {
    refreshTrigger,
    onViewDetails,
    onCancelEmail,
    onOpenCompose,
    autoRefresh,
  } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchDashboardData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      setError(null);
      const [statsRes, emailsRes] = await Promise.all([
        emailService.getDashboardStats(),
        emailService.getEmails({
          page,
          limit: 10,
          status: statusFilter,
          search: searchTerm,
        }),
      ]);

      setStats(statsRes.data?.counts || {});
      setEmails(emailsRes.data || []);
      setPagination(emailsRes.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData, refreshTrigger]);

  // Periodic polling every 8s so status updates reflect automatically
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 font-mono">
              <Radio className="w-3 h-3 text-indigo-500 animate-pulse" />
              <span>BullMQ Delayed Queue</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-zinc-900 dark:text-zinc-100 tracking-tight">
            Email Automation Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Monitor real-time delayed queues, background worker execution, and Ethereal test inbox previews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="hero-schedule-btn"
            onClick={onOpenCompose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule Email</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total Emails"
          value={stats?.total ?? 0}
          icon={Mail}
          color="indigo"
          subtitle="All created records"
          isLoading={isLoading && !stats}
        />
        <StatCard
          title="Scheduled"
          value={stats?.scheduled ?? 0}
          icon={Clock}
          color="sky"
          subtitle="Waiting in queue"
          isLoading={isLoading && !stats}
        />
        <StatCard
          title="Processing"
          value={stats?.processing ?? 0}
          icon={Activity}
          color="amber"
          subtitle="Active in worker"
          isLoading={isLoading && !stats}
        />
        <StatCard
          title="Sent"
          value={stats?.sent ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Ethereal delivered"
          isLoading={isLoading && !stats}
        />
        <StatCard
          title="Failed"
          value={stats?.failed ?? 0}
          icon={AlertCircle}
          color="rose"
          subtitle="Exhausted retries"
          isLoading={isLoading && !stats}
        />
      </div>

      {/* Activity Table */}
      <EmailTable
        title="Recent Email Activity"
        emails={emails}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onRefresh={() => fetchDashboardData(false)}
        onPageChange={(newPage) => setPage(newPage)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onViewDetails={onViewDetails}
        onCancelEmail={onCancelEmail}
        onOpenCompose={onOpenCompose}
      />
    </div>
  );
}
