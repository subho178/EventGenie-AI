/**
 * Event Storage Service
 * Provides robust, file-backed atomic persistence for EventGenie AI event plans.
 * Uses atomic rename write pattern to guarantee data integrity against partial writes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Reads all events from storage.
 * @returns {Array} List of stored events
 */
export function getAllEvents() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return seedInitialData();
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!raw.trim()) {
      return seedInitialData();
    }
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Storage Read Error, reinitializing:', err.message);
    return [];
  }
}

/**
 * Gets a single event plan by ID.
 * @param {string} id 
 * @returns {object|null}
 */
export function getEventById(id) {
  const events = getAllEvents();
  return events.find(e => e.id === id) || null;
}

/**
 * Saves (creates or updates) an event plan using atomic write.
 * @param {object} event 
 * @returns {object} saved event
 */
export function saveEvent(event) {
  if (!event || !event.id) {
    throw new Error('Event must contain a valid id.');
  }

  const events = getAllEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);

  const updatedEvent = {
    ...event,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    events[existingIndex] = updatedEvent;
  } else {
    updatedEvent.createdAt = updatedEvent.createdAt || new Date().toISOString();
    events.unshift(updatedEvent);
  }

  writeEventsAtomically(events);
  return updatedEvent;
}

/**
 * Deletes an event by ID.
 * @param {string} id 
 * @returns {boolean} true if deleted
 */
export function deleteEvent(id) {
  const events = getAllEvents();
  const filtered = events.filter(e => e.id !== id);
  if (filtered.length !== events.length) {
    writeEventsAtomically(filtered);
    return true;
  }
  return false;
}

/**
 * Atomic file writer: writes to a temporary file first, then atomically renames it.
 */
function writeEventsAtomically(events) {
  const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(events, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch {}
    }
    throw err;
  }
}

/**
 * Seeds initial demonstration event so first-time users can immediately explore.
 */
function seedInitialData() {
  const initialEvent = {
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

  try {
    writeEventsAtomically([initialEvent]);
  } catch (e) {
    console.error('Failed to write seed event:', e);
  }

  return [initialEvent];
}
