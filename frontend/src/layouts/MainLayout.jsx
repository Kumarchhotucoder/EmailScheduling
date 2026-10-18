import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { ComposeModal } from '../components/ComposeModal.jsx';
import { EmailDetailModal } from '../components/EmailDetailModal.jsx';
import { emailService } from '../services/emailService.js';
import { Info, ExternalLink } from 'lucide-react';

export function MainLayout() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenCompose = () => setIsComposeOpen(true);
  const handleCloseCompose = () => setIsComposeOpen(false);

  const handleEmailScheduled = () => {
    // Increment trigger to notify active child views to refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewDetails = (email) => {
    setSelectedEmail(email);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedEmail(null);
  };

  const handleCancelEmail = async (emailId) => {
    await emailService.cancelEmail(emailId);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar onOpenCompose={handleOpenCompose} />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet
          context={{
            refreshTrigger,
            triggerRefresh: () => setRefreshTrigger((prev) => prev + 1),
            onViewDetails: handleViewDetails,
            onCancelEmail: handleCancelEmail,
            onOpenCompose: handleOpenCompose,
          }}
        />
      </main>

      {/* Footer & Ethereal Sandbox Notice */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              <strong className="text-slate-400">Ethereal Email Notice:</strong> Emails are captured in an isolated test
              sandbox for preview and are never dispatched to real recipients.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://ethereal.email"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <span>Ethereal Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span>BullMQ Delayed Queue</span>
          </div>
        </div>
      </footer>

      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={handleCloseCompose}
        onEmailScheduled={handleEmailScheduled}
      />

      {/* Email Details Modal */}
      <EmailDetailModal
        email={selectedEmail}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onCancelEmail={handleCancelEmail}
      />
    </div>
  );
}
