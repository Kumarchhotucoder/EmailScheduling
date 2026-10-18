import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { formatDate, formatTimeRelative } from '../utils/formatters.js';
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
  Plus,
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
  onOpenCompose,
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
    <div className="saas-card overflow-hidden">
      {/* Table Toolbar Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold font-heading text-zinc-900 dark:text-zinc-100 tracking-tight">
            {title}
          </h2>
          {pagination.total !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
              {pagination.total}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipient or subject..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          {showStatusFilter && (
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 focus:border-indigo-500 outline-none transition-all"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900">
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh list"
            aria-label="Refresh table data"
            className="p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="m-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <th className="py-3 px-5">Recipient</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Scheduled For</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Dispatched / Created</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/50 text-xs">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-5">
                    <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded mb-1" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-zinc-500 dark:text-zinc-400">
                    <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400">
                      <Inbox className="w-7 h-7" />
                    </div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">No emails found</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm">
                      {searchTerm
                        ? `No results matching "${searchTerm}". Try a different search.`
                        : 'No scheduled or sent emails exist in this view.'}
                    </p>
                    {onOpenCompose && !searchTerm && (
                      <button
                        onClick={onOpenCompose}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule an Email</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => {
                const canCancel = email.status === 'scheduled' || email.status === 'queued';
                return (
                  <tr
                    key={email._id}
                    onClick={() => onViewDetails(email)}
                    className="hover:bg-zinc-50/90 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-5 font-medium text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{email.recipient}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 max-w-[260px] truncate font-medium">
                      {email.subject}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      <span>{formatDate(email.scheduledAt)}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {email.sentAt ? formatDate(email.sentAt) : formatDate(email.createdAt)}
                    </td>
                    <td
                      className="py-3 px-5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ethereal Preview Button */}
                        {email.etherealPreviewUrl && (
                          <a
                            href={email.etherealPreviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Ethereal Sandbox Preview"
                            aria-label="Preview in Ethereal"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => onViewDetails(email)}
                          title="View Details"
                          aria-label="View email details"
                          className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel Button */}
                        {canCancel && (
                          <button
                            onClick={() => onCancelEmail(email._id)}
                            title="Cancel Scheduled Email"
                            aria-label="Cancel scheduled email"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800/60 transition-colors"
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

      {/* Mobile Card Layout (< 768px) */}
      <div className="block md:hidden divide-y divide-zinc-200/80 dark:divide-zinc-800/70">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="p-4 space-y-2 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <Inbox className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
            <p className="text-xs font-medium">No emails found</p>
          </div>
        ) : (
          emails.map((email) => {
            const canCancel = email.status === 'scheduled' || email.status === 'queued';
            return (
              <div
                key={email._id}
                onClick={() => onViewDetails(email)}
                className="p-4 space-y-2.5 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {email.recipient}
                  </span>
                  <StatusBadge status={email.status} />
                </div>
                <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                  {email.subject}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1">
                  <span>{formatDate(email.scheduledAt)}</span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {email.etherealPreviewUrl && (
                      <a
                        href={email.etherealPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onViewDetails(email)}
                      className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => onCancelEmail(email._id)}
                        className="p-1 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-3.5 sm:p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <div>
            Page <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pagination.page}</span> of{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              aria-label="Previous page"
              className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-zinc-900 dark:text-zinc-100">{pagination.page}</span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              aria-label="Next page"
              className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
