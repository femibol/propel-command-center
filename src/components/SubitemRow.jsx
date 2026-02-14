import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityDot from './PriorityDot';
import SubitemDetail from './SubitemDetail';
import { SUBITEM_COLUMNS } from '../utils/constants';
import { getColumnText, formatRelative, daysSince, staleColor } from '../utils/helpers';
import { MONDAY_ACCOUNT_SLUG as SLUG } from '../api/config';

export default function SubitemRow({ subitem, showClient = false, showStale = false }) {
  const [expanded, setExpanded] = useState(false);

  const status = getColumnText(subitem, SUBITEM_COLUMNS.STATUS);
  const priority = getColumnText(subitem, SUBITEM_COLUMNS.PRIORITY);
  const pctComplete = getColumnText(subitem, SUBITEM_COLUMNS.PERCENT_COMPLETE);
  const estHours = getColumnText(subitem, SUBITEM_COLUMNS.ESTIMATED_TIME);
  const cpProject = getColumnText(subitem, SUBITEM_COLUMNS.CP_PROJECT);
  const lastUpdated = subitem.updated_at;
  const days = daysSince(lastUpdated);

  return (
    <div className="border-b border-[#2E3348]/50 last:border-b-0">
      <div
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#242836] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand arrow */}
        <div className="text-[#5C6178] w-4 shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {/* Priority */}
        <div className="w-20 shrink-0">
          <PriorityDot priority={priority} />
        </div>

        {/* Client (optional) */}
        {showClient && (
          <span className="w-10 shrink-0 text-xs font-mono text-[#8B8FA3] font-medium">
            {subitem._clientShort}
          </span>
        )}

        {/* Name + Parent */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-[#E8E9ED] truncate block" title={subitem.name}>
            {subitem.name}
          </span>
          <span className="text-xs text-[#5C6178] truncate block hidden lg:block">
            {subitem._parentName}
          </span>
        </div>

        {/* Est Hours */}
        {estHours && (
          <span className="text-xs font-mono text-[#8B8FA3] shrink-0 hidden lg:inline" title="Estimated hours">
            {estHours}h
          </span>
        )}

        {/* CP Indicator */}
        <div
          className={`w-2 h-2 rounded-full shrink-0 hidden lg:block ${cpProject ? 'bg-green-500' : 'bg-red-500'}`}
          title={cpProject ? `CP: ${cpProject}` : 'CP mapping missing'}
        />

        {/* % Complete */}
        {pctComplete && (
          <span className="text-xs font-mono text-[#8B8FA3] w-10 text-right shrink-0">
            {pctComplete}%
          </span>
        )}

        {/* Stale indicator */}
        {showStale && days >= 5 && (
          <span className={`text-xs font-mono w-12 text-right shrink-0 ${staleColor(days)}`}>
            {days}d
          </span>
        )}

        {/* Last updated */}
        <span className="text-xs text-[#5C6178] w-16 text-right shrink-0 font-mono">
          {formatRelative(lastUpdated)}
        </span>

        {/* Status badge */}
        <div className="w-40 shrink-0 text-right">
          <StatusBadge status={status} />
        </div>

        {/* Open in Monday */}
        <a
          href={`https://${SLUG}.monday.com/boards/${subitem._boardId}/pulses/${subitem._parentId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#5C6178] hover:text-accent shrink-0"
          onClick={(e) => e.stopPropagation()}
          title="Open in Monday.com"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Detail panel */}
      {expanded && <SubitemDetail subitem={subitem} />}
    </div>
  );
}
