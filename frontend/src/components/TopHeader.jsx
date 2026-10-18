import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Plus, Zap, ChevronRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';

export function TopHeader({ onToggleSidebar, onOpenCompose, autoRefresh, onToggleAutoRefresh }) {
  const location = useLocation();

  const getBreadcrumbs = () => {
    switch (location.pathname) {
      case '/scheduled':
        return { category: 'Queue', page: 'Scheduled' };
      case '/sent':
        return { category: 'Deliveries', page: 'Sent Emails' };
      case '/failed':
        return { category: 'Dead Letter', page: 'Failed Queue' };
      case '/':
      default:
        return { category: 'Overview', page: 'Dashboard' };
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Open mobile navigation"
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            {breadcrumbs.category}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
            {breadcrumbs.page}
          </span>
        </div>
      </div>

      {/* Right: Actions & Theme Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Auto sync pill */}
        {onToggleAutoRefresh && (
          <button
            type="button"
            onClick={onToggleAutoRefresh}
            title={`Auto-Sync: ${autoRefresh ? 'Enabled (8s interval)' : 'Paused'}`}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoRefresh ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-400'}`} />
            <span>{autoRefresh ? 'Live Sync' : 'Sync Paused'}</span>
          </button>
        )}

        {/* Theme switcher */}
        <ThemeToggle />

        {/* Schedule Email Button */}
        <button
          id="header-compose-btn"
          onClick={onOpenCompose}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Schedule Email</span>
          <span className="sm:hidden">Compose</span>
        </button>
      </div>
    </header>
  );
}
