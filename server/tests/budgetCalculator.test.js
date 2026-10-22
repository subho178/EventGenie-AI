import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAmount, calculateBudget, formatCurrency } from '../services/budgetCalculator.js';

describe('Budget Calculator - Financial Correctness Unit Tests', () => {
  describe('sanitizeAmount', () => {
    it('should return 0 for null, undefined, or empty string', () => {
      assert.equal(sanitizeAmount(null), 0);
      assert.equal(sanitizeAmount(undefined), 0);
      assert.equal(sanitizeAmount(''), 0);
    });

    it('should clamp negative values to 0', () => {
      assert.equal(sanitizeAmount(-150), 0);
      assert.equal(sanitizeAmount('-500'), 0);
    });

    it('should clean string currencies and commas', () => {
      assert.equal(sanitizeAmount('$1,250.50'), 1250.50);
      assert.equal(sanitizeAmount('₹50,000'), 50000);
      assert.equal(sanitizeAmount('450.758'), 450.76);
    });

    it('should return 0 for non-numeric junk', () => {
      assert.equal(sanitizeAmount('abcxyz'), 0);
      assert.equal(sanitizeAmount(NaN), 0);
      assert.equal(sanitizeAmount(Infinity), 0);
    });
  });

  describe('calculateBudget', () => {
    it('should accurately compute totals and remaining balance within budget', () => {
      const totalBudget = 10000;
      const categories = [
        { name: 'Venue', allocatedAmount: 4000 },
        { name: 'Catering', allocatedAmount: 3500 },
        { name: 'Decor', allocatedAmount: 1500 }
      ];

      const result = calculateBudget(totalBudget, categories, 'USD');

      assert.equal(result.totalBudget, 10000);
      assert.equal(result.totalAllocated, 9000);
      assert.equal(result.remainingBalance, 1000);
      assert.equal(result.isOverBudget, false);
      assert.equal(result.overspentAmount, 0);
      assert.equal(result.budgetUtilizationPercent, 90.0);

      // Verify category percentages
      assert.equal(result.categories[0].percentOfBudget, 40.0);
      assert.equal(result.categories[1].percentOfBudget, 35.0);
      assert.equal(result.categories[2].percentOfBudget, 15.0);
    });

    it('should detect and highlight overspending accurately', () => {
      const totalBudget = 5000;
      const categories = [
        { name: 'Venue', allocatedAmount: 3000 },
        { name: 'Catering', allocatedAmount: 3000 }
      ];

      const result = calculateBudget(totalBudget, categories, 'EUR');

      assert.equal(result.totalBudget, 5000);
      assert.equal(result.totalAllocated, 6000);
      assert.equal(result.remainingBalance, -1000);
      assert.equal(result.isOverBudget, true);
      assert.equal(result.overspentAmount, 1000);
      assert.equal(result.budgetUtilizationPercent, 120.0);

      // Verify deficit alert is triggered in cost saving tips
      const overbudgetTip = result.costSavingTips.find(t => t.id === 'tip-overbudget');
      assert.ok(overbudgetTip, 'Must include overbudget critical alert');
    });

    it('should handle zero total budget gracefully without division by zero', () => {
      const result = calculateBudget(0, [{ name: 'Cake', allocatedAmount: 100 }]);
      assert.equal(result.totalBudget, 0);
      assert.equal(result.totalAllocated, 100);
      assert.equal(result.remainingBalance, -100);
      assert.equal(result.budgetUtilizationPercent, 0);
      assert.equal(result.categories[0].percentOfBudget, 0);
    });

    it('should handle empty categories array', () => {
      const result = calculateBudget(5000, []);
      assert.equal(result.totalBudget, 5000);
      assert.equal(result.totalAllocated, 0);
      assert.equal(result.remainingBalance, 5000);
      assert.equal(result.categories.length, 0);
    });
  });

  describe('formatCurrency', () => {
    it('should format standard USD amounts', () => {
      const formatted = formatCurrency(2500, 'USD');
      assert.ok(formatted.includes('2,500'), 'Should format with thousands separator');
    });
  });
});
