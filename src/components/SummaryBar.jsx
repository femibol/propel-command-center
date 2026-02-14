import React from 'react';
import { Activity, AlertTriangle, Clock, FileCheck, RefreshCw } from 'lucide-react';
import { timeSinceRefresh } from '../utils/helpers';

export default function SummaryBar({ counts, lastRefresh, onRefresh, isRefreshing }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-[#1A1D27] border-b border-[#2E3348]">
      <Stat icon={<Activity size={14} />} label="Active" value={counts.total} color="text-blue-400" />
      <Stat icon={<AlertTriangle size={14} />} label="High" value={counts.high} color="text-orange-400" />
      <Stat icon={<Clock size={14} />} label="Waiting" value={counts.waiting} color="text-purple-400" />
      <Stat icon={<AlertTriangle size={14} />} label="Stale" value={counts.stale} color="text-yellow-400" />
      <Stat icon={<FileCheck size={14} />} label="CP Missing" value={counts.cpMissing} color="text-red-400" />

      <div className="flex-1" />

      <span className="text-xs text-[#5C6178] font-mono">
        Last: {timeSinceRefresh(lastRefresh)}
      </span>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-accent border border-accent/40 rounded text-xs font-medium hover:bg-accent/30 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>
  );
}

function Stat({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className={color}>{icon}</span>
      <div className="text-xs">
        <span className={`font-bold text-base ${color}`}>{value}</span>
        <span className="text-[#5C6178] ml-1">{label}</span>
      </div>
    </div>
  );
}
