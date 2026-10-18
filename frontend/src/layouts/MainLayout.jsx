import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopHeader } from '../components/TopHeader.jsx';
import { ComposeModal } from '../components/ComposeModal.jsx';
import { EmailDetailModal } from '../components/EmailDetailModal.jsx';
import { emailService } from '../services/emailService.js';
import { Info, ExternalLink } from 'lucide-react';

export function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex transition-colors duration-150">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenCompose={handleOpenCompose}
      />

      {/* Main Content Area (Offset for lg:w-64 sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <TopHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCompose={handleOpenCompose}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
        />

        {/* Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet
            context={{
              refreshTrigger,
              triggerRefresh: () => setRefreshTrigger((prev) => prev + 1),
              onViewDetails: handleViewDetails,
              onCancelEmail: handleCancelEmail,
              onOpenCompose: handleOpenCompose,
              autoRefresh,
            }}
          />
        </main>

        {/* Footer & Sandbox Notice */}
        <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-[#0c0c0e]/50 py-5 text-xs text-zinc-500 dark:text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>
                <strong className="text-zinc-700 dark:text-zinc-300 font-medium">Ethereal Sandbox Active:</strong> Test emails are safely intercepted and viewable via preview links.
              </span>
            </div>
            <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
              <a
                href="https://ethereal.email"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <span>Ethereal Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <span className="font-mono text-[11px]">BullMQ Redis Engine</span>
            </div>
          </div>
        </footer>
      </div>

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
