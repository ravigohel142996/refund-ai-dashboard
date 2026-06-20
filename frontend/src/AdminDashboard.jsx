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

function StatusBadge({ status }) {
  if (status === 'success' || status === 'Approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        {status === 'success' ? 'Success' : 'Approved'}
      </span>
    );
  }
  if (status === 'error' || status === 'Denied') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
        {status === 'error' ? 'Failed' : 'Denied'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-500/10 text-slate-400 text-xs font-medium border border-slate-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Components                                                           */
/* ------------------------------------------------------------------ */
function RequestCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-white/10 group">
      {/* Header (Always visible) */}
      <div 
        className="px-6 py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white">Customer: {data.customer_id}</h3>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">Order: {data.order_id}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data.agent_reasoning_logs.length} tool executions recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={data.decision} />
          <svg 
            className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Logs */}
      <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-6 pt-0 border-t border-white/5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-4">Execution Logs</h4>
            <div className="space-y-4">
              {data.agent_reasoning_logs.map((log, index) => (
                <div key={index} className="flex gap-4 relative">
                  {/* Timeline line */}
                  {index !== data.agent_reasoning_logs.length - 1 && (
                    <div className="absolute top-6 bottom-[-16px] left-[11px] w-[2px] bg-slate-800"></div>
                  )}
                  
                  {/* Node icon */}
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-400' : log.status === 'error' ? 'bg-red-400' : 'bg-slate-400'}`}></div>
                  </div>

                  {/* Log Content */}
                  <div className="flex-1 bg-slate-800/30 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                          {log.step_name}
                        </span>
                        <StatusBadge status={log.status} />
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws/admin');

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setRequests((prev) => [data, ...prev]);
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-300 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Admin Dashboard
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                BETA
              </span>
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Real-time monitoring of AI Agent refund decisions and tool executions.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/5 backdrop-blur-md">
              <div className="relative flex h-2.5 w-2.5">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </div>
              <span className="text-xs font-medium text-slate-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <Link 
              to="/" 
              className="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            >
              Customer Portal
            </Link>
          </div>
        </div>

        {/* Content Feed */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 border border-white/5 rounded-3xl border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Waiting for requests...</h3>
              <p className="text-sm text-slate-500">
                New AI agent executions will appear here in real-time.
              </p>
            </div>
          ) : (
            requests.map((req, i) => <RequestCard key={i} data={req} />)
          )}
        </div>
      </div>
    </div>
  );
}
