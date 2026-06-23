import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  const cfg = map[status] || { cls: 'status-neutral', dot: 'bg-slate-300', label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
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
  const denied   = data.decision === 'Denied';

  return (
    <div
      className="card-subtle rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200 group message-enter"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Accent bar */}
      <div className={`h-0.5 w-full ${
        approved ? 'accent-bar-approved' :
        denied   ? 'accent-bar-denied'   :
                   'accent-bar-neutral'
      }`} />

      {/* Header */}
      <div
        className="px-4 sm:px-5 py-3.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
            approved ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
            : denied  ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-500'
          }`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">{data.customer_id}</span>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 hidden sm:inline">
                {data.order_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate">
              <span className="font-mono sm:hidden text-indigo-500">{data.order_id}</span>
              <span className="hidden sm:flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {data.agent_reasoning_logs?.length ?? 0} tool executions
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <StatusBadge status={data.decision} />
          <div className={`w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Logs */}
      {expanded && (
        <div className="expand-enter border-t border-slate-100 bg-slate-50/50">
          <div className="px-4 sm:px-5 pb-5 pt-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Execution Trace
            </h4>
            <div className="space-y-2">
              {data.agent_reasoning_logs?.map((log, i) => (
                <div key={i} className="flex gap-2 sm:gap-3 relative">
                  {i !== data.agent_reasoning_logs.length - 1 && (
                    <div className="absolute top-8 bottom-[-8px] left-[14px] sm:left-[15px] w-px timeline-line" />
                  )}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 flex items-center justify-center z-10 border ${
                    log.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : log.status === 'error' ? 'bg-red-50 border-red-200 text-red-500'
                                             : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    <StepIcon stepName={log.step_name} />
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-sm min-w-0">
                    <div className="flex items-start sm:items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] text-indigo-600">
                          {log.step_name?.replace(/_/g, ' ')}
                        </span>
                        <StatusBadge status={log.status} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{log.details}</p>
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
function StatCard({ label, value, icon, colorClass, bgClass }) {
  return (
    <div className="stat-card flex items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
        <div className={colorClass}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Dashboard                                                      */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const [requests, setRequests]     = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    sessionStorage.removeItem('admin_auth');
    navigate('/admin/login');
  }

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
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
          setRequests((prev) => {
            const exists = prev.some(r =>
              r.customer_id === data.customer_id &&
              r.order_id === data.order_id &&
              r.decision === data.decision
            );
            if (exists) return prev;
            return [data, ...prev];
          });
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
      r.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.decision?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 text-slate-800 font-sans relative overflow-x-hidden">

      {/* ── Background blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-orb absolute -top-32 left-[10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-100/40 rounded-full blur-[100px]" />
        <div className="float-orb-delay absolute top-1/3 right-[5%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-violet-100/30 rounded-full blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50">
        <div className="nav-surface px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between max-w-7xl mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">RefundAI</h1>
              <p className="text-[10px] gradient-text font-semibold leading-none mt-0.5">Admin Console</p>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
              isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <span className="relative flex h-2 w-2">
                {isConnected && <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </span>
              {isConnected ? 'Live' : 'Reconnecting…'}
            </div>

            <Link
              to="/"
              id="nav-customer-portal"
              className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Customer Portal
            </Link>

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="px-4 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          {/* Mobile: status dot + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500"
            >
              {mobileMenuOpen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 expand-enter shadow-lg">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border w-full ${
              isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isConnected ? 'WebSocket Live' : 'Reconnecting…'}
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 border border-slate-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Customer Portal
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 border border-red-200 w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">

        {/* ── Page heading ── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-600 border border-indigo-200 uppercase tracking-wider">
              Real-time
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Agent Decision <span className="gradient-text">Monitor</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Live feed of AI refund decisions, tool executions, and policy evaluations.
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            label="Total Requests"
            value={requests.length}
            bgClass="bg-indigo-50 border border-indigo-100"
            colorClass="text-indigo-600"
            icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard
            label="Approved"
            value={approvedCount}
            bgClass="bg-emerald-50 border border-emerald-100"
            colorClass="text-emerald-600"
            icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Denied"
            value={deniedCount}
            bgClass="bg-red-50 border border-red-100"
            colorClass="text-red-500"
            icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Approval Rate"
            value={requests.length > 0 ? `${Math.round((approvedCount / requests.length) * 100)}%` : '—'}
            bgClass="bg-violet-50 border border-violet-100"
            colorClass="text-violet-600"
            icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="admin-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Customer ID, Order ID or status…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl input-field text-sm"
            />
          </div>

          <div className="flex bg-white rounded-xl p-1 gap-1 border border-slate-200 shadow-sm">
            {['all', 'approved', 'denied'].map(f => (
              <button
                key={f}
                id={`filter-${f}`}
                onClick={() => setFilter(f)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
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
            <div className="text-center py-16 sm:py-24 card rounded-3xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1.5">
                {requests.length === 0 ? 'Awaiting requests…' : 'No results found'}
              </h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto px-4">
                {requests.length === 0
                  ? 'New AI agent decisions will appear here in real-time.'
                  : 'Try adjusting your search or filter.'}
              </p>
              {!isConnected && (
                <p className="mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Backend disconnected — reconnecting…
                </p>
              )}
            </div>
          ) : (
            filtered.map((req, i) => <RequestCard key={`${req.customer_id}-${req.order_id}-${i}`} data={req} index={i} />)
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-12 sm:mt-16 border-t border-slate-200 py-5 sm:py-6 text-center px-4">
        <p className="text-xs text-slate-400">
          RefundAI Admin Console · Real-time AI Agent Monitoring
        </p>
      </footer>
    </div>
  );
}
