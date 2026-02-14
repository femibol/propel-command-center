import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.TIMELY_DB_PATH ||
  path.join(process.env.LOCALAPPDATA || '', 'TimelyApp', 'Memory', 'data', 'db.sqlite');

let db = null;

function getDb() {
  if (!db) {
    try {
      db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
      db.pragma('journal_mode = WAL');
      console.log(`Connected to Timely DB at ${DB_PATH}`);
    } catch (err) {
      console.error(`Failed to open Timely DB at ${DB_PATH}:`, err.message);
      return null;
    }
  }
  return db;
}

export function getCapturedEntries(startDate, endDate) {
  const conn = getDb();
  if (!conn) return [];

  const stmt = conn.prepare(`
    SELECT captured_at_with_tz, captured_at_utc, app_name, window_title, details
    FROM captured_entries
    WHERE date(captured_at_utc) >= ? AND date(captured_at_utc) <= ?
    ORDER BY captured_at_utc ASC
  `);

  return stmt.all(startDate, endDate);
}

export function getTimelySettings() {
  const conn = getDb();
  if (!conn) return {};

  const rows = conn.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

export function getEntryStats() {
  const conn = getDb();
  if (!conn) return { count: 0, connected: false };

  const countRow = conn.prepare('SELECT COUNT(*) as count FROM captured_entries').get();
  const minRow = conn.prepare('SELECT MIN(date(captured_at_utc)) as min_date FROM captured_entries').get();
  const maxRow = conn.prepare('SELECT MAX(date(captured_at_utc)) as max_date FROM captured_entries').get();

  return {
    connected: true,
    count: countRow.count,
    minDate: minRow.min_date,
    maxDate: maxRow.max_date,
    dbPath: DB_PATH,
  };
}

export function getAppBreakdown(startDate, endDate) {
  const conn = getDb();
  if (!conn) return [];

  const stmt = conn.prepare(`
    SELECT app_name, COUNT(*) as seconds
    FROM captured_entries
    WHERE date(captured_at_utc) >= ? AND date(captured_at_utc) <= ?
    GROUP BY app_name
    ORDER BY seconds DESC
  `);

  return stmt.all(startDate, endDate).map(row => ({
    app: row.app_name,
    seconds: row.seconds,
    hours: Math.round(row.seconds / 36) / 100, // 2 decimal places
  }));
}

export function getDailyEntries(date) {
  const conn = getDb();
  if (!conn) return [];

  const stmt = conn.prepare(`
    SELECT captured_at_with_tz, captured_at_utc, app_name, window_title, details
    FROM captured_entries
    WHERE date(captured_at_utc) = ?
    ORDER BY captured_at_utc ASC
  `);

  return stmt.all(date);
}
