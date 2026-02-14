import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair, AlertTriangle, Clock, Zap, Timer, Target,
  TrendingUp, ArrowRight, Sparkles, Loader2,
} from 'lucide-react';
import { useSweepData } from '../hooks/useBoards';
import { useAICoach } from '../contexts/AICoachContext';
import { daysSince, getColumnText } from '../utils/helpers';
import { SUBITEM_COLUMNS, FOLLOWUP_OVERDUE_DAYS } from '../utils/constants';
import KPICard from '../components/dashboard/KPICard';
import ClientHealthCard from '../components/dashboard/ClientHealthCard';
import AIInsightsPanel from '../components/AIInsightsPanel';
import SkeletonRow from '../components/SkeletonRow';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    myActive, counts, byClient, highPriority, stale, waiting, quickWins,
    isLoading,
  } = useSweepData();
  const { setPageContext } = useAICoach();

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  // Set page context
  useEffect(() => {
    setPageContext({
      page: 'dashboard',
      clients: Object.keys(byClient || {}),
      data: `Active: ${counts.total}, High: ${counts.high}, Stale: ${counts.stale}, Waiting: ${counts.waiting}, Quick wins: ${counts.quickWins}`,
    });
  }, [counts, byClient, setPageContext]);

  // Sort clients by item count
  const sortedClients = Object.entries(byClient || {})
    .sort((a, b) => b[1].length - a[1].length);

  // Fetch morning briefing (cached per day) — deferred 1.5s so KPIs render first
  useEffect(() => {
    if (!myActive || myActive.length === 0 || isLoading) return;

    const cacheKey = `propel-briefing-${new Date().toISOString().slice(0, 10)}-${myActive.length}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setBriefing(cached);
      return;
    }

    // Defer AI call so dashboard renders first
    const timer = setTimeout(() => {
      setBriefingLoading(true);
      const overdueFollowups = waiting.filter(s => daysSince(s.updated_at) >= FOLLOWUP_OVERDUE_DAYS);
      const nearlyComplete = myActive.filter(s => {
        const pct = parseInt(getColumnText(s, SUBITEM_COLUMNS.PERCENT_COMPLETE)) || 0;
        return pct >= 80;
      });
      const clientNames = Object.keys(byClient || {});
      const topStale = stale.slice(0, 5).map(s => `${s.name} (${s._clientShort}, ${daysSince(s.updated_at)}d stale)`);
      const topHigh = highPriority.slice(0, 5).map(s => `${s.name} (${s._clientShort})`);

      const summary = `Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
Total active items: ${myActive.length}
High priority: ${highPriority.length} — ${topHigh.join(', ')}
Stale (5+ days): ${stale.length} — ${topStale.join(', ')}
Waiting: ${waiting.length}, Overdue follow-ups (7+d): ${overdueFollowups.length}
Quick wins: ${quickWins.length}
Nearly complete (80%+): ${nearlyComplete.length}
Active clients (${clientNames.length}): ${clientNames.join(', ')}`;

      fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.briefing) {
            setBriefing(data.briefing);
            sessionStorage.setItem(cacheKey, data.briefing);
          }
        })
        .catch(() => {})
        .finally(() => setBriefingLoading(false));
    }, 1500);

    return () => clearTimeout(timer);
  }, [myActive?.length, isLoading]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#E8E9ED]">Dashboard</h2>
          <p className="text-xs text-[#5C6178] mt-0.5">Loading your boards...</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-4 h-24 animate-pulse">
              <div className="h-3 w-8 bg-[#2E3348] rounded mb-3" />
              <div className="h-6 w-12 bg-[#2E3348] rounded mb-2" />
              <div className="h-2 w-20 bg-[#2E3348] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-3 h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#E8E9ED]">Dashboard</h2>
          <p className="text-xs text-[#5C6178] mt-0.5">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, Femi.
            You have <span className="text-[#E8E9ED] font-medium">{counts.total} active items</span> across {sortedClients.length} clients.
          </p>
        </div>
      </div>

      {/* KPI Row — renders instantly, no API dependency */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          icon={Crosshair}
          value={counts.total}
          label="Active Items"
          subtitle="Across all boards"
          color="text-blue-400"
          bgColor="bg-blue-500/10"
          onClick={() => navigate('/sweep')}
        />
        <KPICard
          icon={AlertTriangle}
          value={counts.high}
          label="High Priority"
          subtitle={counts.high > 0 ? 'Needs attention' : 'All clear'}
          color={counts.high > 0 ? 'text-red-400' : 'text-green-400'}
          bgColor={counts.high > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}
          onClick={() => navigate('/sweep')}
        />
        <KPICard
          icon={Clock}
          value={counts.stale}
          label="Stale"
          subtitle="5+ days no update"
          color={counts.stale > 0 ? 'text-orange-400' : 'text-green-400'}
          bgColor={counts.stale > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}
          onClick={() => navigate('/stale')}
        />
        <KPICard
          icon={Clock}
          value={counts.waiting}
          label="Waiting"
          subtitle="Blocked on others"
          color="text-purple-400"
          bgColor="bg-purple-500/10"
          onClick={() => navigate('/waiting')}
        />
        <KPICard
          icon={Zap}
          value={counts.quickWins}
          label="Quick Wins"
          subtitle="Can close fast"
          color="text-green-400"
          bgColor="bg-green-500/10"
          onClick={() => navigate('/quick-wins')}
        />
        <KPICard
          icon={Target}
          value={counts.cpMissing}
          label="CP Missing"
          subtitle="Needs mapping"
          color={counts.cpMissing > 0 ? 'text-yellow-400' : 'text-green-400'}
          bgColor={counts.cpMissing > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}
          onClick={() => navigate('/cp-check')}
        />
      </div>

      {/* Morning Briefing — deferred, loads after KPIs */}
      {(briefing || briefingLoading) && (
        <div className="bg-[#1A1D27] border border-accent/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-[#E8E9ED]">Morning Briefing</h3>
            <span className="text-[10px] text-[#5C6178]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          {briefingLoading ? (
            <div className="flex items-center gap-2 text-xs text-[#5C6178]">
              <Loader2 size={12} className="animate-spin" />
              Preparing your briefing...
            </div>
          ) : (
            <p className="text-xs text-[#C8C9CD] leading-relaxed whitespace-pre-wrap">{briefing}</p>
          )}
        </div>
      )}

      {/* AI Insights */}
      <AIInsightsPanel />

      {/* Client Health Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-[#8B8FA3]" />
          <h3 className="text-sm font-semibold text-[#E8E9ED]">Client Health</h3>
          <span className="text-[10px] text-[#5C6178]">{sortedClients.length} active clients</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {sortedClients.map(([clientName, items]) => (
            <ClientHealthCard
              key={clientName}
              clientName={clientName}
              shortName={items[0]?._clientShort || '???'}
              items={items}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-[#E8E9ED] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Morning Sweep', desc: 'Review all active items', icon: Crosshair, to: '/sweep', color: 'text-blue-400' },
            { label: 'Quick Wins', desc: `Knock out ${counts.quickWins} items`, icon: Zap, to: '/quick-wins', color: 'text-green-400' },
            { label: 'Time Entry', desc: 'Log hours from Timely', icon: Timer, to: '/time-entry', color: 'text-yellow-400' },
            { label: 'Stale Items', desc: `${counts.stale} need updates`, icon: AlertTriangle, to: '/stale', color: 'text-orange-400' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex items-center gap-3 bg-[#1A1D27] border border-[#2E3348] rounded-lg p-3.5 hover:border-accent/50 hover:bg-[#242836] transition-all text-left group"
            >
              <action.icon size={18} className={action.color} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#E8E9ED]">{action.label}</p>
                <p className="text-[10px] text-[#5C6178]">{action.desc}</p>
              </div>
              <ArrowRight size={14} className="text-[#2E3348] group-hover:text-accent transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
