import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  LogOut,
  Mail,
  X,
  Radio,
  Zap,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose, onOpenCompose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Scheduled', path: '/scheduled', icon: Clock },
    { name: 'Sent Emails', path: '/sent', icon: CheckCircle2 },
    { name: 'Failed Queue', path: '/failed', icon: AlertCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Logo Header */}
        <div className="h-16 px-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                Email<span className="text-indigo-600 dark:text-indigo-400">Scheduler</span>
              </span>
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono tracking-wider uppercase font-semibold">
                BullMQ • Ethereal
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button (Compose) */}
        <div className="p-4 pb-2">
          <button
            id="sidebar-compose-btn"
            onClick={() => {
              onOpenCompose();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-sm shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule Email</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700/60 font-semibold shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 px-3 pb-1.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Queue Engine
          </div>
          <div className="mx-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">BullMQ Active</span>
            </div>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Rate: 5/min • Concurrency: 2
            </p>
          </div>
        </nav>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
