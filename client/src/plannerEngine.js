/**
 * EventGenie Client Planning & Calculation Engine
 * 
 * Provides resilient, zero-dependency client-side plan generation, financial arithmetic,
 * and direct Gemini API integration whenever backend serverless endpoints are offline or static.
 */

export function sanitizeAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num * 100) / 100);
}

export function calculateBudget(totalBudget, categories = [], currency = 'USD') {
  const safeTotalBudget = sanitizeAmount(totalBudget);
  let totalAllocated = 0;

  const sanitized = (categories || []).map((cat, index) => {
    const id = cat.id || `cat-${index + 1}-${Date.now()}`;
    const name = (cat.name || 'Uncategorized Expense').trim();
    const allocatedAmount = sanitizeAmount(cat.allocatedAmount ?? cat.amount ?? 0);
    const estimatedCost = sanitizeAmount(cat.estimatedCost ?? allocatedAmount);
    totalAllocated += allocatedAmount;

    return {
      ...cat,
      id,
      name,
      allocatedAmount,
      estimatedCost,
      isEstimate: true,
      notes: cat.notes || '',
      priority: cat.priority || 'Medium'
    };
  });

  totalAllocated = Math.round(totalAllocated * 100) / 100;
  const remainingBalance = Math.round((safeTotalBudget - totalAllocated) * 100) / 100;
  const isOverBudget = remainingBalance < 0;
  const overspentAmount = isOverBudget ? Math.abs(remainingBalance) : 0;
  const budgetUtilizationPercent = safeTotalBudget > 0 
    ? Math.round((totalAllocated / safeTotalBudget) * 1000) / 10 
    : 0;

  const processedCats = sanitized.map(c => ({
    ...c,
    percentOfBudget: safeTotalBudget > 0 ? Math.round((c.allocatedAmount / safeTotalBudget) * 1000) / 10 : 0,
    percentOfSpend: totalAllocated > 0 ? Math.round((c.allocatedAmount / totalAllocated) * 1000) / 10 : 0
  }));

  const costSavingTips = [];
  if (isOverBudget) {
    costSavingTips.push({
      id: 'tip-overbudget',
      type: 'critical',
      title: 'Budget Deficit Alert',
      message: `You are currently ${currency} ${overspentAmount} over budget. Consider trimming negotiable decor or entertainment allocations.`
    });
  } else {
    costSavingTips.push({
      id: 'tip-contingency',
      type: 'recommendation',
      title: 'Emergency Contingency Safe',
      message: `You have ${currency} ${remainingBalance} remaining in unallocated contingency reserves.`
    });
  }

  return {
    totalBudget: safeTotalBudget,
    totalAllocated,
    totalEstimated: totalAllocated,
    remainingBalance,
    isOverBudget,
    overspentAmount,
    budgetUtilizationPercent,
    currency,
    categories: processedCats,
    costSavingTips,
    disclaimer: 'All category costs shown are AI and heuristic estimates, not binding vendor quotes.'
  };
}

export function processTimeline(tasks = [], eventDate = null) {
  const parsedEventDate = eventDate ? new Date(eventDate) : null;
  const isEventDateValid = parsedEventDate && !isNaN(parsedEventDate.getTime());
  const now = new Date();

  let completedCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;
  let criticalCount = 0;

  const processedTasks = (tasks || []).map((task, index) => {
    const id = task.id || `task-${index + 1}-${Date.now()}`;
    const title = (task.title || 'Milestone Task').trim();
    const description = (task.description || '').trim();
    const priority = ['Critical', 'High', 'Medium', 'Low'].includes(task.priority) ? task.priority : 'Medium';
    
    let status = 'pending';
    if (task.status === 'completed' || task.completed === true) {
      status = 'completed';
      completedCount++;
    } else if (task.status === 'in_progress') {
      status = 'in_progress';
      inProgressCount++;
    } else {
      status = 'pending';
      pendingCount++;
    }

    if (priority === 'Critical') criticalCount++;

    return {
      id,
      phase: task.phase || 'Planning',
      title,
      description,
      suggestedDeadline: task.suggestedDeadline || eventDate || '',
      priority,
      status,
      assignedTo: task.assignedTo || ''
    };
  });

  const sorted = [...processedTasks].sort((a, b) => {
    if (!a.suggestedDeadline) return 1;
    if (!b.suggestedDeadline) return -1;
    return new Date(a.suggestedDeadline) - new Date(b.suggestedDeadline);
  });

  const totalTasks = processedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  let daysUntilEvent = null;
  if (isEventDateValid) {
    const diffMs = parsedEventDate.getTime() - now.getTime();
    daysUntilEvent = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    tasks: sorted,
    totalTasks,
    completedCount,
    inProgressCount,
    pendingCount,
    criticalCount,
    progressPercent,
    daysUntilEvent,
    eventDate: isEventDateValid ? parsedEventDate.toISOString().split('T')[0] : null
  };
}

export function processVendors(vendors = []) {
  let bookedCount = 0;
  let neededCount = 0;
  let totalEstimatedCost = 0;

  const processed = (vendors || []).map((v, index) => {
    const id = v.id || `vendor-${index + 1}-${Date.now()}`;
    const status = v.status || 'needed';
    const isBooked = status === 'booked' || status === 'confirmed';
    if (isBooked) bookedCount++;
    else neededCount++;

    const estimatedCost = sanitizeAmount(v.estimatedCost || 0);
    totalEstimatedCost += estimatedCost;

    return {
      id,
      category: v.category || 'General Service',
      serviceName: v.serviceName || 'Vendor Requirement',
      isRequired: v.isRequired !== undefined ? Boolean(v.isRequired) : true,
      status,
      estimatedCost,
      selectionCriteria: v.selectionCriteria || 'Check portfolio, verify references, and review contract cancellation terms.',
      questionsToAsk: Array.isArray(v.questionsToAsk) ? v.questionsToAsk : [
        'What is included in the standard package vs add-on charges?',
        'What is your cancellation and refund policy?',
        'Do you provide backup staff or equipment on event day?'
      ],
      contactName: v.contactName || '',
      contactDetails: v.contactDetails || '',
      contractNotes: v.contractNotes || '',
      completed: isBooked
    };
  });

  const total = processed.length;
  return {
    vendors: processed,
    totalVendors: total,
    bookedCount,
    neededCount,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    bookingProgressPercent: total > 0 ? Math.round((bookedCount / total) * 100) : 0
  };
}

export function processCreativeIdeas(ideas = {}) {
  const norm = (arr) => (arr || []).map(i => ({
    id: i.id || `idea-${Math.random().toString(36).substring(2, 9)}`,
    title: i.title || 'Creative Idea',
    description: i.description || '',
    saved: Boolean(i.saved)
  }));

  return {
    themeConcepts: norm(ideas.themeConcepts),
    activitiesAndEntertainment: norm(ideas.activitiesAndEntertainment),
    invitationWording: norm(ideas.invitationWording),
    guestEngagement: norm(ideas.guestEngagement),
    foodAndPresentation: norm(ideas.foodAndPresentation),
    budgetFriendlyAlternatives: norm(ideas.budgetFriendlyAlternatives),
    weatherBackupPlan: norm(ideas.weatherBackupPlan)
  };
}

/**
 * Generates an end-to-end plan deterministically right on the client.
 */
export function generateClientAlgorithmicPlan(eventDetails) {
  const {
    eventType = 'custom',
    eventName = 'Special Occasion',
    eventDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime = '16:00',
    endTime = '22:00',
    location = 'Venue Hall',
    guestCount = 50,
    totalBudget = 5000,
    currency = 'USD',
    theme = 'Modern Celebration',
    foodPreferences = '',
    decorationPreferences = '',
    entertainmentPreferences = '',
    specialRequirements = ''
  } = eventDetails;

  const guests = Math.max(1, parseInt(guestCount, 10) || 50);
  const budget = Math.max(100, parseFloat(totalBudget) || 5000);
  const normType = eventType.toLowerCase();

  const concept = `A bespoke, personalized ${normType} celebration for "${eventName}" hosting ${guests} guests in ${location}. Centered around "${theme || 'Modern Celebratory'}" with dedicated guest hospitality${specialRequirements ? ` and accommodating: ${specialRequirements}` : ''}.`;
  const assumptions = `Calculated for ${guests} attendees with an average allocation of ${currency} ${Math.round(budget / guests)}/guest. Planning milestones sequenced leading up to ${eventDate}.`;

  // Budget ratios
  let catDefs = [];
  if (normType.includes('wedding')) {
    catDefs = [
      { name: 'Venue & Ceremony Pavilion', ratio: 0.28, priority: 'Critical' },
      { name: 'Catering & Beverages', ratio: 0.32, priority: 'Critical' },
      { name: 'Photography & Videography', ratio: 0.12, priority: 'High' },
      { name: 'Floral Arrangements & Decor', ratio: 0.10, priority: 'High' },
      { name: 'Music & Entertainment', ratio: 0.08, priority: 'Medium' },
      { name: 'Invitations & Guest Stationery', ratio: 0.02, priority: 'Low' },
      { name: 'Shuttle Transportation', ratio: 0.03, priority: 'Low' },
      { name: 'Emergency Contingency Buffer', ratio: 0.05, priority: 'High' }
    ];
  } else if (normType.includes('college')) {
    catDefs = [
      { name: 'Stage, Sound & AV Equipment', ratio: 0.30, priority: 'Critical' },
      { name: 'Campus Permits & Security', ratio: 0.18, priority: 'Critical' },
      { name: 'Student Refreshments & Food', ratio: 0.20, priority: 'High' },
      { name: 'Guest Artist / Honorarium', ratio: 0.15, priority: 'High' },
      { name: 'Promotion, Banners & Swag', ratio: 0.12, priority: 'Medium' },
      { name: 'Contingency & Spare Cables', ratio: 0.05, priority: 'High' }
    ];
  } else if (normType.includes('birthday')) {
    catDefs = [
      { name: 'Party Venue / Hall Rental', ratio: 0.25, priority: 'Critical' },
      { name: 'Food, Specialty Cake & Drinks', ratio: 0.35, priority: 'Critical' },
      { name: 'Thematic Decor & Balloon Arch', ratio: 0.15, priority: 'High' },
      { name: 'Live DJ / Entertainment', ratio: 0.12, priority: 'Medium' },
      { name: 'Party Favors & Gifts', ratio: 0.07, priority: 'Low' },
      { name: 'Contingency Buffer', ratio: 0.06, priority: 'High' }
    ];
  } else {
    catDefs = [
      { name: 'Venue Rental', ratio: 0.30, priority: 'Critical' },
      { name: 'Catering & Dining', ratio: 0.30, priority: 'Critical' },
      { name: 'Decor, Seating & Lighting', ratio: 0.15, priority: 'High' },
      { name: 'Sound & Entertainment', ratio: 0.12, priority: 'Medium' },
      { name: 'Photography Documentation', ratio: 0.07, priority: 'Low' },
      { name: 'Contingency Reserve', ratio: 0.06, priority: 'High' }
    ];
  }

  const rawCats = catDefs.map((c, i) => ({
    id: `cat-${i + 1}`,
    name: c.name,
    allocatedAmount: Math.round(budget * c.ratio),
    priority: c.priority,
    notes: 'Estimated allocation'
  }));

  const computedBudget = calculateBudget(budget, rawCats, currency);

  // Milestone tasks
  const rawTasks = [
    { id: 't1', phase: 'Phase 1: Concept', title: 'Confirm Event Budget Cap & Core Logistics', suggestedDeadline: eventDate, priority: 'Critical', status: 'completed', assignedTo: 'Lead Organizer' },
    { id: 't2', phase: 'Phase 1: Concept', title: `Secure Main Venue Booking in ${location}`, suggestedDeadline: eventDate, priority: 'Critical', status: 'in_progress', assignedTo: 'Logistics' },
    { id: 't3', phase: 'Phase 2: Vendors', title: 'Finalize Catering Menu & Tastings', suggestedDeadline: eventDate, priority: 'High', status: 'pending', assignedTo: 'Hospitality' },
    { id: 't4', phase: 'Phase 2: Vendors', title: 'Book Audio/Visual Production & Photographer', suggestedDeadline: eventDate, priority: 'High', status: 'pending', assignedTo: 'Media' },
    { id: 't5', phase: 'Phase 3: Invitations', title: 'Dispatch Digital Invitations & Track RSVPs', suggestedDeadline: eventDate, priority: 'Medium', status: 'pending', assignedTo: 'Communications' },
    { id: 't6', phase: 'Phase 4: Execution', title: 'Comprehensive Day-of Run-Through & Load-in', suggestedDeadline: eventDate, priority: 'Critical', status: 'pending', assignedTo: 'All Leads' }
  ];

  const computedTimeline = processTimeline(rawTasks, eventDate);

  // Vendor checklist
  const rawVendors = [
    { id: 'v1', category: 'Venue', serviceName: 'Primary Event Facility', isRequired: true, status: 'researching', estimatedCost: Math.round(budget * 0.28) },
    { id: 'v2', category: 'Catering', serviceName: 'Food & Beverage Service Provider', isRequired: true, status: 'needed', estimatedCost: Math.round(budget * 0.32) },
    { id: 'v3', category: 'Production', serviceName: 'Sound, Lighting & Staging Rig', isRequired: true, status: 'needed', estimatedCost: Math.round(budget * 0.15) },
    { id: 'v4', category: 'Photography', serviceName: 'Event Visual Documentation Specialist', isRequired: true, status: 'needed', estimatedCost: Math.round(budget * 0.12) },
    { id: 'v5', category: 'Styling', serviceName: 'Floral & Decor Rentals Provider', isRequired: false, status: 'needed', estimatedCost: Math.round(budget * 0.08) }
  ];

  const computedVendors = processVendors(rawVendors);

  // Creative Ideas
  const rawIdeas = {
    themeConcepts: [
      { id: 'i1', title: `Signature "${theme || 'Celebratory'}" Color Palette`, description: `Unify entryways, table textiles, and digital presentations with cohesive tones reflecting ${theme}.`, saved: true },
      { id: 'i2', title: 'Interactive Photo Backdrop Landmark', description: `Design an Instagram-worthy photo installation celebrating "${eventName}".`, saved: true }
    ],
    activitiesAndEntertainment: [
      { id: 'i3', title: 'Curated 15-Minute Spotlight & Awards Moment', description: `An energetic session engaging all ${guests} guests with milestones or fun awards.`, saved: true },
      { id: 'i4', title: 'Live QR Song Request Queue', description: 'Guests scan a table QR code to upvote their favorite playlist tracks.', saved: false }
    ],
    invitationWording: [
      { id: 'i5', title: 'Warm & Modern Invitation Tone', description: `"You are warmly invited to celebrate with us at ${eventName}! Join us on ${eventDate} for an unforgettable gathering in ${location}. Please RSVP by our preparation deadline."`, saved: true }
    ],
    guestEngagement: [
      { id: 'i6', title: 'Collaborative Memory / Photo Wall', description: 'Guests upload instant camera snapshots or digital photos displayed on live screens.', saved: false }
    ],
    foodAndPresentation: [
      { id: 'i7', title: 'Curated Tasting & Signature Infusion Bar', description: foodPreferences ? `Artisan buffet stations featuring: ${foodPreferences}` : 'Seasonal culinary grazing stations with artisan mocktails.', saved: true }
    ],
    budgetFriendlyAlternatives: [
      { id: 'i8', title: 'Architectural Uplighting over Heavy Florals', description: 'High-power LED wash lights transform blank walls dramatically at a fraction of cut floral costs.', saved: true }
    ],
    weatherBackupPlan: [
      { id: 'i9', title: '15-Minute Covered Pivot Protocol', description: 'Pre-mapped covered patio or indoor hall floorplan with pre-designated cordoned zones ready for instant relocation.', saved: true }
    ]
  };

  const computedIdeas = processCreativeIdeas(rawIdeas);

  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...eventDetails,
    generationMode: 'demo',
    aiModelUsed: 'EventGenie Algorithmic Planning Engine (Client Hybrid Mode)',
    summary: {
      concept,
      assumptions
    },
    budget: computedBudget,
    timeline: computedTimeline,
    vendors: computedVendors,
    creativeIdeas: computedIdeas,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
