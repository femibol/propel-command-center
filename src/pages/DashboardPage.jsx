import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair, AlertTriangle, Clock, Zap, Timer, Target,
  TrendingUp, ArrowRight,
} from 'lucide-react';
import { useSweepData } from '../hooks/useBoards';
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

  // Sort clients by item count
  const sortedClients = Object.entries(byClient || {})
    .sort((a, b) => b[1].length - a[1].length);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[#E8E9ED]">Dashboard</h2>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-4 h-24 animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
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

      {/* AI Insights */}
      <AIInsightsPanel />

      {/* KPI Row */}
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
