import React from 'react';

export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'indigo',
  subtitle,
  isLoading = false,
}) {
  const colorMap = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60',
      pill: 'bg-indigo-500',
    },
    sky: {
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60',
      pill: 'bg-sky-500',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
      pill: 'bg-emerald-500',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60',
      pill: 'bg-rose-500',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60',
      pill: 'bg-amber-500',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  if (isLoading) {
    return (
      <div className="saas-card p-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-2 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mt-3" />
      </div>
    );
  }

  return (
    <div className="saas-card saas-card-interactive p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 tracking-wider uppercase">
            {title}
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-heading tracking-tight mt-1 tabular-nums">
            {value ?? 0}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-2.5 rounded-xl border ${scheme.iconBg} transition-transform group-hover:scale-105 flex-shrink-0`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
