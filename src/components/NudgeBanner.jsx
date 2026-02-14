import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import useNudges from '../hooks/useNudges';

const STYLES = {
  warning: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    icon: AlertCircle,
    iconColor: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    icon: Info,
    iconColor: 'text-blue-400',
  },
};

export default function NudgeBanner({ page, onAction }) {
  const nudge = useNudges(page);
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    const key = `nudge-dismissed-${page}-${new Date().toISOString().slice(0, 10)}`;
    return sessionStorage.getItem(key) === 'true';
  });

  if (!nudge || dismissed) return null;

  const style = STYLES[nudge.type] || STYLES.info;
  const Icon = style.icon;

  function handleDismiss() {
    const key = `nudge-dismissed-${page}-${new Date().toISOString().slice(0, 10)}`;
    sessionStorage.setItem(key, 'true');
    setDismissed(true);
  }

  function handleAction() {
    if (nudge.actionTo) {
      navigate(nudge.actionTo);
    } else if (nudge.actionId && onAction) {
      onAction(nudge.actionId);
    }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${style.bg} border-b ${style.border}`}>
      <Icon size={14} className={style.iconColor + ' shrink-0'} />
      <span className={`text-xs ${style.text} flex-1`}>{nudge.text}</span>
      {nudge.actionLabel && (
        <button
          onClick={handleAction}
          className="text-xs font-medium text-accent hover:text-blue-400 transition-colors shrink-0"
        >
          {nudge.actionLabel}
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="p-0.5 text-[#5C6178] hover:text-[#E8E9ED] transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}
