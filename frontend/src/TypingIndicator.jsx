/**
 * Animated typing indicator shown while the AI is processing.
 */
export default function TypingIndicator() {
  return (
    <div className="message-enter flex gap-3 items-end">
      {/* AI avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        AI
      </div>

      {/* Bubble */}
      <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
        <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
        <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
        <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
      </div>
    </div>
  );
}
