/**
 * Google Gemini Generative AI Service Layer
 * 
 * Supports:
 * - Structured JSON output mode (gemini-1.5-flash / gemini-2.5-flash)
 * - Safe retry with exponential backoff on transient errors
 * - Timeout enforcement via Promise.race
 * - Programmatic normalization and financial recalculation
 * - Explicitly labeled fallback mode when key is absent or network fails
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateBudget } from './budgetCalculator.js';
import { processTimeline } from './timelineCalculator.js';
import { processVendors } from './vendorManager.js';
import { processCreativeIdeas } from './creativeIdeasManager.js';
import { generateAlgorithmicPlan } from './fallbackPlanner.js';

const TIMEOUT_MS = 25000;
const MAX_RETRIES = 2;

/**
 * Resolves the active Gemini API key.
 * Prioritizes request-supplied key (from UI settings) then process.env.GEMINI_API_KEY.
 */
export function getActiveApiKey(customKey = null) {
  if (customKey && typeof customKey === 'string' && customKey.trim().length > 10) {
    return customKey.trim();
  }
  return process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
}

/**
 * Checks if a live Gemini API key is configured.
 */
export function isGeminiConfigured(customKey = null) {
  const key = getActiveApiKey(customKey);
  return Boolean(key && key.length > 15);
}

/**
 * Generates a full structured event plan using Gemini AI,
 * or safely falls back to the algorithmic engine.
 */
export async function generateFullEventPlan(eventDetails, customKey = null) {
  const apiKey = getActiveApiKey(customKey);

  if (!apiKey) {
    // Graceful offline fallback
    const fallback = generateAlgorithmicPlan(eventDetails);
    return {
      ...fallback,
      generationMode: 'demo',
      aiModelUsed: 'EventGenie Algorithmic Planning Engine (Offline / Demo Mode)'
    };
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const prompt = buildFullPlanPrompt(eventDetails);

  try {
    const rawJsonText = await callGeminiWithRetry(apiKey, modelName, prompt);
    const parsed = parseAndSanitizeJson(rawJsonText);

    // Apply strict programmatic calculations on returned data
    const calculatedBudget = calculateBudget(
      eventDetails.totalBudget,
      parsed.budget?.categories || [],
      eventDetails.currency || 'USD'
    );

    const processedTimeline = processTimeline(
      parsed.timeline?.tasks || [],
      eventDetails.eventDate
    );

    const processedVendors = processVendors(
      parsed.vendors?.vendors || parsed.vendors || []
    );

    const processedIdeas = processCreativeIdeas(
      parsed.creativeIdeas || {}
    );

    return {
      generationMode: 'gemini',
      aiModelUsed: `Google Gemini (${modelName})`,
      concept: parsed.concept || `Personalized event plan for ${eventDetails.eventName}`,
      assumptions: parsed.assumptions || `Plan prepared for ${eventDetails.guestCount} guests with budget ${eventDetails.currency} ${eventDetails.totalBudget}`,
      budget: calculatedBudget,
      timeline: processedTimeline,
      vendors: processedVendors,
      creativeIdeas: processedIdeas
    };
  } catch (error) {
    console.warn(`Gemini AI plan generation failed (${error.message}). Reverting to Algorithmic Engine.`);
    const fallback = generateAlgorithmicPlan(eventDetails);
    return {
      ...fallback,
      generationMode: 'demo',
      aiModelUsed: 'EventGenie Algorithmic Planning Engine (Fallback: API Error)',
      aiErrorNotice: `Live AI generation failed (${sanitizeErrorMessage(error.message)}). Reverted to high-fidelity algorithmic planner.`
    };
  }
}

/**
 * Regenerates a specific section (budget, timeline, vendors, creativeIdeas)
 */
export async function regenerateSection(sectionName, eventDetails, customKey = null) {
  const apiKey = getActiveApiKey(customKey);

  if (!apiKey) {
    const fallback = generateAlgorithmicPlan(eventDetails);
    return {
      section: sectionName,
      data: fallback[sectionName] || fallback.creativeIdeas,
      generationMode: 'demo',
      aiModelUsed: 'EventGenie Algorithmic Engine (Offline / Demo)'
    };
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const prompt = buildSectionPrompt(sectionName, eventDetails);

  try {
    const rawJsonText = await callGeminiWithRetry(apiKey, modelName, prompt);
    const parsed = parseAndSanitizeJson(rawJsonText);

    let processedData;
    if (sectionName === 'budget') {
      processedData = calculateBudget(
        eventDetails.totalBudget,
        parsed.categories || parsed.budget?.categories || [],
        eventDetails.currency || 'USD'
      );
    } else if (sectionName === 'timeline') {
      processedData = processTimeline(
        parsed.tasks || parsed.timeline?.tasks || [],
        eventDetails.eventDate
      );
    } else if (sectionName === 'vendors') {
      processedData = processVendors(
        parsed.vendors || parsed.vendors?.vendors || []
      );
    } else {
      processedData = processCreativeIdeas(parsed);
    }

    return {
      section: sectionName,
      data: processedData,
      generationMode: 'gemini',
      aiModelUsed: `Google Gemini (${modelName})`
    };
  } catch (error) {
    console.warn(`Gemini section generation for ${sectionName} failed (${error.message}). Reverting to fallback.`);
    const fallback = generateAlgorithmicPlan(eventDetails);
    return {
      section: sectionName,
      data: fallback[sectionName] || fallback.creativeIdeas,
      generationMode: 'demo',
      aiModelUsed: 'EventGenie Algorithmic Engine (Fallback)',
      aiErrorNotice: `Section generation failed (${sanitizeErrorMessage(error.message)}). Generated via algorithmic engine.`
    };
  }
}

/**
 * Calls Gemini API with timeout enforcement and exponential backoff.
 */
async function callGeminiWithRetry(apiKey, modelName, prompt, retries = MAX_RETRIES) {
  let attempt = 0;
  let delay = 1000;

  while (attempt <= retries) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      // Timeout wrapper
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out after 25s')), TIMEOUT_MS)
      );

      const apiPromise = model.generateContent(prompt);
      const result = await Promise.race([apiPromise, timeoutPromise]);
      const text = result.response.text();
      return text;
    } catch (err) {
      attempt++;
      if (attempt > retries || isNonRetryableError(err)) {
        throw err;
      }
      console.log(`Gemini API attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

function isNonRetryableError(err) {
  const msg = (err.message || '').toLowerCase();
  return msg.includes('api_key_invalid') || msg.includes('invalid api key') || msg.includes('permission_denied');
}

function sanitizeErrorMessage(msg) {
  if (!msg) return 'Unknown error';
  // Strip any accidental API keys from message
  return msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]').substring(0, 150);
}

function parseAndSanitizeJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI model');
  }

  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Invalid JSON returned by AI model: ${err.message}`);
  }
}

function buildFullPlanPrompt(details) {
  return `You are EventGenie AI, a world-class certified event planning director.
Generate a comprehensive, personalized, realistic event plan in valid JSON format.

EVENT DETAILS:
- Event Type: ${details.eventType || 'Event'}
- Event Name: "${details.eventName}"
- Date: ${details.eventDate} (Times: ${details.startTime || 'TBD'} to ${details.endTime || 'TBD'})
- Location / City: ${details.location}
- Expected Guest Count: ${details.guestCount}
- Total Budget: ${details.currency} ${details.totalBudget}
- Theme / Styling / Colors: ${details.theme || 'None specified'}
- Food Preferences: ${details.foodPreferences || 'None specified'}
- Decoration Preferences: ${details.decorationPreferences || 'None specified'}
- Entertainment Preferences: ${details.entertainmentPreferences || 'None specified'}
- Special Requirements, Cultural or Accessibility Needs: ${details.specialRequirements || 'None'}

REQUIREMENTS:
1. Provide a personalized "concept" and clear "assumptions" describing the event vision.
2. In "budget.categories", provide 7-9 relevant expense categories with:
   - "name": string
   - "allocatedAmount": number (DO NOT use strings, only pure numbers that sum to approx ${details.totalBudget})
   - "notes": string explaining allocation
   - "priority": one of "Critical", "High", "Medium", "Low"
   Ensure one category is an Emergency Contingency Buffer (approx 5-10%).
3. In "timeline.tasks", provide 6-8 chronological preparation milestones leading up to and including event day:
   - "phase": string (e.g., "Phase 1: Foundations", "Phase 2: Vendors", "Event Day")
   - "title": string
   - "description": string
   - "suggestedDeadline": string (YYYY-MM-DD format, chronologically before or on ${details.eventDate})
   - "priority": "Critical" | "High" | "Medium" | "Low"
   - "status": "pending" | "in_progress" | "completed"
   - "assignedTo": string
4. In "vendors.vendors", provide 5-7 categorized vendor requirements:
   - "category": string (e.g., "Venue", "Catering", "Photography", "Audio/Visual", "Decor")
   - "serviceName": string (category/service description, DO NOT invent fake company names or fake phone numbers)
   - "isRequired": boolean
   - "status": "needed" | "researching" | "contacted"
   - "estimatedCost": number
   - "selectionCriteria": string
   - "questionsToAsk": array of 2-3 practical questions
5. In "creativeIdeas", provide:
   - "themeConcepts": array of { "title": string, "description": string, "saved": boolean }
   - "activitiesAndEntertainment": array of { "title": string, "description": string, "saved": boolean }
   - "invitationWording": array of { "title": string, "description": string, "saved": boolean }
   - "guestEngagement": array of { "title": string, "description": string, "saved": boolean }
   - "foodAndPresentation": array of { "title": string, "description": string, "saved": boolean }
   - "budgetFriendlyAlternatives": array of { "title": string, "description": string, "saved": boolean }
   - "weatherBackupPlan": array of { "title": string, "description": string, "saved": boolean }

Return ONLY valid JSON matching this structure.`;
}

function buildSectionPrompt(section, details) {
  return `You are EventGenie AI.
Regenerate fresh, imaginative, and practical items for the "${section}" section of "${details.eventName}" (${details.eventType}).
Location: ${details.location}, Guests: ${details.guestCount}, Budget: ${details.currency} ${details.totalBudget}, Date: ${details.eventDate}.
Theme: ${details.theme || 'Modern'}.

Return ONLY valid JSON with the specific section structure matching EventGenie standards.`;
}
