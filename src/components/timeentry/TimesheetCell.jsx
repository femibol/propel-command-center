import React, { useState, useRef } from 'react';

export default function TimesheetCell({ value, onChange, isModified }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef(null);

  function handleClick() {
    setEditing(true);
    setLocalValue(value > 0 ? String(value) : '');
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleBlur() {
    setEditing(false);
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed >= 0) {
      // Round to nearest 0.25
      const rounded = Math.round(parsed * 4) / 4;
      onChange(rounded);
    } else if (localValue === '') {
      onChange(0);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Tab') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.25"
        min="0"
        max="24"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full h-full bg-[#242836] border border-accent text-center text-sm text-[#E8E9ED] font-mono focus:outline-none rounded px-1 py-1"
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`w-full h-full flex items-center justify-center cursor-pointer rounded px-1 py-1 text-sm font-mono transition-colors ${
        value > 0
          ? isModified
            ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
            : 'text-[#E8E9ED] bg-[#1A1D27] hover:bg-[#242836]'
          : 'text-[#5C6178] hover:bg-[#1A1D27]'
      }`}
      title={isModified ? `Modified (original: ${value})` : undefined}
    >
      {value > 0 ? value.toFixed(2).replace(/\.?0+$/, '') : '—'}
    </div>
  );
}
