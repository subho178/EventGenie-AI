/**
 * Client API Helper
 * Manages communication with backend with safe error handling and custom API keys.
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
  try {
    const res = await fetch('/api/ai/status', { headers: getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      success: true,
      geminiConfigured: false,
      modelName: 'EventGenie Algorithmic Planning Engine',
      activeMode: 'algorithmic_fallback',
      supportsCustomKey: true
    };
  }
}

export async function testGeminiKey(apiKey) {
  try {
    const res = await fetch('/api/ai/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, valid: false, message: data?.message || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return { success: false, valid: false, message: err.message };
  }
}

export async function fetchEvents() {
  try {
    const res = await fetch('/api/events');
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, data: [], error: data?.error || `HTTP ${res.status}` };
    }
    return data || { success: true, data: [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function fetchEventById(id) {
  try {
    const res = await fetch(`/api/events/${id}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createEvent(eventData) {
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(eventData)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Server error (${res.status}): ${res.statusText}`
      };
    }
    return data || { success: false, error: 'Empty response from server' };
  } catch (err) {
    return {
      success: false,
      error: `Network error: ${err.message}`
    };
  }
}

export async function updateEvent(id, updates) {
  try {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteEvent(id) {
  try {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function regenerateSection(section, eventDetails) {
  try {
    const res = await fetch('/api/ai/regenerate-section', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ section, eventDetails })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
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
