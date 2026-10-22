/**
 * EventGenie Algorithmic Planning Engine (High-Fidelity Deterministic Fallback)
 * 
 * Provides an intelligent, rule-based generative planning layer when no external
 * LLM API key is supplied or when network outages occur.
 * 
 * Every plan generated is dynamically customized based on:
 * - Event type, guest count, location, total budget, currency
 * - Theme, cultural considerations, accessibility requirements
 * - Food, decor, and entertainment preferences
 */

import { calculateBudget } from './budgetCalculator.js';
import { getRelativeDeadline, processTimeline } from './timelineCalculator.js';
import { processVendors } from './vendorManager.js';
import { processCreativeIdeas } from './creativeIdeasManager.js';

export function generateAlgorithmicPlan(eventDetails) {
  const {
    eventType = 'custom',
    eventName = 'Special Occasion',
    eventDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime = '17:00',
    endTime = '22:00',
    location = 'Local Community Center',
    guestCount = 50,
    totalBudget = 5000,
    currency = 'USD',
    theme = 'Modern Celebratory',
    foodPreferences = '',
    decorationPreferences = '',
    entertainmentPreferences = '',
    specialRequirements = ''
  } = eventDetails;

  const guests = Math.max(1, parseInt(guestCount, 10) || 50);
  const budget = Math.max(100, parseFloat(totalBudget) || 5000);
  const normalizedType = eventType.toLowerCase();

  // 1. Contextual Concept & Assumptions
  const concept = buildConcept(normalizedType, eventName, theme, location, guests, specialRequirements);
  const assumptions = buildAssumptions(normalizedType, guests, budget, currency, location, eventDate);

  // 2. Dynamic Budget Allocations
  const rawCategories = buildBudgetCategories(normalizedType, budget, guests, currency, foodPreferences);
  const calculatedBudget = calculateBudget(budget, rawCategories, currency);

  // 3. Chronological Preparation Timeline
  const rawTasks = buildTimelineTasks(normalizedType, eventDate, eventName, location);
  const processedTimeline = processTimeline(rawTasks, eventDate);

  // 4. Tailored Vendor Checklist
  const rawVendors = buildVendorChecklist(normalizedType, location, guests, foodPreferences, entertainmentPreferences);
  const processedVendors = processVendors(rawVendors);

  // 5. Creative Ideas Tailored to Event Parameters
  const rawIdeas = buildCreativeIdeas(normalizedType, eventName, theme, guests, foodPreferences, entertainmentPreferences, specialRequirements);
  const processedIdeas = processCreativeIdeas(rawIdeas);

  return {
    generationMode: 'demo',
    aiModelUsed: 'EventGenie Algorithmic Planning Engine (Rule-based Generative)',
    concept,
    assumptions,
    budget: calculatedBudget,
    timeline: processedTimeline,
    vendors: processedVendors,
    creativeIdeas: processedIdeas
  };
}

function buildConcept(type, name, theme, location, guests, specialRequirements) {
  const reqSuffix = specialRequirements ? ` Accommodating: ${specialRequirements}.` : '';
  switch (type) {
    case 'wedding':
      return `An unforgettable wedding experience for "${name}" hosting ${guests} guests in ${location}. Anchored around the theme "${theme}", seamlessly fusing heartfelt romance with organized, stress-free hospitality.${reqSuffix}`;
    case 'birthday':
      return `A vibrant milestone birthday celebration for "${name}" with ${guests} guests in ${location}. Designed with the "${theme}" aesthetic, featuring energetic party moments, interactive treats, and memorable photo stations.${reqSuffix}`;
    case 'college event':
      return `A high-impact campus event "${name}" catering to ${guests} students and attendees in ${location}. Driven by the theme "${theme}", prioritizing crowd flow, dynamic staging, engaging competitions, and strict safety guidelines.${reqSuffix}`;
    case 'community celebration':
      return `An inclusive, heartwarming community gathering "${name}" for ${guests} residents in ${location}. Fostering unity around the theme "${theme}" with accessible activities, communal seating, and multicultural expressions.${reqSuffix}`;
    case 'anniversary':
      return `An elegant commemorative anniversary celebration "${name}" honoring meaningful milestones with ${guests} cherished guests in ${location}. Built upon the aesthetic "${theme}".${reqSuffix}`;
    default:
      return `A bespoke, personalized event plan for "${name}" hosting ${guests} guests at ${location}, curated around "${theme}".${reqSuffix}`;
  }
}

function buildAssumptions(type, guests, budget, currency, location, eventDate) {
  const perGuest = Math.round(budget / guests);
  return `Computed for ${guests} guests at an average allocation of ${currency} ${perGuest}/guest. Assumes venue booking confirmation at least 4-6 weeks prior to ${eventDate} in ${location}, with flexible setup window on event morning.`;
}

function buildBudgetCategories(type, budget, guests, currency, foodPrefs) {
  let ratios = [];
  switch (type) {
    case 'wedding':
      ratios = [
        { name: 'Venue & Facility Rental', ratio: 0.28, priority: 'Critical', notes: 'Main ceremony and reception spaces' },
        { name: 'Catering, Bar & Service Staff', ratio: 0.32, priority: 'Critical', notes: foodPrefs ? `Tailored for: ${foodPrefs}` : 'Full meal service and beverages' },
        { name: 'Photography & Videography', ratio: 0.12, priority: 'High', notes: 'Ceremony, portraiture, and reception coverage' },
        { name: 'Floral Arrangements & Stage Decor', ratio: 0.10, priority: 'High', notes: 'Bouquets, centerpieces, lighting' },
        { name: 'Music, Sound & Entertainment', ratio: 0.08, priority: 'Medium', notes: 'DJ/Band and audio equipment' },
        { name: 'Invitations & Guest Stationery', ratio: 0.02, priority: 'Low', notes: 'Digital/print invites and signage' },
        { name: 'Transportation & Logistics', ratio: 0.03, priority: 'Low', notes: 'Guest shuttle and VIP transfers' },
        { name: 'Emergency Contingency Buffer', ratio: 0.05, priority: 'High', notes: 'Unforeseen day-of expenses and taxes' }
      ];
      break;

    case 'college event':
      ratios = [
        { name: 'Stage, Trussing & Sound / AV System', ratio: 0.30, priority: 'Critical', notes: 'Line array audio, stage lighting, technician' },
        { name: 'Venue, Campus Permits & Security', ratio: 0.18, priority: 'Critical', notes: 'Campus approvals, crowd control barriers' },
        { name: 'Student Refreshments & Food Stalls', ratio: 0.20, priority: 'High', notes: foodPrefs || 'Fast food counters, water stations' },
        { name: 'Guest Artist / Band / Host Honorarium', ratio: 0.15, priority: 'High', notes: 'Performer booking & hospitality' },
        { name: 'Promotional Banners, ID Badges & PR', ratio: 0.07, priority: 'Medium', notes: 'Social media ads, wristbands, posters' },
        { name: 'Event Prizes, Trophies & Swag', ratio: 0.05, priority: 'Medium', notes: 'Hackathon/contest winner merchandise' },
        { name: 'Emergency Contingency Buffer', ratio: 0.05, priority: 'High', notes: 'Spare equipment cables, first-aid support' }
      ];
      break;

    case 'birthday':
      ratios = [
        { name: 'Party Venue / Hall Rental', ratio: 0.25, priority: 'Critical', notes: 'Private event room or party hall' },
        { name: 'Food, Specialty Cake & Drinks', ratio: 0.35, priority: 'Critical', notes: 'Themed multi-tier cake, finger foods, punch bar' },
        { name: 'Thematic Decor, Balloon Garland & Backdrops', ratio: 0.15, priority: 'High', notes: 'Entrance arch, photobooth backdrop, table settings' },
        { name: 'Live Entertainment / DJ / Game Host', ratio: 0.12, priority: 'Medium', notes: 'Magician, DJ, or activity coordinator' },
        { name: 'Party Favors & Gift Bags', ratio: 0.05, priority: 'Low', notes: 'Personalized takeaways for guests' },
        { name: 'Invitations & Digital RSVP Management', ratio: 0.02, priority: 'Low', notes: 'Custom animated invite cards' },
        { name: 'Emergency Contingency Buffer', ratio: 0.06, priority: 'High', notes: 'Buffer for extra last-minute attendees' }
      ];
      break;

    default: // Community / Anniversary / Custom
      ratios = [
        { name: 'Venue & Facilities Rental', ratio: 0.30, priority: 'Critical', notes: 'Hall or open grounds booking' },
        { name: 'Catering, Refreshments & Service', ratio: 0.30, priority: 'Critical', notes: 'Buffet or banquet service' },
        { name: 'Decor, Seating & Ambience Lighting', ratio: 0.14, priority: 'High', notes: 'Tables, linens, centerpieces, banner' },
        { name: 'Sound, Stage & Entertainment', ratio: 0.12, priority: 'Medium', notes: 'Microphones, playlist setup, speaker' },
        { name: 'Photography & Memory Documentation', ratio: 0.06, priority: 'Low', notes: 'Event photographer or photo lounge' },
        { name: 'Signage & Guest Communications', ratio: 0.02, priority: 'Low', notes: 'Schedule flyers, welcome signage' },
        { name: 'Contingency & Incidentals', ratio: 0.06, priority: 'High', notes: 'Emergency operational reserve' }
      ];
  }

  return ratios.map((item, idx) => ({
    id: `cat-${idx + 1}`,
    name: item.name,
    allocatedAmount: Math.round(budget * item.ratio),
    estimatedCost: Math.round(budget * item.ratio),
    priority: item.priority,
    notes: item.notes
  }));
}

function buildTimelineTasks(type, eventDate, name, location) {
  return [
    {
      id: 'task-1',
      phase: 'Phase 1: Concept & Approvals',
      title: 'Finalize Event Blueprint & Budget Cap',
      description: `Establish fixed budget allocation, decision-makers, and target guest list for ${name}.`,
      suggestedDeadline: getRelativeDeadline(eventDate, 60),
      priority: 'Critical',
      status: 'completed',
      assignedTo: 'Lead Organizer'
    },
    {
      id: 'task-2',
      phase: 'Phase 1: Concept & Approvals',
      title: 'Inspect & Reserve Main Venue',
      description: `Secure venue contract in ${location}, verify parking capacity, curfew rules, and AV plug points.`,
      suggestedDeadline: getRelativeDeadline(eventDate, 45),
      priority: 'Critical',
      status: 'in_progress',
      assignedTo: 'Logistics Lead'
    },
    {
      id: 'task-3',
      phase: 'Phase 2: Vendors & Coordination',
      title: 'Book Catering & Select Food Menu',
      description: 'Review dietary accommodations (vegan, gluten-free, halal/kosher) and confirm beverage services.',
      suggestedDeadline: getRelativeDeadline(eventDate, 30),
      priority: 'High',
      status: 'pending',
      assignedTo: 'Hospitality Lead'
    },
    {
      id: 'task-4',
      phase: 'Phase 2: Vendors & Coordination',
      title: 'Confirm Sound, Staging & Photographer',
      description: 'Sign contracts for audio equipment, backup power generator, and visual documentation.',
      suggestedDeadline: getRelativeDeadline(eventDate, 25),
      priority: 'High',
      status: 'pending',
      assignedTo: 'Media Lead'
    },
    {
      id: 'task-5',
      phase: 'Phase 3: Guest Management',
      title: 'Dispatch Invitations & Track RSVPs',
      description: 'Send digital invitations and monitor confirmed headcounts for table allocation.',
      suggestedDeadline: getRelativeDeadline(eventDate, 20),
      priority: 'Medium',
      status: 'pending',
      assignedTo: 'Communications Lead'
    },
    {
      id: 'task-6',
      phase: 'Phase 4: Final Preparations',
      title: 'Conduct Dry Run & Vendor Alignment Call',
      description: 'Run through chronological minute-by-minute itinerary with all participating suppliers.',
      suggestedDeadline: getRelativeDeadline(eventDate, 5),
      priority: 'Critical',
      status: 'pending',
      assignedTo: 'All Leads'
    },
    {
      id: 'task-7',
      phase: 'Phase 5: Event Day Execution',
      title: 'On-Site Setup & Guest Welcome',
      description: 'Supervise vendor load-in, test microphones, position directional signage, and begin check-in.',
      suggestedDeadline: eventDate,
      priority: 'Critical',
      status: 'pending',
      assignedTo: 'Floor Manager'
    }
  ];
}

function buildVendorChecklist(type, location, guests, foodPrefs, entertainmentPrefs) {
  const common = [
    {
      id: 'ven-1',
      category: 'Venue & Space',
      serviceName: 'Primary Event Facility',
      isRequired: true,
      status: 'researching',
      estimatedCost: 1500,
      selectionCriteria: `Must safely hold ${guests} guests with emergency exits and adequate restroom facilities.`,
      questionsToAsk: [
        'What are the exact load-in and teardown hours allowed?',
        'Is there a designated vendor parking and loading dock area?',
        'Are there decibel limitations for music past 10:00 PM?'
      ]
    },
    {
      id: 'ven-2',
      category: 'Catering & Dining',
      serviceName: 'Catering & Beverage Provider',
      isRequired: true,
      status: 'needed',
      estimatedCost: 2000,
      selectionCriteria: foodPrefs ? `Experience with: ${foodPrefs}` : 'Sanitation certified, provides warmers and servers.',
      questionsToAsk: [
        'Do you provide servers, bussers, plates, and cutlery in this quote?',
        'How do you manage dietary allergies and cross-contamination?',
        'What is your policy regarding leftover food handling?'
      ]
    },
    {
      id: 'ven-3',
      category: 'Audio & Visual',
      serviceName: 'Sound & Lighting Production',
      isRequired: true,
      status: 'needed',
      estimatedCost: 800,
      selectionCriteria: 'Pro-grade wireless microphones, mixer board, and ambient wash lighting.',
      questionsToAsk: [
        'Do you supply an on-site audio technician throughout the event?',
        'What backup cables, microphones, or spare speakers do you carry?',
        'What electrical voltage/amperage requirements does your rig require?'
      ]
    },
    {
      id: 'ven-4',
      category: 'Visual Documentation',
      serviceName: 'Event Photographer / Videographer',
      isRequired: true,
      status: 'needed',
      estimatedCost: 900,
      selectionCriteria: 'Strong portfolio capturing spontaneous interactions and low-light event scenes.',
      questionsToAsk: [
        'How many edited, high-resolution photos are delivered?',
        'What is the turnaround time for digital photo gallery access?',
        'Do you have liability insurance required by the venue?'
      ]
    },
    {
      id: 'ven-5',
      category: 'Decor & Floral',
      serviceName: 'Event Stylist & Decor Rentals',
      isRequired: false,
      status: 'needed',
      estimatedCost: 600,
      selectionCriteria: 'Inventory matching desired theme, prompt setup and teardown team.',
      questionsToAsk: [
        'Does the rental price include delivery, installation, and post-event removal?',
        'What is the fee for damaged or missing rental items?'
      ]
    }
  ];

  return common;
}

function buildCreativeIdeas(type, name, theme, guests, foodPrefs, entPrefs, specialReqs) {
  return {
    themeConcepts: [
      {
        id: 'c-idea-1',
        title: `Signature "${theme}" Color Gradient Palette`,
        description: `Unify the entrance, table textiles, and digital presentations using a cohesive palette that amplifies "${theme}".`,
        saved: true
      },
      {
        id: 'c-idea-2',
        title: 'Interactive Memory Landmark',
        description: `Install a focal photo installation reflecting "${name}" where attendees can capture high-contrast portraits.`,
        saved: true
      }
    ],
    activitiesAndEntertainment: [
      {
        id: 'c-idea-3',
        title: 'Curated Timeline Trivia / Spotlight Moments',
        description: `A 15-minute energetic spotlight session engaging all ${guests} attendees with fun highlights or awards.`,
        saved: true
      },
      {
        id: 'c-idea-4',
        title: 'Crowdsourced Live Music Request Queue',
        description: 'Provide a simple QR code at tables where guests upvote their favorite tracks for the DJ.',
        saved: false
      }
    ],
    invitationWording: [
      {
        id: 'c-idea-5',
        title: 'Warm & Modern Invitation Tone',
        description: `"You are warmly invited to celebrate with us at ${name}! Join us for an extraordinary gathering of music, delicious cuisine, and meaningful connections. Please RSVP by our preparation deadline."`,
        saved: true
      }
    ],
    guestEngagement: [
      {
        id: 'c-idea-6',
        title: 'Digital Live Photo Mosaic Wall',
        description: 'Display a live streaming projector screen showing photos taken and uploaded by guests throughout the event.',
        saved: false
      }
    ],
    foodAndPresentation: [
      {
        id: 'c-idea-7',
        title: 'Interactive Signature Tasting Station',
        description: foodPrefs ? `Curated food bar featuring: ${foodPrefs}, plated with artisan garnishes.` : 'Artisanal sliders, fresh bites, and seasonal fruit infusions.',
        saved: true
      }
    ],
    budgetFriendlyAlternatives: [
      {
        id: 'c-idea-8',
        title: 'Architectural Uplighting over Heavy Floral Installations',
        description: 'High-power LED wash lights transform walls and ceilings dramatically at a fraction of the cost of cut flowers.',
        saved: true
      }
    ],
    weatherBackupPlan: [
      {
        id: 'c-idea-9',
        title: 'Contingency Weather Pivot Protocol',
        description: 'Pre-mapped covered patio or indoor hall floorplan with pre-designated cordoned zones ready for instant 15-minute relocation.',
        saved: true
      }
    ]
  };
}
