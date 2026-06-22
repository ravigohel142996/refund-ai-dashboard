import React from 'react';

/**
 * Single chat bubble — user or assistant.
 * type: "user" | "assistant" | "error"
 */
export default function ChatMessage({ message }) {
  const isUser  = message.type === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`message-enter flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>

      {/* ── Avatar ── */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shadow-lg
        ${isUser
          ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-blue-900/40'
          : isError
            ? 'bg-red-500/15 text-red-400 border border-red-500/25'
            : 'bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-violet-900/40'}
      `}>
        {isUser ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        ) : isError ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </div>

      {/* ── Bubble ── */}
      <div className={`max-w-[80%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-gradient-to-br from-blue-600 to-violet-700 text-white rounded-br-sm shadow-lg shadow-blue-900/30'
            : isError
              ? 'bg-red-900/20 text-red-300 border border-red-500/20 rounded-bl-sm'
              : 'glass text-slate-200 rounded-bl-sm'}
        `}>
          {message.content}
        </div>

        {/* Decision badge */}
        {message.decision && (
          <DecisionBadge decision={message.decision} reasoning={message.reasoning} />
        )}

        {/* Agent steps */}
        {message.steps && message.steps.length > 0 && (
          <ReasoningSteps steps={message.steps} />
        )}

        <span className="text-[10px] text-slate-600 px-1">{message.time}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decision badge                                                       */
/* ------------------------------------------------------------------ */
function DecisionBadge({ decision, reasoning }) {
  const approved = decision === 'Approved';
  const isError  = decision === 'Error';

  const cls = approved
    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
    : isError
      ? 'bg-red-500/10 text-red-300 border-red-500/25'
      : 'bg-amber-500/10 text-amber-300 border-amber-500/25';

  const dot = approved ? 'bg-emerald-400' : isError ? 'bg-red-400' : 'bg-amber-400';

  return (
    <div className={`mt-0.5 px-3 py-2.5 rounded-xl text-xs border ${cls}`}>
      <div className="flex items-center gap-1.5 font-semibold mb-1">
        <span className={`w-2 h-2 rounded-full ${dot} ${approved ? 'animate-pulse' : ''}`} />
        Decision: {decision}
      </div>
      {reasoning && reasoning.length > 0 && (
        <ul className="space-y-0.5 opacity-80 text-[11px] pl-3.5">
          {reasoning.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-slate-500 flex-shrink-0">›</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reasoning steps accordion                                            */
/* ------------------------------------------------------------------ */
function ReasoningSteps({ steps }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mt-0.5 w-full">
      <button
        id="toggle-reasoning-steps"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-indigo-300 transition-colors group"
      >
        <div className={`w-4 h-4 rounded glass border border-white/8 flex items-center justify-center transition-all ${open ? 'border-indigo-500/30' : ''}`}>
          <svg
            className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        {open ? 'Hide' : 'Show'} agent trace ({steps.length} steps)
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 expand-enter">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl glass border border-white/5 text-[11px]">
              <StatusDot status={step.status} />
              <div className="min-w-0">
                <span className="text-slate-300 font-medium capitalize block">
                  {step.step_name?.replace(/_/g, ' ')}
                </span>
                <p className="text-slate-500 leading-snug mt-0.5 truncate">{step.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    success:  'bg-emerald-400',
    error:    'bg-red-400',
    fallback: 'bg-amber-400',
  };
  return (
    <span className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${map[status] ?? 'bg-slate-400'}`} />
  );
}
