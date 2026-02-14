// Board IDs validated Feb 13, 2026 via live API queries

export const ACTIVE_BOARDS = [
  { id: '7277229518', name: 'United Services Association', shortName: 'USA' },
  { id: '9792115688', name: 'Plain & Fancy', shortName: 'PNF' },
  { id: '9645630795', name: 'Wolverine Ind.', shortName: 'WLV' },
  { id: '7886439284', name: "World's Best Cheeses", shortName: 'WBC' },
  { id: '9444730253', name: 'Attainment Company', shortName: 'ATT' },
  { id: '7239730474', name: 'Sharpline Converting', shortName: 'SHP' },
  { id: '18392167162', name: 'Econo-Pak', shortName: 'EPK' },
  { id: '4950155999', name: 'Baron Francois', shortName: 'BFR' },
  { id: '5282901875', name: 'Olympus Power', shortName: 'OLY' },
  { id: '3288060633', name: 'Mara Technologies', shortName: 'MAR' },
];

export const DEV_BOARD_ID = '1293206994';
export const SUPPORT_BOARD_ID = '1870137983';

export const SUBITEM_COLUMNS = {
  STATUS: 'status__march_2022_',
  PRIORITY: 'priority5',
  PERCENT_COMPLETE: 'numbers',
  NAW_TEAM: 'ps_team',
  CLIENT_TEAM: 'client_team',
  DETAILS: 'details',
  EST_WIP: 'est__wip',
  ESTIMATED_TIME: 'estimated_time',
  TYPE: 'type_',
  MODULE: 'module',
  CP_PROJECT: 'cp_project__1',
  CP_TASK: 'cp_task__1',
  DEV_TASK_ID: 'text1',
  DEV_TASK_LINK: 'link1',
  COMPLETED_DATE: 'date',
};

export const TERMINAL_STATUSES = ['Done', 'Pending Close', 'NA', 'On Hold'];

export const WAITING_STATUSES = [
  'Waiting - Customer',
  'Waiting - Client',
  'Waiting - NAW',
  'Waiting - Dev',
  'Waiting - Tech',
  'Waiting - Sales',
  'Waiting - ISV',
  'Waiting -Acumatica',
  'Waiting - Support',
];

export const ACTIVE_STATUSES = [
  'In Progress',
  'Under Review',
  'Review with Customer',
  'Scoping / Researching',
  'Scheduled',
  'New',
  'Not Started',
  'Estimating',
];

export const ALL_STATUSES = [...ACTIVE_STATUSES, ...WAITING_STATUSES, ...TERMINAL_STATUSES];

export const PRIORITY_ORDER = {
  'System Down': 0,
  'High': 1,
  'Medium': 2,
  'Low': 3,
  '': 4,
};

export const PRIORITY_COLORS = {
  'System Down': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  'High': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' },
  'Medium': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  'Low': { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500' },
};

export const STATUS_COLORS = {
  'In Progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  'Under Review': { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/40' },
  'Review with Customer': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40' },
  'Scoping / Researching': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' },
  'Scheduled': { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/40' },
  'New': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40' },
  'Not Started': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40' },
  'Estimating': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  'Waiting - Customer': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  'Waiting - Client': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  'Waiting - NAW': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Waiting - Dev': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Waiting - Tech': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Waiting - Sales': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Waiting - ISV': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Waiting -Acumatica': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Waiting - Support': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Done': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' },
  'Pending Close': { bg: 'bg-green-500/10', text: 'text-green-300', border: 'border-green-500/30' },
  'On Hold': { bg: 'bg-gray-600/20', text: 'text-gray-500', border: 'border-gray-600/40' },
  'NA': { bg: 'bg-gray-700/20', text: 'text-gray-600', border: 'border-gray-700/40' },
};

export const STALE_THRESHOLD_DAYS = 5;
export const FOLLOWUP_OVERDUE_DAYS = 7;
export const REFRESH_INTERVAL_MS = 300000; // 5 minutes
export const TEAM_MEMBER = 'Femi';
