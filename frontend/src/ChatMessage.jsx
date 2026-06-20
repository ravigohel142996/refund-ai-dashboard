import React from 'react';

/**
 * Single chat bubble — user or assistant.
 * type: "user" | "assistant" | "error"
 */
export default function ChatMessage({ message }) {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`message-enter flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
          ${isUser
            ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'
            : isError
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white'}
        `}
      >
        {isUser ? 'You' : isError ? '!' : 'AI'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'bg-gradient-to-br from-blue-600 to-violet-700 text-white rounded-br-sm shadow-lg shadow-blue-900/30'
              : isError
                ? 'bg-red-900/30 text-red-300 border border-red-500/20 rounded-bl-sm'
                : 'glass text-slate-200 rounded-bl-sm'}
          `}
        >
          {message.content}
        </div>

        {/* Decision badge — only on agent responses */}
        {message.decision && (
          <DecisionBadge decision={message.decision} reasoning={message.reasoning} />
        )}

        {/* Reasoning steps accordion */}
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

  return (
    <div className={`
      mt-1 px-3 py-2 rounded-xl text-xs font-medium border
      ${approved
        ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/25'
        : isError
          ? 'bg-red-900/30 text-red-300 border-red-500/25'
          : 'bg-amber-900/30 text-amber-300 border-amber-500/25'}
    `}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${approved ? 'bg-emerald-400' : isError ? 'bg-red-400' : 'bg-amber-400'}`} />
        <span className="font-semibold">Decision: {decision}</span>
      </div>
      {reasoning && reasoning.length > 0 && (
        <ul className="mt-1 space-y-0.5 opacity-80">
          {reasoning.map((r, i) => (
            <li key={i} className="flex gap-1">
              <span>→</span>
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
    <div className="mt-1 w-full">
      <button
        id="toggle-reasoning-steps"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {open ? 'Hide' : 'Show'} agent steps ({steps.length})
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-slate-800/50 text-[11px]">
              <StatusDot status={step.status} />
              <div className="min-w-0">
                <span className="text-slate-300 font-medium capitalize">
                  {step.step_name.replace(/_/g, ' ')}
                </span>
                <p className="text-slate-500 truncate">{step.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    success:  'bg-emerald-400',
    error:    'bg-red-400',
    fallback: 'bg-amber-400',
  };
  return (
    <span className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${colors[status] ?? 'bg-slate-400'}`} />
  );
}
