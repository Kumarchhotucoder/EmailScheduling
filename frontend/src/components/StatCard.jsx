import React from 'react';

export function StatCard({ title, value, icon: Icon, color = 'indigo', subtitle }) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  const currentStyle = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{value ?? 0}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3.5 rounded-xl border ${currentStyle} transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
