/**
 * Budget Calculator Service
 * CRITICAL FINANCIAL CORRECTNESS:
 * All arithmetic, percentage calculations, remaining balances, and overspend detections
 * are computed programmatically in application code. Never rely on LLM arithmetic.
 */

/**
 * Validates and sanitizes a monetary number.
 * Ensures non-negative finite numeric values.
 */
export function sanitizeAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num * 100) / 100);
}

/**
 * Computes full budget breakdown, recalculating all sums, percentages,
 * remaining balances, overspend status, and cost-saving suggestions.
 * 
 * @param {number} totalBudget - Total user-specified budget
 * @param {Array} categories - Array of { id, name, allocatedAmount, estimatedCost, notes, priority }
 * @param {string} currency - Currency code/symbol (default: USD)
 * @returns {object} Calculated budget metrics
 */
export function calculateBudget(totalBudget, categories = [], currency = 'USD') {
  const safeTotalBudget = sanitizeAmount(totalBudget);
  
  if (!Array.isArray(categories)) {
    categories = [];
  }

  let totalAllocated = 0;
  let totalEstimated = 0;

  // First pass: sanitize each category and sum totals
  const sanitizedCategories = categories.map((cat, index) => {
    const id = cat.id || `cat-${index + 1}-${Date.now()}`;
    const name = (cat.name || 'Uncategorized Expense').trim();
    const allocatedAmount = sanitizeAmount(cat.allocatedAmount ?? cat.amount ?? 0);
    const estimatedCost = sanitizeAmount(cat.estimatedCost ?? allocatedAmount);
    
    totalAllocated += allocatedAmount;
    totalEstimated += estimatedCost;

    return {
      ...cat,
      id,
      name,
      allocatedAmount,
      estimatedCost,
      isEstimate: true,
      notes: cat.notes || '',
      priority: cat.priority || 'Medium' // High, Medium, Low, Essential
    };
  });

  // Round sums to 2 decimal places to avoid floating point issues
  totalAllocated = Math.round(totalAllocated * 100) / 100;
  totalEstimated = Math.round(totalEstimated * 100) / 100;

  // Second pass: compute percentage of total budget and percentage of total spend
  const processedCategories = sanitizedCategories.map(cat => {
    const percentOfBudget = safeTotalBudget > 0 
      ? Math.round((cat.allocatedAmount / safeTotalBudget) * 1000) / 10 
      : 0;
    const percentOfSpend = totalAllocated > 0 
      ? Math.round((cat.allocatedAmount / totalAllocated) * 1000) / 10 
      : 0;

    return {
      ...cat,
      percentOfBudget,
      percentOfSpend
    };
  });

  const remainingBalance = Math.round((safeTotalBudget - totalAllocated) * 100) / 100;
  const isOverBudget = remainingBalance < 0;
  const overspentAmount = isOverBudget ? Math.abs(remainingBalance) : 0;
  const budgetUtilizationPercent = safeTotalBudget > 0 
    ? Math.round((totalAllocated / safeTotalBudget) * 1000) / 10 
    : 0;

  // Generate automated cost-saving recommendations based on financial breakdown
  const costSavingTips = generateCostSavingTips(
    safeTotalBudget,
    totalAllocated,
    processedCategories,
    remainingBalance
  );

  return {
    totalBudget: safeTotalBudget,
    totalAllocated,
    totalEstimated,
    remainingBalance,
    isOverBudget,
    overspentAmount,
    budgetUtilizationPercent,
    currency,
    categories: processedCategories,
    costSavingTips,
    disclaimer: 'All category costs shown are AI and heuristic estimates, not binding vendor quotes.'
  };
}

/**
 * Generates actionable cost-saving recommendations based on budget analytics.
 */
function generateCostSavingTips(totalBudget, totalAllocated, categories, remainingBalance) {
  const tips = [];

  if (remainingBalance < 0) {
    tips.push({
      id: 'tip-overbudget',
      type: 'critical',
      title: 'Budget Deficit Alert',
      message: `You are currently ${Math.abs(remainingBalance)} over budget. Consider trimming negotiable categories like decoration or entertainment by 10-15%.`
    });
  }

  // Find top spending categories
  const sorted = [...categories].sort((a, b) => b.allocatedAmount - a.allocatedAmount);
  if (sorted.length > 0 && sorted[0].allocatedAmount > 0) {
    const top = sorted[0];
    if (top.percentOfBudget > 40) {
      tips.push({
        id: 'tip-top-spend',
        type: 'warning',
        title: `High Allocation in ${top.name}`,
        message: `${top.name} accounts for ${top.percentOfBudget}% of your total budget. Negotiating package bundles or flexible timing could free up significant funds.`
      });
    }
  }

  // Check for contingency / emergency category
  const hasContingency = categories.some(c => 
    /contingency|emergency|buffer|miscellaneous/i.test(c.name)
  );
  if (!hasContingency) {
    tips.push({
      id: 'tip-contingency',
      type: 'recommendation',
      title: 'Add a 5-10% Emergency Contingency Buffer',
      message: 'Unforeseen expenses (taxes, tips, last-minute vendor additions) commonly occur. Setting aside 5-10% prevents unexpected stress.'
    });
  }

  // Catering check
  const catering = categories.find(c => /cater|food|refreshment|beverage|dining/i.test(c.name));
  if (catering && catering.percentOfBudget > 35) {
    tips.push({
      id: 'tip-catering',
      type: 'recommendation',
      title: 'Buffet vs Plated Service Savings',
      message: 'Opting for themed buffet stations or curated family-style courses rather than multi-course plated service can reduce staffing and food costs by up to 20%.'
    });
  }

  // Photography / Entertainment check
  const photo = categories.find(c => /photo|video/i.test(c.name));
  if (photo && photo.percentOfBudget > 15) {
    tips.push({
      id: 'tip-photo',
      type: 'recommendation',
      title: 'Flexible Photography Coverage',
      message: 'Hire photographers for key highlight windows (ceremony, speeches, first hour of reception) rather than all-day coverage to trim hourly rates.'
    });
  }

  return tips;
}

/**
 * Format currency with international locale formatting.
 */
export function formatCurrency(amount, currency = 'USD') {
  const safe = sanitizeAmount(amount);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2
    }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
}
