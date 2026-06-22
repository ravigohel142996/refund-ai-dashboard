import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { sendRefundRequest, checkHealth } from './api';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildWelcomeMessage() {
  return {
    id: 'welcome',
    type: 'assistant',
    content: "Hi! I'm your AI support assistant. Tell me about your refund request and provide your Customer ID and Order ID — I'll check it against our policy instantly.",
    time: nowTime(),
  };
}

function buildUserMessage(text) {
  return { id: Date.now(), type: 'user', content: text, time: nowTime() };
}

function buildAgentMessage(data) {
  const { decision, reasoning, agent_reasoning_logs, gemini_explanation } = data;
  const approved = decision === 'Approved';
  const isError  = decision === 'Error';

  let content;
  if (gemini_explanation) {
    if (Array.isArray(gemini_explanation)) {
      content = gemini_explanation.find(item => typeof item === 'string') ?? '';
    } else {
      content = gemini_explanation;
    }
  } else if (approved) {
    content = "Great news — your refund request has been approved! You'll receive a confirmation shortly, and funds will be returned within 5–7 business days.";
  } else if (isError) {
    content = `I wasn't able to process your request. ${reasoning?.[0] ?? 'Please check your Customer ID and Order ID.'}`;
  } else {
    content = `Unfortunately your refund request has been denied based on our current policy.`;
  }

  return {
    id: Date.now() + 1,
    type: isError ? 'error' : 'assistant',
    content,
    decision,
    reasoning,
    steps: agent_reasoning_logs ?? [],
    time: nowTime(),
  };
}

/* ------------------------------------------------------------------ */
/* CustomerPortal                                                       */
/* ------------------------------------------------------------------ */
export default function CustomerPortal() {
  const [messages, setMessages] = useState([buildWelcomeMessage()]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const bottomRef = useRef(null);
  const chatRef   = useRef(null);

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('error'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend({ message, customerId, orderId }) {
    setMessages(prev => [...prev, buildUserMessage(message)]);
    setIsLoading(true);
    try {
      const data = await sendRefundRequest(customerId, orderId, message);
      setMessages(prev => [...prev, buildAgentMessage(data)]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 2, type: 'error', content: `Connection error: ${err.message}`, time: nowTime() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function clearHistory() {
    setMessages([buildWelcomeMessage()]);
  }

  const statusConfig = {
    ok:       { label: 'Live',        dot: 'bg-emerald-400 animate-pulse', cls: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' },
    error:    { label: 'Offline',     dot: 'bg-red-400',                   cls: 'bg-red-500/10 border-red-500/25 text-red-400' },
    checking: { label: 'Connecting',  dot: 'bg-amber-400 animate-pulse',   cls: 'bg-amber-500/10 border-amber-500/25 text-amber-400' },
  }[backendStatus];

  return (
    <div className="min-h-screen bg-[#050917] flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* ── Background scene ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-orb absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[140px]" />
        <div className="float-orb-delay absolute top-1/2 -right-40 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Admin shortcut ── */}
      <div className="relative z-10 w-full max-w-2xl flex justify-end mb-3">
        <Link
          to="/admin"
          id="nav-admin-panel"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-[11px] font-medium text-slate-500 hover:text-indigo-300 hover:border-indigo-500/30 border border-white/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
          Admin Panel
        </Link>
      </div>

      {/* ── Main chat card ── */}
      <div className="relative w-full max-w-2xl flex flex-col z-10" style={{ height: 'min(88vh, 720px)' }}>

        {/* ── Header ── */}
        <div className="glass-strong rounded-t-3xl px-6 py-4 flex items-center justify-between border-b-0">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-700 flex items-center justify-center shadow-xl shadow-indigo-900/50">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none tracking-tight">RefundAI</h1>
              <p className="text-[11px] mt-0.5 gradient-text-blue font-medium">AI-Powered Support</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Backend status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${statusConfig.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </div>

            {/* Clear button */}
            <button
              id="clear-history-btn"
              onClick={clearHistory}
              title="Clear chat history"
              className="w-8 h-8 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all group border border-white/5"
            >
              <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Divider with gradient ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* ── Messages area ── */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-5 space-y-5"
          style={{ background: 'rgba(5, 9, 23, 0.6)', backdropFilter: 'blur(8px)' }}
        >
          {/* Top badge */}
          <div className="flex justify-center">
            <div className="px-3 py-1 rounded-full glass text-[10px] text-slate-500 border border-white/5 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              End-to-end secure · Policy-governed decisions
            </div>
          </div>

          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* ── Offline warning ── */}
        {backendStatus === 'error' && (
          <div className="bg-red-900/20 border-t border-red-500/15 px-5 py-2.5 flex items-center gap-2 text-xs text-red-300">
            <svg className="w-4 h-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Backend offline. Start with{' '}
            <code className="ml-1 font-mono bg-red-900/40 px-1.5 py-0.5 rounded text-red-200">
              uvicorn main:app --reload
            </code>
          </div>
        )}

        {/* ── Input ── */}
        <div className="rounded-b-3xl overflow-hidden">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Footer ── */}
      <p className="relative mt-4 text-[10px] text-slate-700 text-center z-10">
        Refund decisions are made by policy validation — AI provides a natural-language summary only.
      </p>
    </div>
  );
}
