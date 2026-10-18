import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { Mail, Lock, User, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Registration failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
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
            Create an account
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Get started with production email scheduling and BullMQ worker queue
          </p>
        </div>

        <div className="saas-card p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-email"
                  type="email"
                  placeholder="jane@company.com"
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
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-600 dark:text-zinc-400 mt-5">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Sign in
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
