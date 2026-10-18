import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  ExternalLink,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
} from 'lucide-react';

export function EmailTable({
  emails = [],
  pagination = {},
  isLoading = false,
  error = null,
  onRefresh,
  onPageChange,
  searchTerm = '',
  onSearchChange,
  statusFilter = '',
  onStatusFilterChange,
  onViewDetails,
  onCancelEmail,
  title = 'Emails',
  showStatusFilter = true,
}) {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'queued', label: 'Queued' },
    { value: 'processing', label: 'Processing' },
    { value: 'sent', label: 'Sent' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400">
            {pagination.total !== undefined ? `${pagination.total} total records found` : 'Manage your queued and sent emails'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipient or subject..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          {showStatusFilter && (
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 outline-none transition-all"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh table"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5">Recipient</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Scheduled For</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Dispatched / Created</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-5">
                    <div className="h-4 w-32 bg-slate-800 rounded mb-1" />
                    <div className="h-3 w-20 bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-44 bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-slate-800 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="h-7 w-16 bg-slate-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                      <Inbox className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-slate-300 text-sm">No emails found</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {searchTerm
                        ? `No results matching "${searchTerm}". Try a different keyword.`
                        : 'No scheduled or sent emails match the current view.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => {
                const canCancel = email.status === 'scheduled' || email.status === 'queued';
                return (
                  <tr
                    key={email._id}
                    className="hover:bg-slate-900/40 transition-colors group cursor-pointer"
                    onClick={() => onViewDetails(email)}
                  >
                    <td className="py-3.5 px-5 font-medium text-white max-w-[200px] truncate">
                      <span className="font-mono text-indigo-300">{email.recipient}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-[260px] truncate font-medium">
                      {email.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {formatDate(email.scheduledAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {email.sentAt ? formatDate(email.sentAt) : formatDate(email.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ethereal Preview Button */}
                        {email.etherealPreviewUrl && (
                          <a
                            href={email.etherealPreviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Preview in Ethereal Email"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => onViewDetails(email)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel Button */}
                        {canCancel && (
                          <button
                            onClick={() => onCancelEmail(email._id)}
                            title="Cancel Scheduled Email"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-white">{pagination.page}</span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
