/**
 * useSpeech.js
 * Wrapper around the Web Speech API for:
 *   - Speech Recognition (mic → text)
 *   - Speech Synthesis (text → voice)
 */

// ── Speech Recognition (Mic Input) ──────────────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSpeechRecognitionSupported() {
  return Boolean(SpeechRecognition);
}

/**
 * Start listening and call onResult(transcript) when done.
 * Returns a stop() function to cancel early.
 */
export function startListening({ onResult, onError, onStart, onEnd }) {
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser.');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onstart  = () => onStart?.();
  recognition.onend    = () => onEnd?.();
  recognition.onerror  = (e) => onError?.(e.error);

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    onResult?.(transcript);
  };

  recognition.start();
  return () => recognition.stop();
}


// ── Speech Synthesis (Text → Voice) ─────────────────────────────────
export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window;
}

let currentUtterance = null;

export function speak(text, { onStart, onEnd, onError } = {}) {
  if (!isSpeechSynthesisSupported()) {
    onError?.('Speech synthesis not supported.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = 'en-US';
  utter.rate  = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;

  // Pick a natural-sounding voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
  ) || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

  utter.onstart = () => onStart?.();
  utter.onend   = () => { currentUtterance = null; onEnd?.(); };
  utter.onerror = (e) => onError?.(e.error);

  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking() {
  return window.speechSynthesis?.speaking ?? false;
}
