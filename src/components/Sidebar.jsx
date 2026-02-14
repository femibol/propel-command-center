import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Clock,
  Calendar,
  FileCheck,
  Timer,
  ListChecks,
  Bell,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Sweep', countKey: 'total' },
  { to: '/stale', icon: AlertTriangle, label: 'Stale', countKey: 'stale' },
  { to: '/waiting', icon: Clock, label: 'Waiting', countKey: 'waiting' },
  { to: '/planner', icon: Calendar, label: 'Planner', countKey: null },
  { to: '/cp-check', icon: FileCheck, label: 'CP Check', countKey: 'cpMissing' },
  { to: '/time-entry', icon: Timer, label: 'Time Entry', countKey: null },
  { to: '/daily', icon: ListChecks, label: 'Daily', countKey: null },
  { to: '/notifications', icon: Bell, label: 'Notifications', countKey: null },
];

export default function Sidebar({ counts = {} }) {
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
            {countKey && counts[countKey] > 0 && (
              <span className="text-xs font-mono bg-[#2E3348] text-[#8B8FA3] rounded-full px-2 py-0.5 min-w-[24px] text-center">
                {counts[countKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-[#2E3348] py-2">
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
