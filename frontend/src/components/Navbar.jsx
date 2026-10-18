import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';

export function Navbar({ onOpenCompose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Scheduled', path: '/scheduled', icon: Clock },
    { name: 'Sent', path: '/sent', icon: CheckCircle2 },
    { name: 'Failed', path: '/failed', icon: AlertCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  Email<span className="text-indigo-400 font-extrabold">Scheduler</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  BullMQ • Ethereal
                </span>
              </div>
            </NavLink>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              id="compose-email-btn"
              onClick={onOpenCompose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Schedule Email</span>
              <span className="sm:hidden">Compose</span>
            </button>

            {/* User Dropdown / Info */}
            <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-slate-200 truncate max-w-[120px]">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
            <div className="pt-2 mt-2 border-t border-slate-800/80 px-3 text-xs text-slate-500 flex justify-between items-center">
              <span>{user?.email}</span>
              <button onClick={handleLogout} className="text-rose-400 hover:underline">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
