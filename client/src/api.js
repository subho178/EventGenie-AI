/**
 * Client API & Hybrid Storage Layer
 * Seamlessly talks to Express serverless API when online, and seamlessly falls back
 * to in-browser planner engine & localStorage if the backend is static, read-only, or unreachable.
 */

import { 
  generateClientAlgorithmicPlan, 
  calculateBudget, 
  processTimeline, 
  processVendors, 
  processCreativeIdeas 
} from './plannerEngine';

const LOCAL_STORAGE_KEY = 'eventgenie_events_store';

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

// LocalStorage helpers
function getLocalEvents() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  
  // Seed default demonstration plan
  const seed = [getDefaultSeedEvent()];
  saveLocalEvents(seed);
  return seed;
}

function saveLocalEvents(events) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  } catch {}
}

export async function fetchAiStatus() {
  try {
    const res = await fetch('/api/ai/status', { headers: getHeaders() });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const customKey = getCustomApiKey();
  return {
    success: true,
    geminiConfigured: Boolean(customKey && customKey.length > 15),
    modelName: customKey ? 'Google Gemini (Client Hybrid)' : 'EventGenie Algorithmic Planning Engine',
    activeMode: customKey ? 'live_gemini' : 'algorithmic_fallback',
    supportsCustomKey: true
  };
}

export async function testGeminiKey(apiKey) {
  try {
    const res = await fetch('/api/ai/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (res.ok) return await res.json();
  } catch {}

  // Direct client-side test if backend route is unavailable
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping. Respond with pong.' }] }]
      })
    });
    if (res.ok) {
      return { success: true, valid: true, message: 'Google Gemini API key verified successfully!' };
    }
    return { success: false, valid: false, message: `Key validation returned HTTP ${res.status}` };
  } catch (err) {
    return { success: false, valid: false, message: `Validation error: ${err.message}` };
  }
}

export async function fetchEvents() {
  try {
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = await res.json();
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        saveLocalEvents(data.data);
        return data;
      }
    }
  } catch {}

  return { success: true, count: getLocalEvents().length, data: getLocalEvents() };
}

export async function fetchEventById(id) {
  try {
    const res = await fetch(`/api/events/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.data) return data;
    }
  } catch {}

  const events = getLocalEvents();
  const found = events.find(e => e.id === id);
  if (found) {
    return { success: true, data: found };
  }
  return { success: false, error: 'Event plan not found' };
}

export async function createEvent(eventData) {
  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(eventData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        const local = getLocalEvents();
        local.unshift(data.data);
        saveLocalEvents(local);
        return data;
      }
    }
  } catch (err) {
    console.warn('Server createEvent unreachable, using client planner engine:', err.message);
  }

  // 2. Resilient Client Generation Guarantee:
  // If backend fails or serverless is unreachable, generate locally without ever crashing!
  try {
    const generated = generateClientAlgorithmicPlan(eventData);
    const local = getLocalEvents();
    local.unshift(generated);
    saveLocalEvents(local);
    return { success: true, data: generated };
  } catch (clientErr) {
    return { success: false, error: clientErr.message };
  }
}

export async function updateEvent(id, updates) {
  try {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data) {
        updateLocalEvent(id, data.data);
        return data;
      }
    }
  } catch {}

  const local = getLocalEvents();
  const idx = local.findIndex(e => e.id === id);
  if (idx >= 0) {
    const merged = { ...local[idx], ...updates, updatedAt: new Date().toISOString() };
    local[idx] = merged;
    saveLocalEvents(local);
    return { success: true, data: merged };
  }
  return { success: false, error: 'Event not found' };
}

export async function deleteEvent(id) {
  try {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      deleteLocalEvent(id);
      return await res.json();
    }
  } catch {}

  deleteLocalEvent(id);
  return { success: true, message: 'Deleted locally' };
}

export async function regenerateSection(section, eventDetails) {
  try {
    const res = await fetch('/api/ai/regenerate-section', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ section, eventDetails })
    });
    if (res.ok) return await res.json();
  } catch {}

  // Client section regeneration fallback
  const freshPlan = generateClientAlgorithmicPlan(eventDetails);
  let sectionData;
  if (section === 'budget') sectionData = freshPlan.budget;
  else if (section === 'timeline') sectionData = freshPlan.timeline;
  else if (section === 'vendors') sectionData = freshPlan.vendors;
  else sectionData = freshPlan.creativeIdeas;

  return {
    success: true,
    section,
    data: sectionData,
    generationMode: 'demo',
    aiModelUsed: 'EventGenie Algorithmic Planning Engine (Client)'
  };
}

function updateLocalEvent(id, updated) {
  const events = getLocalEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx >= 0) {
    events[idx] = updated;
    saveLocalEvents(events);
  }
}

function deleteLocalEvent(id) {
  const events = getLocalEvents();
  const filtered = events.filter(e => e.id !== id);
  saveLocalEvents(filtered);
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

function getDefaultSeedEvent() {
  return {
    id: "sample-wedding-2026",
    eventType: "wedding",
    eventName: "Maya & David's Sustainable Garden Celebration",
    eventDate: "2026-09-18",
    startTime: "16:00",
    endTime: "23:00",
    location: "Botanical Pavilion, Austin, TX",
    guestCount: 120,
    totalBudget: 28000,
    currency: "USD",
    theme: "Botanical Elegance & Earthy Romance (Sage Green, Warm Gold, Cream)",
    foodPreferences: "Farm-to-table organic buffet with artisanal vegan & gluten-free options",
    decorationPreferences: "Living potted plants, repurposed timber arches, fairy lights, zero-waste floral arrangements",
    entertainmentPreferences: "Acoustic indie folk quartet for cocktail hour, live brass funk band for dancing",
    specialRequirements: "Wheelchair accessible pathways, sensory decompression lounge, zero single-use plastics",
    generationMode: "demo",
    aiModelUsed: "EventGenie Algorithmic Planning Engine (Pre-seeded)",
    summary: {
      concept: "A sustainable celebration combining natural flora with modern warm-toned elegance, focusing on low waste and heartfelt guest intimacy.",
      assumptions: "Outdoor lawn ceremony with weather-shielded glass pavilion reception; moderate climate expected."
    },
    budget: {
      totalBudget: 28000,
      totalAllocated: 26500,
      remainingBalance: 1500,
      isOverBudget: false,
      overspentAmount: 0,
      budgetUtilizationPercent: 94.6,
      currency: "USD",
      categories: [
        { id: "b1", name: "Venue & Pavilion Rental", allocatedAmount: 7500, estimatedCost: 7500, percentOfBudget: 26.8, percentOfSpend: 28.3, notes: "Includes 8-hour access, outdoor lawn, and green room suites", priority: "Critical" },
        { id: "b2", name: "Farm-to-Table Catering & Bar", allocatedAmount: 8500, estimatedCost: 8500, percentOfBudget: 30.4, percentOfSpend: 32.1, notes: "$65/guest food + $15/guest craft cider & wine bar", priority: "Critical" },
        { id: "b3", name: "Floral, Potted Plants & Decor", allocatedAmount: 3200, estimatedCost: 3200, percentOfBudget: 11.4, percentOfSpend: 12.1, notes: "Rentable potted trees, wildflower table runners", priority: "High" },
        { id: "b4", name: "Photography & Drone Footage", allocatedAmount: 2800, estimatedCost: 2800, percentOfBudget: 10.0, percentOfSpend: 10.6, notes: "7 hours documentary-style photography + teaser video", priority: "High" },
        { id: "b5", name: "Live Band & Acoustic Musicians", allocatedAmount: 2200, estimatedCost: 2200, percentOfBudget: 7.9, percentOfSpend: 8.3, notes: "Quartet + 5-piece reception band", priority: "Medium" },
        { id: "b6", name: "Recycled Stationery & Digital Invites", allocatedAmount: 350, estimatedCost: 350, percentOfBudget: 1.3, percentOfSpend: 1.3, notes: "Plantable seed-paper invitations + QR RSVP portal", priority: "Low" },
        { id: "b7", name: "Shuttle Van Transportation", allocatedAmount: 750, estimatedCost: 750, percentOfBudget: 2.7, percentOfSpend: 2.8, notes: "Two 20-passenger shuttles from downtown hotel partner", priority: "Medium" },
        { id: "b8", name: "Emergency Contingency Buffer", allocatedAmount: 1200, estimatedCost: 1200, percentOfBudget: 4.3, percentOfSpend: 4.5, notes: "Safety buffer for unexpected guest additions or weather needs", priority: "High" }
      ],
      costSavingTips: [
        { id: "t1", type: "recommendation", title: "Dual-Purpose Ceremony Florals", message: "Repurpose ceremony aisle potted plants as reception centerpiece decor to save up to $800." }
      ]
    },
    timeline: {
      totalTasks: 7,
      completedCount: 2,
      inProgressCount: 1,
      pendingCount: 4,
      criticalCount: 3,
      progressPercent: 29,
      tasks: [
        { id: "t-1", phase: "Milestone 1: Foundations", title: "Confirm venue contract & deposit", description: "Review environmental noise ordinance and secure botanical pavilion.", suggestedDeadline: "2026-04-15", priority: "Critical", status: "completed", assignedTo: "Maya" },
        { id: "t-2", phase: "Milestone 1: Foundations", title: "Send digital Save-the-Dates", description: "Distribute seed-paper cards with URL link to RSVP portal.", suggestedDeadline: "2026-05-01", priority: "High", status: "completed", assignedTo: "David" },
        { id: "t-3", phase: "Milestone 2: Vendors", title: "Catering menu tasting & beverage pairing", description: "Select 3 seasonal entrees and vegan specialty desserts.", suggestedDeadline: "2026-06-15", priority: "High", status: "in_progress", assignedTo: "Maya & David" },
        { id: "t-4", phase: "Milestone 2: Vendors", title: "Book live band & AV technician", description: "Finalize setlist, special request songs, and microphone setup for vows.", suggestedDeadline: "2026-07-01", priority: "Medium", status: "pending", assignedTo: "David" },
        { id: "t-5", phase: "Milestone 3: Logistics", title: "Finalize floorplan & seating layout", description: "Ensure 4-foot wheelchair clearance on all main dining aisles.", suggestedDeadline: "2026-08-10", priority: "Critical", status: "pending", assignedTo: "Maya" },
        { id: "t-6", phase: "Milestone 4: Countdown", title: "Vendor coordination run-through call", description: "Synchronize load-in schedule (12:00 PM) with venue manager.", suggestedDeadline: "2026-09-05", priority: "Critical", status: "pending", assignedTo: "Wedding Coordinator" },
        { id: "t-7", phase: "Event Day", title: "Welcome toast and guest check-in", description: "Greet guests with infused botanical mocktails at the welcome terrace.", suggestedDeadline: "2026-09-18", priority: "High", status: "pending", assignedTo: "Bridal Party" }
      ]
    },
    vendors: {
      totalVendors: 6,
      bookedCount: 2,
      neededCount: 4,
      requiredCount: 5,
      optionalCount: 1,
      bookingProgressPercent: 33,
      vendors: [
        { id: "v1", category: "Venue", serviceName: "Botanical Glasshouse & Pavilion", isRequired: true, status: "booked", estimatedCost: 7500, contactName: "Austin Botanic Events Office", contactDetails: "events@austinbotanics.example.com", selectionCriteria: "Must accommodate 120 guests seated with ADA accessibility", completed: true },
        { id: "v2", category: "Catering", serviceName: "Harvest Roots Organic Catering", isRequired: true, status: "contacted", estimatedCost: 8500, contactName: "Chef Elena", contactDetails: "contact@harvestroots.example.com", selectionCriteria: "100% compostable service ware and locally sourced produce", completed: false },
        { id: "v3", category: "Photography", serviceName: "Golden Hour Visuals", isRequired: true, status: "booked", estimatedCost: 2800, contactName: "Marcus Vance", contactDetails: "marcus@goldenhour.example.com", selectionCriteria: "Natural light specialist with documentary portfolio", completed: true },
        { id: "v4", category: "Music & Audio", serviceName: "The Wildflower Brass Collective", isRequired: true, status: "researching", estimatedCost: 2200, contactName: "", contactDetails: "", selectionCriteria: "Able to perform acoustic ceremony and energetic reception sets", completed: false },
        { id: "v5", category: "Floral & Decor", serviceName: "EcoBlooms Floral Studio", isRequired: true, status: "needed", estimatedCost: 3200, contactName: "", contactDetails: "", selectionCriteria: "Foam-free installations and rentable living planters", completed: false },
        { id: "v6", category: "Guest Transportation", serviceName: "Hill Country Shuttles", isRequired: false, status: "needed", estimatedCost: 750, contactName: "", contactDetails: "", selectionCriteria: "Clean-fuel vans with punctual turnaround schedules", completed: false }
      ]
    },
    creativeIdeas: {
      themeConcepts: [
        { id: "c1", title: "Botanical Herbarium Table Markers", description: "Instead of standard numbers, name tables after native aromatic herbs (Lavender, Sage, Rosemary) with miniature potted takeaways.", saved: true },
        { id: "c2", title: "Biodegradable Wildflower Confetti Send-Off", description: "Guests toss dried jasmine buds and wildflower seeds that enrich the pavilion garden after the reception.", saved: true }
      ],
      activitiesAndEntertainment: [
        { id: "c3", title: "Audio Guestbook Rotary Phone", description: "A vintage rotary phone where guests pick up the receiver to record nostalgic voicemail messages and life advice.", saved: true },
        { id: "c4", title: "Custom Blend Herbal Tea Bar", description: "An evening relaxation station where guests mix their own organic chamomile and mint sachets to brew or take home.", saved: false }
      ],
      invitationWording: [
        { id: "c5", title: "Modern Botanical Invitation Text", description: "\"Together with our families, Maya and David invite you to celebrate love, laughter, and new beginnings beneath the canopy of the Austin Botanical Pavilion...\"", saved: true }
      ],
      guestEngagement: [
        { id: "c6", title: "Collaborative Polaroid Botanical Scrapbook", description: "Guests take instant snaps and clip them onto hanging jute ropes with personalized handwritten notes.", saved: false }
      ],
      foodAndPresentation: [
        { id: "c7", title: "Charcuterie Grazing Horizon", description: "A 16-foot reclaimed cedar board filled with local cheeses, honeycomb, artisanal figs, and edible orchid garnishes.", saved: true }
      ],
      budgetFriendlyAlternatives: [
        { id: "c8", title: "Rent Living Topiaries instead of Cut Stems", description: "Living potted trees rent for half the price of cut floral arches and are returned to the nursery post-event.", saved: true }
      ],
      weatherBackupPlan: [
        { id: "c9", title: "Glasshouse Roll-In Plan", description: "In the event of unexpected rain, the ceremony instantly transitions inside the glass pavilion with floor-to-ceiling garden views.", saved: true }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
