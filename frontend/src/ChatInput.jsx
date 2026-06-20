import { useState } from 'react';

const QUICK_MESSAGES = [
  "I want a refund for my order",
  "My product arrived damaged",
  "I'd like to return this item",
  "Can I get a refund?",
];

/**
 * Chat input bar with customer ID, order ID, quick-reply chips, and send button.
 */
export default function ChatInput({ onSend, isLoading }) {
  const [message, setMessage] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [showFields, setShowFields] = useState(false);

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
    <div className="border-t border-white/5 bg-slate-900/60 backdrop-blur-md p-4 space-y-3">
      {/* Quick-reply chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_MESSAGES.map((q) => (
          <button
            key={q}
            id={`quick-${q.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => handleQuick(q)}
            className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-slate-400 hover:border-blue-500/50 hover:text-blue-300 hover:bg-blue-900/20 transition-all"
          >
            {q}
          </button>
        ))}
        <button
          onClick={() => setShowFields(s => !s)}
          className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-slate-500 hover:text-slate-300 transition-all flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showFields ? 'Hide details' : 'Add details'}
        </button>
      </div>

      {/* Customer / Order ID fields */}
      {showFields && (
        <div className="flex gap-2">
          <input
            id="customer-id-input"
            type="text"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            placeholder="Customer ID (e.g. C001)"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
          />
          <input
            id="order-id-input"
            type="text"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="Order ID (e.g. ORD001)"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all"
          />
        </div>
      )}

      {/* Message input row */}
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
            placeholder="Describe your issue or paste your refund request…"
            rows={1}
            className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-800/70 border border-white/10 text-slate-200 placeholder-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500/40 focus:bg-slate-800 transition-all leading-relaxed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        <button
          id="send-button"
          type="submit"
          disabled={!canSend}
          className={`
            flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all
            ${canSend
              ? 'bg-gradient-to-br from-blue-600 to-violet-700 hover:from-blue-500 hover:to-violet-600 shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95'
              : 'bg-slate-800 cursor-not-allowed opacity-40'}
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

      {/* Hint */}
      {!customerId && !orderId && (
        <p className="text-[10px] text-slate-600 text-center">
          Click a quick reply or type your message — then add your Customer & Order IDs
        </p>
      )}
    </div>
  );
}
