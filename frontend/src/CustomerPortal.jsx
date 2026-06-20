import { useState, useEffect, useRef } from 'react';
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
    content = gemini_explanation;
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
/* CustomerPortal                                                     */
/* ------------------------------------------------------------------ */
export default function CustomerPortal() {
  const [messages, setMessages] = useState([buildWelcomeMessage()]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'ok' | 'error' | 'checking'
  const bottomRef = useRef(null);
  const chatRef   = useRef(null);

  /* Check backend health on mount */
  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('error'));
  }, []);

  /* Auto-scroll on new messages */
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
        {
          id: Date.now() + 2,
          type: 'error',
          content: `Connection error: ${err.message}`,
          time: nowTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function clearHistory() {
    setMessages([buildWelcomeMessage()]);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-2xl flex flex-col" style={{ height: 'min(90vh, 700px)' }}>

        {/* Header */}
        <div className="glass-strong rounded-t-3xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-none">RefundAI</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">AI-Powered Support</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend status pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium
              ${backendStatus === 'ok'
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/20'
                : backendStatus === 'error'
                  ? 'bg-red-900/40 text-red-400 border border-red-500/20'
                  : 'bg-slate-800 text-slate-500 border border-white/5'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'ok' ? 'bg-emerald-400 animate-pulse' :
                backendStatus === 'error' ? 'bg-red-400' : 'bg-slate-500'
              }`} />
              {backendStatus === 'ok' ? 'Live' : backendStatus === 'error' ? 'Offline' : 'Connecting'}
            </div>

            {/* Clear button */}
            <button
              id="clear-history-btn"
              onClick={clearHistory}
              title="Clear chat history"
              className="w-8 h-8 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-900/40 backdrop-blur-sm"
        >
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Info banner (shown when backend is offline) */}
        {backendStatus === 'error' && (
          <div className="bg-red-900/30 border-t border-red-500/20 px-5 py-2.5 flex items-center gap-2 text-xs text-red-300">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Backend is offline. Check <code className="mx-1 font-mono bg-red-900/50 px-1 rounded">https://refund-ai-dashboard.onrender.com/health</code>
          </div>
        )}

        {/* Input */}
        <div className="rounded-b-3xl overflow-hidden">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>

      {/* Footer */}
      <p className="relative mt-4 text-[10px] text-slate-700 text-center">
        Refund decisions are made by policy validation — AI provides a natural-language summary only.
      </p>
    </div>
  );
}
