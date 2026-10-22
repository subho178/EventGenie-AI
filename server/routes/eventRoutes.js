/**
 * Event Routes
 * Full CRUD and recalculation endpoints for EventGenie plans.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllEvents, getEventById, saveEvent, deleteEvent } from '../services/storage.js';
import { EventInputSchema } from '../validation/eventSchema.js';
import { generateFullEventPlan } from '../services/geminiService.js';
import { calculateBudget } from '../services/budgetCalculator.js';
import { processTimeline } from '../services/timelineCalculator.js';
import { processVendors } from '../services/vendorManager.js';
import { processCreativeIdeas } from '../services/creativeIdeasManager.js';

const router = express.Router();

/**
 * GET /api/events
 * Returns summary list of all saved events.
 */
router.get('/', (req, res) => {
  try {
    const events = getAllEvents();
    // Return summaries sorted by most recent
    const summaries = events.map(e => ({
      id: e.id,
      eventName: e.eventName,
      eventType: e.eventType,
      eventDate: e.eventDate,
      location: e.location,
      guestCount: e.guestCount,
      totalBudget: e.totalBudget,
      currency: e.currency,
      generationMode: e.generationMode,
      aiModelUsed: e.aiModelUsed,
      progressPercent: e.timeline?.progressPercent || 0,
      totalTasks: e.timeline?.totalTasks || 0,
      completedCount: e.timeline?.completedCount || 0,
      totalAllocated: e.budget?.totalAllocated || 0,
      remainingBalance: e.budget?.remainingBalance || 0,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));
    res.json({ success: true, count: summaries.length, data: summaries });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve event list' });
  }
});

/**
 * GET /api/events/:id
 * Returns the full event plan including budget, timeline, vendors, and ideas.
 */
router.get('/:id', (req, res) => {
  try {
    const event = getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event plan not found' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve event' });
  }
});

/**
 * POST /api/events
 * Validates event input and generates a complete AI-personalized plan.
 */
router.post('/', async (req, res) => {
  try {
    const parseResult = EventInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const validatedData = parseResult.data;
    const customKey = req.headers['x-gemini-api-key'] || null;

    let plan;
    try {
      plan = await generateFullEventPlan(validatedData, customKey);
    } catch (aiErr) {
      console.warn('AI generation exception, falling back to algorithmic engine:', aiErr.message);
      plan = generateAlgorithmicPlan(validatedData);
    }

    const newEvent = {
      id: `event-${uuidv4()}`,
      ...validatedData,
      generationMode: plan.generationMode || 'demo',
      aiModelUsed: plan.aiModelUsed || 'EventGenie Algorithmic Planning Engine',
      aiErrorNotice: plan.aiErrorNotice || null,
      summary: {
        concept: plan.concept,
        assumptions: plan.assumptions
      },
      budget: plan.budget,
      timeline: plan.timeline,
      vendors: plan.vendors,
      creativeIdeas: plan.creativeIdeas,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let saved = newEvent;
    try {
      saved = saveEvent(newEvent);
    } catch (storageErr) {
      console.warn('Persistence warning (non-fatal):', storageErr.message);
    }

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Event creation critical error:', err);
    res.status(500).json({ 
      success: false, 
      error: `Failed to create event plan: ${err.message || 'Unknown error'}` 
    });
  }
});

/**
 * PUT /api/events/:id
 * Updates specific sections or full plan, recomputing arithmetic immediately.
 */
router.put('/:id', (req, res) => {
  try {
    const existing = getEventById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Event plan not found' });
    }

    const updates = req.body;
    let updatedBudget = existing.budget;
    let updatedTimeline = existing.timeline;
    let updatedVendors = existing.vendors;
    let updatedIdeas = existing.creativeIdeas;

    // Recalculate budget if categories or totalBudget updated
    if (updates.budget || updates.totalBudget !== undefined) {
      const newBudgetCap = updates.totalBudget !== undefined ? updates.totalBudget : existing.totalBudget;
      const categories = updates.budget?.categories || existing.budget?.categories || [];
      const currency = updates.currency || existing.currency || 'USD';
      updatedBudget = calculateBudget(newBudgetCap, categories, currency);
    }

    // Process timeline if tasks updated
    if (updates.timeline?.tasks) {
      const eventDate = updates.eventDate || existing.eventDate;
      updatedTimeline = processTimeline(updates.timeline.tasks, eventDate);
    }

    // Process vendors if vendors updated
    if (updates.vendors?.vendors) {
      updatedVendors = processVendors(updates.vendors.vendors);
    }

    // Process creative ideas if ideas updated
    if (updates.creativeIdeas) {
      updatedIdeas = processCreativeIdeas(updates.creativeIdeas);
    }

    const merged = {
      ...existing,
      ...updates,
      id: existing.id, // prevent ID change
      budget: updatedBudget,
      timeline: updatedTimeline,
      vendors: updatedVendors,
      creativeIdeas: updatedIdeas,
      updatedAt: new Date().toISOString()
    };

    const saved = saveEvent(merged);
    res.json({ success: true, data: saved });
  } catch (err) {
    console.error('Event update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update event plan' });
  }
});

/**
 * DELETE /api/events/:id
 * Removes an event plan.
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Event plan not found' });
    }
    res.json({ success: true, message: 'Event successfully deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete event plan' });
  }
});

/**
 * POST /api/events/:id/recalculate-budget
 * Dedicated endpoint for instant financial recalculation.
 */
router.post('/:id/recalculate-budget', (req, res) => {
  try {
    const { totalBudget, categories, currency } = req.body;
    const computed = calculateBudget(totalBudget, categories, currency);
    res.json({ success: true, data: computed });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Calculation failed' });
  }
});

export default router;
