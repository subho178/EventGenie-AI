/**
 * AI Routes
 * Endpoints for AI status, section regeneration, and model validation.
 */

import express from 'express';
import { isGeminiConfigured, regenerateSection, getActiveApiKey } from '../services/geminiService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

/**
 * GET /api/ai/status
 * Returns current AI configuration state and model information.
 */
router.get('/status', (req, res) => {
  const customKey = req.headers['x-gemini-api-key'] || null;
  const configured = isGeminiConfigured(customKey);
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  res.json({
    success: true,
    geminiConfigured: configured,
    modelName: configured ? model : 'EventGenie Algorithmic Planning Engine',
    activeMode: configured ? 'live_gemini' : 'algorithmic_fallback',
    supportsCustomKey: true,
    availableEventTypes: [
      'wedding',
      'birthday',
      'college event',
      'community celebration',
      'anniversary',
      'custom'
    ]
  });
});

/**
 * POST /api/ai/regenerate-section
 * Task-specific regeneration for budget, timeline, vendors, or creativeIdeas.
 */
router.post('/regenerate-section', async (req, res) => {
  try {
    const { section, eventDetails } = req.body;
    if (!section || !eventDetails) {
      return res.status(400).json({
        success: false,
        error: 'Both "section" and "eventDetails" are required'
      });
    }

    const validSections = ['budget', 'timeline', 'vendors', 'creativeIdeas'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        error: `Invalid section. Must be one of: ${validSections.join(', ')}`
      });
    }

    const customKey = req.headers['x-gemini-api-key'] || null;
    const result = await regenerateSection(section, eventDetails, customKey);

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Section regeneration error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate section'
    });
  }
});

/**
 * POST /api/ai/test-key
 * Validates a Gemini API key without leaking it.
 */
router.post('/test-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 15) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid key format. Please supply a valid Google Gemini API key.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Ping. Respond with "pong" only.');
    const text = result.response.text();

    res.json({
      success: true,
      valid: true,
      message: 'Gemini API key verified successfully!',
      sampleResponse: text.trim()
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      valid: false,
      message: 'API Key verification failed: ' + (err.message || 'Unauthorized')
    });
  }
});

export default router;
