/**
 * Client API Helper
 * Manages communication with Express backend, including custom API keys in headers.
 */

export function getCustomApiKey() {
  return sessionStorage.getItem('eventgenie_gemini_key') || '';
}

export function setCustomApiKey(key) {
  if (key) {
    sessionStorage.setItem('eventgenie_gemini_key', key.trim());
  } else {
    sessionStorage.removeItem('eventgenie_gemini_key');
  }
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const customKey = getCustomApiKey();
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }
  return headers;
}

export async function fetchAiStatus() {
  const res = await fetch('/api/ai/status', { headers: getHeaders() });
  return res.json();
}

export async function testGeminiKey(apiKey) {
  const res = await fetch('/api/ai/test-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  return res.json();
}

export async function fetchEvents() {
  const res = await fetch('/api/events');
  return res.json();
}

export async function fetchEventById(id) {
  const res = await fetch(`/api/events/${id}`);
  return res.json();
}

export async function createEvent(eventData) {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(eventData)
  });
  return res.json();
}

export async function updateEvent(id, updates) {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteEvent(id) {
  const res = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.json();
}

export async function regenerateSection(section, eventDetails) {
  const res = await fetch('/api/ai/regenerate-section', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ section, eventDetails })
  });
  return res.json();
}

export function formatMoney(amount, currency = 'USD') {
  const val = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(val);
  } catch {
    return `${currency} ${val.toLocaleString()}`;
  }
}
