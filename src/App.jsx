import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import { AICoachProvider } from './contexts/AICoachContext';
import Sidebar from './components/Sidebar';
import GlobalSearch from './components/GlobalSearch';
import AICoachPanel from './components/AICoachPanel';
import AccountabilityBar from './components/AccountabilityBar';
import SweepPage from './pages/SweepPage';
import StalePage from './pages/StalePage';
import WaitingPage from './pages/WaitingPage';
import PlannerPage from './pages/PlannerPage';
import CPCheckPage from './pages/CPCheckPage';
import TimeEntryPage from './pages/TimeEntryPage';
import DailyTasksPage from './pages/DailyTasksPage';
import NotificationsPage from './pages/NotificationsPage';
import QuickWinsPage from './pages/QuickWinsPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { useSweepData } from './hooks/useBoards';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

function AppLayout() {
  const { counts } = useSweepData();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F1117]">
      <Sidebar counts={counts} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-10">
        <div className="px-5 py-2 border-b border-[#2E3348] bg-[#0F1117] flex justify-end">
          <GlobalSearch />
        </div>
        <AccountabilityBar />
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
