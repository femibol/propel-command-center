import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAllBoards } from '../hooks/useBoards';
import { getColumnText } from '../utils/helpers';
import { SUBITEM_COLUMNS } from '../utils/constants';
import StatusBadge from './StatusBadge';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const { data } = useAllBoards();

  const results = useMemo(() => {
    if (!query.trim() || !data?.allSubitems) return [];
    const q = query.toLowerCase();
    return data.allSubitems
      .filter(sub => {
        const name = (sub.name || '').toLowerCase();
        const parent = (sub._parentName || '').toLowerCase();
        const client = (sub._clientName || '').toLowerCase();
        const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS).toLowerCase();
        const cpProject = getColumnText(sub, SUBITEM_COLUMNS.CP_PROJECT).toLowerCase();
        return name.includes(q) || parent.includes(q) || client.includes(q) ||
          status.includes(q) || cpProject.includes(q);
      })
      .slice(0, 20);
  }, [query, data]);

  // Global / shortcut
  useEffect(() => {
    function handleGlobalKey(e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen]);

  // Arrow key navigation in results
  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  }

  function handleSelect(sub) {
    // Scroll to item or expand it - for now just close search
    setIsOpen(false);
    setQuery('');
    // Could dispatch a navigation event or use a callback
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-[#1A1D27] border border-[#2E3348] rounded-lg px-3 py-1.5">
        <Search size={14} className="text-[#5C6178] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks... ( / )"
          className="bg-transparent text-sm text-[#E8E9ED] placeholder-[#5C6178] focus:outline-none w-64"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="text-[#5C6178] hover:text-[#E8E9ED]">
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2E3348] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.map((sub, i) => (
            <button
              key={sub.id}
              onClick={() => handleSelect(sub)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                i === selectedIndex ? 'bg-[#242836]' : 'hover:bg-[#242836]/50'
              }`}
            >
              <span className="text-xs font-mono text-[#8B8FA3] w-8 shrink-0">{sub._clientShort}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[#E8E9ED] truncate">{sub.name}</p>
                <p className="text-xs text-[#5C6178] truncate">{sub._parentName}</p>
              </div>
              <StatusBadge status={getColumnText(sub, SUBITEM_COLUMNS.STATUS)} />
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D27] border border-[#2E3348] rounded-lg shadow-xl z-50 p-4 text-center">
          <p className="text-sm text-[#5C6178]">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}
