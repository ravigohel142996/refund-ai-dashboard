// API client for the backend
const BASE_URL = 'http://localhost:8000';

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
