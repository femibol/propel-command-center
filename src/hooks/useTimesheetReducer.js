import { useReducer, useCallback } from 'react';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

function calculateTotals(rows) {
  const totals = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, total: 0 };
  for (const row of rows) {
    for (const day of DAYS) {
      totals[day] += row.hours[day] || 0;
    }
  }
  totals.total = DAYS.reduce((sum, d) => sum + totals[d], 0);
  // Round
  for (const key of [...DAYS, 'total']) {
    totals[key] = Math.round(totals[key] * 100) / 100;
  }
  return totals;
}

function timesheetReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE': {
      const rows = action.payload.rows.map(row => ({
        ...row,
        isManual: false,
        isModified: false,
        originalHours: { ...row.hours },
      }));
      return {
        ...state,
        rows,
        unmatched: action.payload.unmatched || [],
        totals: calculateTotals(rows),
        initialized: true,
      };
    }

    case 'SET_HOURS': {
      const { rowId, day, hours } = action.payload;
      const rows = state.rows.map(row => {
        if (row.id !== rowId) return row;
        const newHours = { ...row.hours, [day]: parseFloat(hours) || 0 };
        return { ...row, hours: newHours, isModified: true };
      });
      return { ...state, rows, totals: calculateTotals(rows) };
    }

    case 'ADD_ROW': {
      const { task, client, clientShort } = action.payload;
      const newRow = {
        id: `manual-${Date.now()}`,
        task,
        client: client || task?._clientName || 'Manual',
        clientShort: clientShort || task?._clientShort || '???',
        projectName: task?.name || 'New Task',
        parentName: task?._parentName || '',
        hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 },
        sources: [],
        isManual: true,
        isModified: false,
        originalHours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 },
      };
      const rows = [...state.rows, newRow];
      return { ...state, rows, totals: calculateTotals(rows) };
    }

    case 'REMOVE_ROW': {
      const rows = state.rows.filter(r => r.id !== action.payload.rowId);
      return { ...state, rows, totals: calculateTotals(rows) };
    }

    case 'ASSIGN_UNMATCHED': {
      const { blockId, rowId } = action.payload;
      const block = state.unmatched.find(b => b.id === blockId);
      if (!block) return state;

      const unmatched = state.unmatched.filter(b => b.id !== blockId);
      const rows = state.rows.map(row => {
        if (row.id !== rowId) return row;
        const day = getDayFromDate(block.day);
        if (!day) return row;
        const newHours = { ...row.hours, [day]: (row.hours[day] || 0) + block.durationHours };
        return { ...row, hours: newHours, sources: [...row.sources, block], isModified: true };
      });

      return { ...state, rows, unmatched, totals: calculateTotals(rows) };
    }

    case 'CLEAR': {
      return {
        rows: [],
        unmatched: [],
        totals: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, total: 0 },
        initialized: false,
      };
    }

    default:
      return state;
  }
}

function getDayFromDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const map = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
  return map[day] || null;
}

export function useTimesheetReducer() {
  const [state, dispatch] = useReducer(timesheetReducer, {
    rows: [],
    unmatched: [],
    totals: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, total: 0 },
    initialized: false,
  });

  const initialize = useCallback((data) => dispatch({ type: 'INITIALIZE', payload: data }), []);
  const setHours = useCallback((rowId, day, hours) => dispatch({ type: 'SET_HOURS', payload: { rowId, day, hours } }), []);
  const addRow = useCallback((task, client, clientShort) => dispatch({ type: 'ADD_ROW', payload: { task, client, clientShort } }), []);
  const removeRow = useCallback((rowId) => dispatch({ type: 'REMOVE_ROW', payload: { rowId } }), []);
  const assignUnmatched = useCallback((blockId, rowId) => dispatch({ type: 'ASSIGN_UNMATCHED', payload: { blockId, rowId } }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  return {
    ...state,
    initialize,
    setHours,
    addRow,
    removeRow,
    assignUnmatched,
    clear,
  };
}
