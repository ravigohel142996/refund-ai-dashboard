import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

function formatRelative(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/* Status Badge                                                         */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }) {
  const map = {
    success:  { cls: 'status-approved', dot: 'bg-emerald-400', label: 'Success' },
    Approved: { cls: 'status-approved', dot: 'bg-emerald-400', label: 'Approved' },
    error:    { cls: 'status-denied',   dot: 'bg-red-400',     label: 'Failed' },
    Denied:   { cls: 'status-denied',   dot: 'bg-red-400',     label: 'Denied' },
  };
  const cfg = map[status] || { cls: 'status-neutral', dot: 'bg-slate-400', label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.cls.includes('approved') ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Step Icon                                                            */
/* ------------------------------------------------------------------ */
function StepIcon({ stepName }) {
  const icons = {
    validate_customer: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    validate_order: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
    check_policy: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
    evaluate_refund: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
  };

  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[stepName] || (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Request Card                                                         */
/* ------------------------------------------------------------------ */
function RequestCard({ data, index }) {
  const [expanded, setExpanded] = useState(false);
  const approved = data.decision === 'Approved';
  const denied = data.decision === 'Denied';

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 group"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Accent bar */}
      <div className={`h-0.5 w-full ${approved ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0' : denied ? 'bg-gradient-to-r from-red-500/0 via-red-500/60 to-red-500/0' : 'bg-gradient-to-r from-slate-500/0 via-slate-500/30 to-slate-500/0'}`} />

      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
            approved
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : denied
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{data.customer_id}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                {data.order_id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {data.agent_reasoning_logs?.length ?? 0} tool executions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={data.decision} />
          <div className={`w-7 h-7 rounded-lg glass flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Logs */}
      {expanded && (
        <div className="expand-enter border-t border-white/5">
          <div className="px-5 pb-5 pt-4">
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Execution Trace
            </h4>

            <div className="space-y-2">
              {data.agent_reasoning_logs?.map((log, i) => (
                <div key={i} className="flex gap-3 relative">
                  {/* Timeline */}
                  {i !== data.agent_reasoning_logs.length - 1 && (
                    <div className="absolute top-8 bottom-[-8px] left-[15px] w-px timeline-line" />
                  )}

                  {/* Node */}
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center z-10 border ${
                    log.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : log.status === 'error'
                        ? 'bg-red-500/10 border-red-500/25 text-red-400'
                        : 'bg-slate-500/10 border-slate-500/25 text-slate-400'
                  }`}>
                    <StepIcon stepName={log.step_name} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-900/50 rounded-xl p-3 border border-white/5 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-indigo-300">
                          {log.step_name?.replace(/_/g, ' ')}
                        </span>
                        <StatusBadge status={log.status} />
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat Card                                                            */
/* ------------------------------------------------------------------ */
function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Dashboard                                                      */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      // In production on Render, VITE_API_URL must be set to the backend service URL.
      // Falls back to localhost for local dev.
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = backendUrl
        .replace(/^https?/, wsProtocol)
        .replace(/^wss?\/\/localhost/, `${wsProtocol}://localhost`) + '/ws/admin';
      ws = new WebSocket(wsUrl);

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setRequests((prev) => [data, ...prev]);
        } catch (e) {
          console.error('Failed to parse websocket message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error', err);
        ws.close();
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const approvedCount = requests.filter(r => r.decision === 'Approved').length;
  const deniedCount   = requests.filter(r => r.decision === 'Denied').length;

  const filtered = requests.filter(r => {
    const matchFilter = filter === 'all' || r.decision?.toLowerCase() === filter;
    const matchSearch = !search ||
      r.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.order_id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#050917] text-slate-300 font-sans relative overflow-x-hidden">

      {/* ── Background scene ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-orb absolute -top-32 left-[10%] w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="float-orb-delay absolute top-1/3 right-[5%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5">
        <div className="glass-strong px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">RefundAI</h1>
              <p className="text-[10px] text-indigo-400 leading-none mt-0.5">Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-red-500/10 border-red-500/25 text-red-400'
            }`}>
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </span>
              {isConnected ? 'Live' : 'Reconnecting…'}
            </div>

            <Link
              to="/"
              id="nav-customer-portal"
              className="px-4 py-1.5 text-xs font-medium text-white glass rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Customer Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">

        {/* ── Page heading ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Real-time
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Agent Decision <span className="gradient-text">Monitor</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Live feed of AI refund decisions, tool executions, and policy evaluations.
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Requests"
            value={requests.length}
            color="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label="Approved"
            value={approvedCount}
            color="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Denied"
            value={deniedCount}
            color="bg-red-500/10 border border-red-500/20 text-red-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Approval Rate"
            value={requests.length > 0 ? `${Math.round((approvedCount / requests.length) * 100)}%` : '—'}
            color="bg-violet-500/10 border border-violet-500/20 text-violet-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="admin-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Customer ID or Order ID…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl input-field text-sm"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex glass rounded-xl p-1 gap-1">
            {['all', 'approved', 'denied'].map(f => (
              <button
                key={f}
                id={`filter-${f}`}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Feed ── */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-24 glass-card rounded-3xl">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">
                {requests.length === 0 ? 'Awaiting requests…' : 'No results found'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {requests.length === 0
                  ? 'New AI agent decisions will appear here in real-time as customers submit requests.'
                  : 'Try adjusting your search or filter to see more results.'}
              </p>
              {!isConnected && (
                <p className="mt-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Backend disconnected — reconnecting…
                </p>
              )}
            </div>
          ) : (
            filtered.map((req, i) => <RequestCard key={i} data={req} index={i} />)
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-white/5 py-6 text-center">
        <p className="text-xs text-slate-600">
          RefundAI Admin Console · Real-time AI Agent Monitoring
        </p>
      </footer>
    </div>
  );
}
