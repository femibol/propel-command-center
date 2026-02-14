import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import { AICoachProvider } from './contexts/AICoachContext';
import Sidebar from './components/Sidebar';
import GlobalSearch from './components/GlobalSearch';
import AICoachPanel from './components/AICoachPanel';
import AccountabilityBar from './components/AccountabilityBar';
import DashboardPage from './pages/DashboardPage';
import { useSweepData } from './hooks/useBoards';

// Lazy-loaded pages — only loaded when navigated to
const SweepPage = lazy(() => import('./pages/SweepPage'));
const StalePage = lazy(() => import('./pages/StalePage'));
const WaitingPage = lazy(() => import('./pages/WaitingPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const CPCheckPage = lazy(() => import('./pages/CPCheckPage'));
const TimeEntryPage = lazy(() => import('./pages/TimeEntryPage'));
const DailyTasksPage = lazy(() => import('./pages/DailyTasksPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const QuickWinsPage = lazy(() => import('./pages/QuickWinsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#5C6178]">Loading...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const { counts } = useSweepData();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F1117]">
      <Sidebar counts={counts} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-5 py-2 border-b border-[#2E3348] bg-[#0F1117] flex justify-end">
          <GlobalSearch />
        </div>
        <AccountabilityBar />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sweep" element={<SweepPage />} />
            <Route path="/quick-wins" element={<QuickWinsPage />} />
            <Route path="/stale" element={<StalePage />} />
            <Route path="/waiting" element={<WaitingPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/cp-check" element={<CPCheckPage />} />
            <Route path="/time-entry" element={<TimeEntryPage />} />
            <Route path="/daily" element={<DailyTasksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
      <AICoachPanel />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AICoachProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </AICoachProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
