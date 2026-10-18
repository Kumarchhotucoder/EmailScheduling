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
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';

export function Dashboard() {
  const { refreshTrigger, onViewDetails, onCancelEmail, onOpenCompose } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
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
      setIsLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  // Periodic polling every 8s so scheduled emails transitioning to sent reflect automatically
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BullMQ Queue • Redis AOF Persistence • Rate Limited</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Email Scheduling Control Center
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Schedule future email dispatches with durable queue recovery, bounded retries, and instant
              Ethereal sandbox previews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Live Auto-Refresh (every 8s)"
            >
              <Zap className={`w-3.5 h-3.5 ${autoRefresh ? 'fill-emerald-400' : ''}`} />
              <span>Auto-Sync: {autoRefresh ? 'ON' : 'OFF'}</span>
            </button>

            <button
              id="hero-schedule-btn"
              onClick={onOpenCompose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Email</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Emails"
          value={stats?.total ?? 0}
          icon={Mail}
          color="indigo"
          subtitle="All scheduled & sent"
        />
        <StatCard
          title="Scheduled"
          value={stats?.scheduled ?? 0}
          icon={Clock}
          color="sky"
          subtitle="Awaiting trigger in queue"
        />
        <StatCard
          title="Processing"
          value={stats?.processing ?? 0}
          icon={Activity}
          color="amber"
          subtitle="Active in worker"
        />
        <StatCard
          title="Sent"
          value={stats?.sent ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Delivered to Ethereal"
        />
        <StatCard
          title="Failed"
          value={stats?.failed ?? 0}
          icon={AlertCircle}
          color="rose"
          subtitle="Attempts exhausted"
        />
      </div>

      {/* Email Table */}
      <EmailTable
        title="Recent Email Activity"
        emails={emails}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchDashboardData}
        onPageChange={(newPage) => setPage(newPage)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onViewDetails={onViewDetails}
        onCancelEmail={onCancelEmail}
      />
    </div>
  );
}
