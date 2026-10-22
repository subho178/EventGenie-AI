/**
 * Vendor and Service Checklist Manager
 * Handles vendor requirement categorizations, status tracking, selection criteria,
 * and programmatic validation without fabricating fake businesses or phone numbers.
 */

import { sanitizeAmount } from './budgetCalculator.js';

export const VENDOR_STATUSES = ['needed', 'researching', 'contacted', 'booked', 'confirmed'];

/**
 * Normalizes and processes vendor checklist items.
 * @param {Array} vendors - Raw vendor requirement objects
 * @returns {object} Processed vendor items and statistics
 */
export function processVendors(vendors = []) {
  if (!Array.isArray(vendors)) {
    vendors = [];
  }

  let totalEstimatedCost = 0;
  let bookedCount = 0;
  let neededCount = 0;
  let requiredCount = 0;
  let optionalCount = 0;

  const processed = vendors.map((v, index) => {
    const id = v.id || `vendor-${index + 1}-${Date.now()}`;
    const category = (v.category || 'General Service').trim();
    const serviceName = (v.serviceName || v.name || 'Vendor Requirement').trim();
    const isRequired = v.isRequired !== undefined ? Boolean(v.isRequired) : true;
    
    let status = (v.status || 'needed').toLowerCase();
    if (!VENDOR_STATUSES.includes(status)) {
      status = 'needed';
    }

    const estimatedCost = sanitizeAmount(v.estimatedCost || 0);
    totalEstimatedCost += estimatedCost;

    if (status === 'booked' || status === 'confirmed') {
      bookedCount++;
    } else {
      neededCount++;
    }

    if (isRequired) requiredCount++;
    else optionalCount++;

    return {
      id,
      category,
      serviceName,
      isRequired,
      status, // needed, researching, contacted, booked, confirmed
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
      completed: status === 'confirmed' || status === 'booked'
    };
  });

  const totalVendors = processed.length;
  const bookingProgressPercent = totalVendors > 0 
    ? Math.round((bookedCount / totalVendors) * 100) 
    : 0;

  return {
    vendors: processed,
    totalVendors,
    bookedCount,
    neededCount,
    requiredCount,
    optionalCount,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    bookingProgressPercent
  };
}
