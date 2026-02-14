import React, { useState, useEffect } from 'react';
import { ACTIVE_BOARDS, TEAM_MEMBER } from '../utils/constants';
import { MONDAY_API_TOKEN } from '../api/config';
import { useToast } from '../contexts/ToastContext';

export default function SettingsPage() {
  const tokenConfigured = !!MONDAY_API_TOKEN && MONDAY_API_TOKEN !== 'your_monday_api_token_here';
  const [timelyStatus, setTimelyStatus] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const { addToast } = useToast();

  function refreshHealth() {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setAiStatus(data))
      .catch(() => setAiStatus({ error: 'Backend not running' }));
  }

  useEffect(() => {
    // Check Timely DB status
    fetch('/api/timely/stats')
      .then(res => res.json())
      .then(data => setTimelyStatus(data))
      .catch(() => setTimelyStatus({ error: 'Cannot connect to backend' }));

    refreshHealth();
  }, []);

  async function saveApiKey() {
    if (!apiKeyInput.trim()) return;
    setAiSaving(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(`API key saved: ${data.preview}`, 'success');
      setApiKeyInput('');
      refreshHealth();
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error');
    } finally {
      setAiSaving(false);
    }
  }

  async function testAI() {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/settings/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiTestResult({ success: true, message: data.response });
      addToast('AI connection test passed!', 'success');
    } catch (err) {
      setAiTestResult({ success: false, message: err.message });
      addToast(`AI test failed: ${err.message}`, 'error');
    } finally {
      setAiTesting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-[#E8E9ED]">Settings</h2>

      {/* API Status */}
      <div className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[#E8E9ED]">API Configuration</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${tokenConfigured ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-sm text-[#8B8FA3]">
            Monday.com API Token: {tokenConfigured ? 'Configured' : 'Not configured'}
          </span>
        </div>
        {!tokenConfigured && (
          <div className="bg-[#0F1117] rounded p-3 text-xs text-[#8B8FA3] space-y-1">
            <p className="text-yellow-400 font-medium">Setup required:</p>
            <p>1. Copy <code className="bg-[#2E3348] px-1 rounded">.env.example</code> to <code className="bg-[#2E3348] px-1 rounded">.env</code></p>
            <p>2. Add your Monday.com API token</p>
            <p>3. Get your token from: Monday.com &rarr; Profile &rarr; Developers &rarr; My Access Tokens</p>
            <p>4. Restart the dev server</p>
          </div>
        )}
      </div>

      {/* Timely Memory DB Status */}
      <div className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[#E8E9ED]">Timely Memory Database</h3>
        {timelyStatus === null ? (
          <p className="text-xs text-[#5C6178]">Checking connection...</p>
        ) : timelyStatus.error ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-red-400">{timelyStatus.error}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-[#8B8FA3]">Connected</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#8B8FA3]">
              <div>
                <span className="text-[#5C6178]">Total entries:</span>{' '}
                {timelyStatus.totalEntries?.toLocaleString() || '—'}
              </div>
              <div>
                <span className="text-[#5C6178]">Date range:</span>{' '}
                {timelyStatus.dateRange?.earliest || '—'} to {timelyStatus.dateRange?.latest || '—'}
              </div>
              <div>
                <span className="text-[#5C6178]">DB path:</span>{' '}
                <code className="bg-[#2E3348] px-1 rounded text-[10px]">{timelyStatus.dbPath || '—'}</code>
              </div>
              <div>
                <span className="text-[#5C6178]">Distinct apps:</span>{' '}
                {timelyStatus.distinctApps || '—'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Features Status */}
      <div className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#E8E9ED]">AI Features (Anthropic Claude)</h3>

        {/* Status indicator */}
        {aiStatus === null ? (
          <p className="text-xs text-[#5C6178]">Checking status...</p>
        ) : aiStatus.error ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-red-400">{aiStatus.error}</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${aiStatus.ai ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm text-[#8B8FA3]">
                {aiStatus.ai ? 'API key configured' : 'No API key set'}
              </span>
            </div>
            {aiStatus.ai && aiStatus.aiKeyPreview && (
              <p className="text-[10px] text-[#5C6178] font-mono ml-4">{aiStatus.aiKeyPreview}</p>
            )}
          </div>
        )}

        {/* API Key input */}
        <div className="space-y-2">
          <label className="text-xs text-[#5C6178] block">
            {aiStatus?.ai ? 'Update Anthropic API Key:' : 'Enter your Anthropic API Key:'}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="flex-1 bg-[#0F1117] border border-[#2E3348] rounded px-3 py-2 text-sm text-[#E8E9ED] placeholder-[#3E4255] focus:outline-none focus:border-accent font-mono"
              onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
            />
            <button
              onClick={saveApiKey}
              disabled={aiSaving || !apiKeyInput.trim()}
              className="px-4 py-2 bg-accent text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {aiSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-[#5C6178]">
            Get your key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">console.anthropic.com</a>. Key is stored in server memory for this session.
          </p>
        </div>

        {/* Test button */}
        <div className="flex items-center gap-3">
          <button
            onClick={testAI}
            disabled={aiTesting || !aiStatus?.ai}
            className="px-4 py-2 bg-[#2E3348] text-[#E8E9ED] rounded text-sm hover:bg-[#3E4255] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {aiTesting ? 'Testing...' : 'Test Connection'}
          </button>
          {aiTestResult && (
            <span className={`text-xs ${aiTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {aiTestResult.success ? '✓ ' : '✗ '}{aiTestResult.message}
            </span>
          )}
        </div>

        <p className="text-xs text-[#5C6178]">
          AI powers: follow-up suggestions, daily task prioritization, time block matching, and AI insights.
        </p>
      </div>

      {/* Team Member */}
      <div className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[#E8E9ED]">Team Member Filter</h3>
        <p className="text-xs text-[#5C6178]">
          Currently filtering tasks for: <span className="text-[#E8E9ED] font-medium">{TEAM_MEMBER}</span>
        </p>
        <p className="text-xs text-[#5C6178]">
          To change, edit <code className="bg-[#2E3348] px-1 rounded">TEAM_MEMBER</code> in{' '}
          <code className="bg-[#2E3348] px-1 rounded">src/utils/constants.js</code>
        </p>
      </div>

      {/* Active Boards */}
      <div className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[#E8E9ED]">Active PROPEL Boards</h3>
        <p className="text-xs text-[#5C6178]">
          These boards are queried during the morning sweep. Edit{' '}
          <code className="bg-[#2E3348] px-1 rounded">src/utils/constants.js</code> to modify.
        </p>
        <div className="space-y-1.5">
          {ACTIVE_BOARDS.map((board) => (
            <div
              key={board.id}
              className="flex items-center gap-3 text-xs text-[#8B8FA3] py-1"
            >
              <span className="font-mono text-[#5C6178] w-28">{board.id}</span>
              <span className="font-medium text-[#E8E9ED] w-8">{board.shortName}</span>
              <span>{board.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-5 space-y-2">
        <h3 className="text-sm font-semibold text-[#E8E9ED]">About</h3>
        <p className="text-xs text-[#8B8FA3]">
          PROPEL Command Center v3.5 — AI Coach Edition.
        </p>
        <p className="text-xs text-[#5C6178]">
          Consolidates Monday.com PROPEL boards into a single task management dashboard
          with Timely time tracking integration, AI Coach (streaming), proactive nudges, morning briefings, and automated time entry.
        </p>
      </div>
    </div>
  );
}
