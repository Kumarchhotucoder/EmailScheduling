import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { Mail, Lock, LogIn, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionExpired = new URLSearchParams(location.search).get('session_expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@scheduler.dev');
    setPassword('SchedulerDemo123!');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* Top Bar with Brand & Theme Switcher */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading font-bold text-sm tracking-tight">
            Email<span className="text-indigo-600 dark:text-indigo-400">Scheduler</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Centered Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-zinc-100 tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Access your email dispatch queues and worker analytics
          </p>
        </div>

        <div className="saas-card p-6 sm:p-8 space-y-5">
          {sessionExpired && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
              <span>Your session expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-zinc-200 dark:border-zinc-800 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Fill Demo Credentials (demo@scheduler.dev)</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-600 dark:text-zinc-400 mt-5">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md mx-auto text-center text-[11px] text-zinc-600 dark:text-zinc-400 pb-2">
        BullMQ Queue • MongoDB • Redis AOF • Ethereal SMTP
      </div>
    </div>
  );
}
