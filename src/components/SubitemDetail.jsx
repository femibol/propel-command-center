import React, { useState } from 'react';
import { CheckCircle, MessageSquare, Send } from 'lucide-react';
import { SUBITEM_COLUMNS, ALL_STATUSES, TERMINAL_STATUSES } from '../utils/constants';
import { getColumnText, formatDate, daysSince, isWaiting, getWaitingOn } from '../utils/helpers';
import { useStatusMutation, usePostUpdate } from '../hooks/useBoards';
import AISuggestionButton from './AISuggestionButton';
import { useToast } from '../contexts/ToastContext';

export default function SubitemDetail({ subitem }) {
  const [updateText, setUpdateText] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const { addToast } = useToast();

  const statusMutation = useStatusMutation();
  const postUpdateMutation = usePostUpdate();

  const status = getColumnText(subitem, SUBITEM_COLUMNS.STATUS);
  const priority = getColumnText(subitem, SUBITEM_COLUMNS.PRIORITY);
  const pctComplete = getColumnText(subitem, SUBITEM_COLUMNS.PERCENT_COMPLETE);
  const team = getColumnText(subitem, SUBITEM_COLUMNS.NAW_TEAM);
  const clientTeam = getColumnText(subitem, SUBITEM_COLUMNS.CLIENT_TEAM);
  const details = getColumnText(subitem, SUBITEM_COLUMNS.DETAILS);
  const type = getColumnText(subitem, SUBITEM_COLUMNS.TYPE);
  const module = getColumnText(subitem, SUBITEM_COLUMNS.MODULE);
  const estHours = getColumnText(subitem, SUBITEM_COLUMNS.ESTIMATED_TIME);
  const cpProject = getColumnText(subitem, SUBITEM_COLUMNS.CP_PROJECT);
  const cpTask = getColumnText(subitem, SUBITEM_COLUMNS.CP_TASK);
  const devTaskId = getColumnText(subitem, SUBITEM_COLUMNS.DEV_TASK_ID);
  const estWip = getColumnText(subitem, SUBITEM_COLUMNS.EST_WIP);

  function handleStatusChange(newStatus) {
    if (!subitem._subitemBoardId) {
      alert('Cannot update: subitem board ID not available. Try refreshing.');
      return;
    }
    statusMutation.mutate({
      subitemBoardId: subitem._subitemBoardId,
      itemId: subitem.id,
      newStatus,
    });
    setShowStatusMenu(false);
  }

  function handleMarkDone() {
    handleStatusChange('Done');
  }

  function handlePostUpdate() {
    if (!updateText.trim()) return;
    postUpdateMutation.mutate(
      { itemId: subitem.id, body: updateText },
      {
        onSuccess: () => { setUpdateText(''); addToast('Update posted', 'success'); },
        onError: () => addToast('Failed to post update', 'error'),
      }
    );
  }

  function handleAISuggestion(suggestion) {
    setUpdateText(suggestion);
    addToast('AI suggestion loaded', 'info');
  }

  return (
    <div className="bg-[#1A1D27] border-t border-[#2E3348] px-6 py-4 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#E8E9ED]">{subitem.name}</h3>
          <p className="text-xs text-[#5C6178] mt-0.5">
            Parent: {subitem._parentName} · Board: {subitem._clientName}
            {subitem._parentGroup !== 'Unknown' && ` · Group: ${subitem._parentGroup}`}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={handleMarkDone}
            disabled={statusMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/40 rounded text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            <CheckCircle size={12} />
            Mark Done
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
        <Detail label="Status">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="text-left hover:underline cursor-pointer"
            >
              {status} ▾
            </button>
            {showStatusMenu && (
              <div className="absolute top-6 left-0 z-50 bg-[#242836] border border-[#2E3348] rounded shadow-lg max-h-60 overflow-y-auto w-52">
                {ALL_STATUSES.filter((s) => !TERMINAL_STATUSES.includes(s)).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="block w-full text-left px-3 py-1.5 text-xs text-[#E8E9ED] hover:bg-[#2E3348] transition-colors"
                  >
                    {s}
                  </button>
                ))}
                <hr className="border-[#2E3348] my-1" />
                {TERMINAL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="block w-full text-left px-3 py-1.5 text-xs text-[#8B8FA3] hover:bg-[#2E3348] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Detail>
        <Detail label="Priority">{priority || '—'}</Detail>
        <Detail label="% Complete">{pctComplete ? `${pctComplete}%` : '—'}</Detail>
        <Detail label="Est. Hours">{estHours || '—'}</Detail>

        <Detail label="NAW Team">{team || '—'}</Detail>
        <Detail label="Client Team">{clientTeam || '—'}</Detail>
        <Detail label="Type">{type || '—'}</Detail>
        <Detail label="Module">{module || '—'}</Detail>

        <Detail label="Est. WIP">{estWip || '—'}</Detail>
        <Detail label="Last Updated">{formatDate(subitem.updated_at)} ({daysSince(subitem.updated_at)}d ago)</Detail>
        <Detail label="Dev Task">{devTaskId || '(none)'}</Detail>
        <Detail label="">&nbsp;</Detail>
      </div>

      {/* ChangePoint mapping */}
      <div className="bg-[#0F1117] rounded p-3 space-y-1">
        <p className="text-xs font-medium text-[#8B8FA3] uppercase tracking-wide mb-1">ChangePoint Mapping</p>
        <p className="text-xs font-mono text-[#E8E9ED]">
          <span className="text-[#5C6178]">CP Project:</span>{' '}
          {cpProject || <span className="text-red-400">⚠ Missing</span>}
        </p>
        <p className="text-xs font-mono text-[#E8E9ED]">
          <span className="text-[#5C6178]">CP Task:</span>{' '}
          {cpTask || <span className="text-red-400">⚠ Missing</span>}
        </p>
      </div>

      {/* Details text */}
      {details && (
        <div className="bg-[#0F1117] rounded p-3">
          <p className="text-xs font-medium text-[#8B8FA3] uppercase tracking-wide mb-1">Details</p>
          <p className="text-sm text-[#E8E9ED] whitespace-pre-wrap leading-relaxed">{details}</p>
        </div>
      )}

      {/* Post update */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#8B8FA3] uppercase tracking-wide">Post Update</p>
          <AISuggestionButton
            subitem={{ name: subitem.name, _clientName: subitem._clientName }}
            context={{ status, daysSinceUpdate: daysSince(subitem.updated_at), waitingOn: getWaitingOn(status) }}
            onSuggestion={handleAISuggestion}
          />
        </div>
        <div className="flex gap-2">
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="Type your update here... (or use AI Suggest)"
            className="flex-1 bg-[#0F1117] border border-[#2E3348] rounded px-3 py-2 text-sm text-[#E8E9ED] placeholder-[#5C6178] resize-none focus:outline-none focus:border-accent h-16"
          />
          <button
            onClick={handlePostUpdate}
            disabled={!updateText.trim() || postUpdateMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 self-end"
          >
            <Send size={12} />
            Post
          </button>
        </div>
      </div>

      {statusMutation.isError && (
        <p className="text-xs text-red-400">Status update failed: {statusMutation.error?.message}</p>
      )}
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <span className="text-xs text-[#5C6178]">{label}</span>
      <div className="text-sm text-[#E8E9ED]">{children}</div>
    </div>
  );
}
