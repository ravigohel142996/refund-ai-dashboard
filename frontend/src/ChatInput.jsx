import { useState } from 'react';

const QUICK_MESSAGES = [
  { label: 'Request Refund', text: 'I want a refund for my order' },
  { label: 'Damaged Item', text: 'My product arrived damaged' },
  { label: 'Return Item', text: "I'd like to return this item" },
  { label: 'Get Refund?', text: 'Can I get a refund?' },
];

/**
 * Chat input bar with customer ID, order ID, quick-reply chips, and send button.
 */
export default function ChatInput({ onSend, isLoading }) {
  const [message, setMessage]     = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId]       = useState('');
  const [showFields, setShowFields]  = useState(false);

  const canSend = message.trim() && customerId.trim() && orderId.trim() && !isLoading;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSend) return;
    onSend({ message: message.trim(), customerId: customerId.trim(), orderId: orderId.trim() });
    setMessage('');
  }

  function handleQuick(text) {
    setMessage(text);
    if (!showFields) setShowFields(true);
  }

  return (
    <div className="border-t border-white/5 px-4 pt-3 pb-4 space-y-3"
      style={{ background: 'rgba(5, 9, 23, 0.8)', backdropFilter: 'blur(16px)' }}>

      {/* ── Quick-reply chips ── */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_MESSAGES.map((q) => (
          <button
            key={q.text}
            id={`quick-${q.label.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => handleQuick(q.text)}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/8 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-900/20 transition-all"
          >
            {q.label}
          </button>
        ))}
        <button
          id="toggle-details-btn"
          onClick={() => setShowFields(s => !s)}
          className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15 transition-all flex items-center gap-1"
        >
          <svg className={`w-3 h-3 transition-transform ${showFields ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showFields ? 'Hide IDs' : 'Add IDs'}
        </button>
      </div>

      {/* ── ID Fields ── */}
      {showFields && (
        <div className="flex gap-2 expand-enter">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">CID</span>
            <input
              id="customer-id-input"
              type="text"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              placeholder="e.g. C001"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl input-field text-xs font-mono"
            />
          </div>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-violet-400 uppercase tracking-wider">ORD</span>
            <input
              id="order-id-input"
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="e.g. ORD001"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl input-field text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* ── Message row ── */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="relative flex-1">
          <textarea
            id="message-input"
            value={message}
            onChange={e => {
              setMessage(e.target.value);
              if (!showFields && e.target.value) setShowFields(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe your issue…"
            rows={1}
            className="w-full px-4 py-3 rounded-2xl input-field text-sm resize-none leading-relaxed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          {/* Char hint */}
          {message.length > 0 && (
            <span className="absolute bottom-2.5 right-3 text-[9px] text-slate-600">
              {message.length}
            </span>
          )}
        </div>

        <button
          id="send-button"
          type="submit"
          disabled={!canSend}
          className={`
            flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200
            ${canSend
              ? 'btn-primary hover:scale-105 active:scale-95'
              : 'bg-slate-800/60 cursor-not-allowed opacity-35 border border-white/5'}
          `}
        >
          {isLoading ? (
            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </form>

      {/* ── Hint ── */}
      {!customerId && !orderId && (
        <p className="text-[10px] text-slate-600 text-center">
          Select a quick reply or type · then enter your Customer & Order IDs
        </p>
      )}
    </div>
  );
}
