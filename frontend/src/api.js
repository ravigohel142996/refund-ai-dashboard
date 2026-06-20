// API client for the backend
export const BASE_URL = import.meta.env.VITE_API_URL || 'https://refund-ai-dashboard.onrender.com';

export function getWebSocketUrl(path) {
  const url = new URL(BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = path;
  return url.toString();
}

export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}

/**
 * POST /agent-chat
 * @param {string} customerId
 * @param {string} orderId
 * @param {string} message
 * @returns {Promise<{decision, reasoning, tool_logs, agent_reasoning_logs, gemini_explanation}>}
 */
export async function sendRefundRequest(customerId, orderId, message) {
  const res = await fetch(`${BASE_URL}/agent-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      order_id: orderId,
      message,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }

  return res.json();
}
