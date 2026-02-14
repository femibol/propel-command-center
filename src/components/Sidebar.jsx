import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  AlertTriangle,
  Clock,
  Calendar,
  FileCheck,
  Timer,
  ListChecks,
  Bell,
  Settings,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { useAICoach } from '../contexts/AICoachContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', countKey: null },
  { to: '/sweep', icon: Crosshair, label: 'Sweep', countKey: 'total' },
  { to: '/quick-wins', icon: Zap, label: 'Quick Wins', countKey: 'quickWins', badgeColor: 'bg-green-500/30 text-green-400' },
  { to: '/stale', icon: AlertTriangle, label: 'Stale', countKey: 'stale' },
  { to: '/waiting', icon: Clock, label: 'Waiting', countKey: 'waiting' },
  { to: '/planner', icon: Calendar, label: 'Planner', countKey: null },
  { to: '/cp-check', icon: FileCheck, label: 'CP Check', countKey: 'cpMissing' },
  { to: '/time-entry', icon: Timer, label: 'Time Entry', countKey: null },
  { to: '/daily', icon: ListChecks, label: 'Daily', countKey: null },
  { to: '/notifications', icon: Bell, label: 'Notifications', countKey: null },
];

function SkeletonBadge() {
  return (
    <span className="w-7 h-5 rounded-full bg-[#2E3348] animate-pulse" />
  );
}

export default function Sidebar({ counts }) {
  const { isOpen, toggleCoach } = useAICoach();
  const isLoading = !counts;

  return (
    <aside className="w-56 bg-[#1A1D27] border-r border-[#2E3348] flex flex-col h-full shrink-0">
      {/* Logo/Title */}
      <div className="px-5 py-5 border-b border-[#2E3348]">
        <h1 className="text-sm font-bold text-[#E8E9ED] tracking-wide uppercase">PROPEL</h1>
        <p className="text-xs text-[#5C6178] mt-0.5">Command Center</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, countKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border-r-2 border-accent'
                  : 'text-[#8B8FA3] hover:text-[#E8E9ED] hover:bg-[#242836]'
              }`
            }
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {countKey && isLoading && <SkeletonBadge />}
            {countKey && !isLoading && (counts[countKey] || 0) > 0 && (
              <span className="text-xs font-mono bg-[#2E3348] text-[#8B8FA3] rounded-full px-2 py-0.5 min-w-[24px] text-center">
                {counts[countKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[#2E3348] py-2">
        {/* AI Coach toggle */}
        <button
          onClick={toggleCoach}
          className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors w-full ${
            isOpen
              ? 'bg-accent/10 text-accent'
              : 'text-[#5C6178] hover:text-[#8B8FA3] hover:bg-[#242836]'
          }`}
        >
          <Sparkles size={16} className={isOpen ? 'animate-pulse' : ''} />
          <span className="flex-1 text-left">AI Coach</span>
          <kbd className="text-[9px] text-[#5C6178] bg-[#0F1117] border border-[#2E3348] rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </button>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-[#5C6178] hover:text-[#8B8FA3] hover:bg-[#242836]'
            }`
          }
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
