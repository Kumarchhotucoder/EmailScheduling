import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { MainLayout } from './layouts/MainLayout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Scheduled } from './pages/Scheduled.jsx';
import { Sent } from './pages/Sent.jsx';
import { Failed } from './pages/Failed.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-medium tracking-wide">Authenticating session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Layout & Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/scheduled" element={<Scheduled />} />
        <Route path="/sent" element={<Sent />} />
        <Route path="/failed" element={<Failed />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
