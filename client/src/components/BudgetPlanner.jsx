import React, { useState } from 'react';
import { 
  DollarSign, Plus, Trash2, AlertTriangle, TrendingDown, 
  Lightbulb, Check, RefreshCw, Sparkles, AlertCircle 
} from 'lucide-react';
import { formatMoney } from '../api';

export default function BudgetPlanner({ event, onUpdateEvent, onRegenerateSection, isRegenerating }) {
  const budget = event.budget || {};
  const categories = budget.categories || [];
  const currency = event.currency || 'USD';

  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [newCatPriority, setNewCatPriority] = useState('Medium');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Programmatic live recalculation whenever a category is modified
  const handleAmountChange = (catId, newAmountStr) => {
    const rawNum = parseFloat(newAmountStr);
    const safeAmount = isNaN(rawNum) || rawNum < 0 ? 0 : Math.round(rawNum * 100) / 100;

    const updatedCategories = categories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, allocatedAmount: safeAmount, estimatedCost: safeAmount };
      }
      return cat;
    });

    recalculateAndNotify(updatedCategories);
  };

  const handleNotesChange = (catId, newNotes) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, notes: newNotes };
      }
      return cat;
    });
    recalculateAndNotify(updatedCategories);
  };

  const handleDeleteCategory = (catId) => {
    const updatedCategories = categories.filter(c => c.id !== catId);
    recalculateAndNotify(updatedCategories);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const amountNum = parseFloat(newCatAmount) || 0;
    const newCategory = {
      id: `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      allocatedAmount: Math.max(0, amountNum),
      estimatedCost: Math.max(0, amountNum),
      notes: 'Custom user-added expense category',
      priority: newCatPriority,
      isEstimate: false
    };

    const updatedCategories = [...categories, newCategory];
    setNewCatName('');
    setNewCatAmount('');
    setShowAddForm(false);
    recalculateAndNotify(updatedCategories);
  };

  const recalculateAndNotify = (cats) => {
    // Perform pure application-code arithmetic
    const totalBudget = Math.max(0, parseFloat(event.totalBudget) || 0);
    let totalAllocated = 0;

    cats.forEach(c => {
      totalAllocated += (c.allocatedAmount || 0);
    });

    totalAllocated = Math.round(totalAllocated * 100) / 100;
    const remainingBalance = Math.round((totalBudget - totalAllocated) * 100) / 100;
    const isOverBudget = remainingBalance < 0;
    const overspentAmount = isOverBudget ? Math.abs(remainingBalance) : 0;
    const budgetUtilizationPercent = totalBudget > 0 
      ? Math.round((totalAllocated / totalBudget) * 1000) / 10 
      : 0;

    const processedCats = cats.map(c => ({
      ...c,
      percentOfBudget: totalBudget > 0 ? Math.round((c.allocatedAmount / totalBudget) * 1000) / 10 : 0,
      percentOfSpend: totalAllocated > 0 ? Math.round((c.allocatedAmount / totalAllocated) * 1000) / 10 : 0
    }));

    const updatedBudget = {
      ...budget,
      totalBudget,
      totalAllocated,
      remainingBalance,
      isOverBudget,
      overspentAmount,
      budgetUtilizationPercent,
      categories: processedCats
    };

    onUpdateEvent({ budget: updatedBudget });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <DollarSign size={24} color="var(--color-primary-light)" />
            <span>Smart Budget Planner</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            All calculations computed programmatically in application code. Real-time reallocation and deficit safeguards.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onRegenerateSection('budget')}
            disabled={isRegenerating}
            id="btn-regenerate-budget"
          >
            <RefreshCw size={14} className={isRegenerating ? 'spin' : ''} />
            <span>AI Reallocate</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(true)}
            id="btn-add-budget-cat"
          >
            <Plus size={14} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Overbudget Warning Alert */}
      {budget.isOverBudget && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5'
        }} role="alert">
          <AlertTriangle size={24} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Potential Overspending Detected!
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              Your allocated expenses exceed the designated total budget by <strong>{formatMoney(budget.overspentAmount, currency)}</strong> ({budget.budgetUtilizationPercent}% utilization).
              Review the cost-saving recommendations below.
            </div>
          </div>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid-3">
        <div className="stat-card">
          <span className="stat-label">Total Designated Budget</span>
          <div className="stat-value">{formatMoney(budget.totalBudget || event.totalBudget || 0, currency)}</div>
          <span className="stat-subtitle">Fixed spending cap defined for this event</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Estimated Spend</span>
          <div className="stat-value" style={{ color: budget.isOverBudget ? 'var(--color-danger)' : 'var(--text-main)' }}>
            {formatMoney(budget.totalAllocated || 0, currency)}
          </div>
          <div className="progress-container">
            <div
              className={`progress-fill ${budget.isOverBudget ? 'progress-fill-danger' : ''}`}
              style={{ width: `${Math.min(100, budget.budgetUtilizationPercent || 0)}%` }}
            />
          </div>
          <span className="stat-subtitle" style={{ marginTop: '0.45rem' }}>
            {budget.budgetUtilizationPercent || 0}% of total budget allocated
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Remaining Contingency Balance</span>
          <div 
            className="stat-value" 
            style={{ color: budget.isOverBudget ? 'var(--color-danger)' : 'var(--color-success)' }}
          >
            {budget.isOverBudget 
              ? `-${formatMoney(budget.overspentAmount, currency)}` 
              : formatMoney(budget.remainingBalance, currency)}
          </div>
          <span className="stat-subtitle">
            {budget.isOverBudget ? 'Deficit to be balanced' : 'Available safety cushion & unallocated funds'}
          </span>
        </div>
      </div>

      {/* Add Category Inline Modal / Form */}
      {showAddForm && (
        <div className="glass-card" style={{ border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem' }}>Add Custom Expense Category</h3>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-label" htmlFor="newCatName">Category Name</label>
              <input
                id="newCatName"
                type="text"
                className="form-control"
                placeholder="e.g. Wedding Favors or Sound Engineer"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                required
              />
            </div>

            <div style={{ width: '150px' }}>
              <label className="form-label" htmlFor="newCatAmount">Allocated Amount ({currency})</label>
              <input
                id="newCatAmount"
                type="number"
                min="0"
                step="10"
                className="form-control"
                placeholder="500"
                value={newCatAmount}
                onChange={e => setNewCatAmount(e.target.value)}
                required
              />
            </div>

            <div style={{ width: '130px' }}>
              <label className="form-label" htmlFor="newCatPriority">Priority</label>
              <select
                id="newCatPriority"
                className="form-control"
                value={newCatPriority}
                onChange={e => setNewCatPriority(e.target.value)}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">Add Category</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                <th style={{ padding: '0.85rem 1rem', width: '180px' }}>Allocated Amount ({currency})</th>
                <th style={{ padding: '0.85rem 1rem', width: '140px' }}>% of Budget</th>
                <th style={{ padding: '0.85rem 1rem', width: '110px' }}>Priority</th>
                <th style={{ padding: '0.85rem 1rem' }}>Notes & Scope</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '60px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{cat.name}</span>
                      {cat.isEstimate && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          Est
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      className="form-control"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}
                      value={cat.allocatedAmount}
                      onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                      aria-label={`Allocated amount for ${cat.name}`}
                    />
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{cat.percentOfBudget}%</span>
                      <div className="progress-container" style={{ width: '60px', height: '5px', margin: 0 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(100, cat.percentOfBudget)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${
                      cat.priority === 'Critical' ? 'badge-danger' : 
                      cat.priority === 'High' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {cat.priority || 'Medium'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: 'transparent' }}
                      value={cat.notes || ''}
                      onChange={(e) => handleNotesChange(cat.id, e.target.value)}
                      placeholder="Add details, quotes or specifications..."
                      aria-label={`Notes for ${cat.name}`}
                    />
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      style={{ width: '30px', height: '30px', color: 'var(--color-danger)' }}
                      onClick={() => handleDeleteCategory(cat.id)}
                      title={`Remove ${cat.name}`}
                      aria-label={`Remove category ${cat.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.785rem', color: 'var(--text-muted)' }}>
          <span>* Clearly labeled: All category costs shown are AI and heuristic estimates, not binding vendor quotes.</span>
          {isSaved && (
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={14} /> Recalculated & saved
            </span>
          )}
        </div>
      </div>

      {/* Practical Cost-Saving Recommendations */}
      {budget.costSavingTips && budget.costSavingTips.length > 0 && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={20} color="var(--color-accent-amber)" />
            <span>Actionable Cost-Saving Recommendations</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {budget.costSavingTips.map((tip, idx) => (
              <div 
                key={tip.id || idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: tip.type === 'critical' ? 'var(--color-danger-bg)' : 'rgba(245, 158, 11, 0.08)',
                  border: tip.type === 'critical' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.3rem', color: tip.type === 'critical' ? '#fca5a5' : '#fde68a' }}>
                  {tip.title}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                  {tip.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
