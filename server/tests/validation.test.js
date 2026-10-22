import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventInputSchema, BudgetCategoryUpdateSchema } from '../validation/eventSchema.js';

describe('Validation Schemas Unit Tests', () => {
  it('should accept valid event payload', () => {
    const validData = {
      eventType: 'wedding',
      eventName: 'Sarah & Alex Ceremony',
      eventDate: '2026-11-20',
      location: 'San Francisco, CA',
      guestCount: 85,
      totalBudget: 15000,
      currency: 'USD'
    };

    const res = EventInputSchema.safeParse(validData);
    assert.equal(res.success, true);
  });

  it('should reject invalid date format', () => {
    const invalidDate = {
      eventType: 'birthday',
      eventName: 'Leo 30th Birthday',
      eventDate: '20-11-2026', // wrong format
      location: 'Miami, FL',
      guestCount: 40,
      totalBudget: 3000
    };

    const res = EventInputSchema.safeParse(invalidDate);
    assert.equal(res.success, false);
    assert.ok(res.error.format().eventDate, 'Should flag invalid eventDate');
  });

  it('should reject non-positive guest counts and negative budgets', () => {
    const invalidNumbers = {
      eventType: 'birthday',
      eventName: 'Party',
      eventDate: '2026-10-10',
      location: 'Austin',
      guestCount: 0, // invalid: must be >= 1
      totalBudget: -500 // invalid: must be >= 0
    };

    const res = EventInputSchema.safeParse(invalidNumbers);
    assert.equal(res.success, false);
    assert.ok(res.error.format().guestCount);
    assert.ok(res.error.format().totalBudget);
  });

  it('should validate budget category updates', () => {
    const cat = {
      name: 'Entertainment',
      allocatedAmount: 1200,
      priority: 'High'
    };
    const res = BudgetCategoryUpdateSchema.safeParse(cat);
    assert.equal(res.success, true);
  });
});
