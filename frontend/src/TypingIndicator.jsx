/**
 * Animated typing indicator shown while the AI is processing.
 */
export default function TypingIndicator() {
  return (
    <div className="message-enter flex gap-3 items-end">
      {/* AI avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      {/* Bubble */}
      <div className="bg-white border border-slate-200 shadow-sm px-5 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-400 rounded-full typing-dot" />
        <span className="w-2 h-2 bg-violet-400 rounded-full typing-dot" />
        <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
      </div>
    </div>
  );
}
