import React from 'react';
import { 
  Calendar, MapPin, Users, DollarSign, CheckCircle2, Clock, 
  Sparkles, ArrowRight, AlertTriangle, ShieldCheck, Heart, Trash2 
} from 'lucide-react';
import { formatMoney } from '../api';

export default function Dashboard({ event, onNavigateTab, onDeleteEvent }) {
  if (!event) return null;

  const budget = event.budget || {};
  const timeline = event.timeline || {};
  const vendors = event.vendors || {};
  const creativeIdeas = event.creativeIdeas || {};
  const currency = event.currency || 'USD';

  // Count saved ideas across all categories
  let savedIdeasCount = 0;
  Object.values(creativeIdeas).forEach(list => {
    if (Array.isArray(list)) {
      savedIdeasCount += list.filter(item => item.saved).length;
    }
  });

  // Calculate upcoming / overdue critical tasks
  const pendingTasks = (timeline.tasks || []).filter(t => t.status !== 'completed');
  const criticalPending = pendingTasks.filter(t => t.priority === 'Critical');

  // Vendor count needed
  const unbookedVendors = (vendors.vendors || []).filter(v => v.status === 'needed' || v.status === 'researching');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Event Hero Banner */}
      <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-primary">{event.eventType.toUpperCase()}</span>
                {timeline.daysUntilEvent !== null && (
                  <span className={`badge ${timeline.daysUntilEvent >= 0 ? 'badge-success' : 'badge-warning'}`}>
                    <Clock size={12} />
                    {timeline.daysUntilEvent >= 0 ? `${timeline.daysUntilEvent} days remaining` : `${Math.abs(timeline.daysUntilEvent)} days past`}
                  </span>
                )}
                <span className="badge badge-neutral">{event.aiModelUsed || 'AI Planner'}</span>
              </div>
              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>{event.eventName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} />
                  {event.eventDate} {event.startTime ? `at ${event.startTime}` : ''}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={15} />
                  {event.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={15} />
                  {event.guestCount} Guests
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete the plan "${event.eventName}"?`)) {
                    onDeleteEvent(event.id);
                  }
                }}
                title="Delete this event plan"
                id="btn-delete-event"
              >
                <Trash2 size={15} />
                <span>Delete Plan</span>
              </button>
            </div>
          </div>

          {/* AI Concept Box */}
          {event.summary?.concept && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-primary-light)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                <Sparkles size={14} />
                <span>PERSONALIZED CONCEPT & VISION</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {event.summary.concept}
              </p>
              {event.summary.assumptions && (
                <p style={{ fontSize: '0.785rem', color: 'var(--text-dim)', marginTop: '0.45rem', fontStyle: 'italic' }}>
                  Planning Assumptions: {event.summary.assumptions}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid-4">
        {/* Total Budget Card */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('budget')}>
          <div className="stat-header">
            <span className="stat-label">Budget Allocated</span>
            <DollarSign size={20} color="var(--color-primary-light)" />
          </div>
          <div>
            <div className="stat-value">{formatMoney(budget.totalAllocated || 0, currency)}</div>
            <div className="progress-container">
              <div 
                className={`progress-fill ${budget.isOverBudget ? 'progress-fill-danger' : ''}`}
                style={{ width: `${Math.min(100, budget.budgetUtilizationPercent || 0)}%` }}
              />
            </div>
            <div className="stat-subtitle" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem' }}>
              <span>Cap: {formatMoney(event.totalBudget || 0, currency)}</span>
              <span style={{ color: budget.isOverBudget ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                {budget.isOverBudget ? `Over: ${formatMoney(budget.overspentAmount, currency)}` : `Left: ${formatMoney(budget.remainingBalance, currency)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Progress Card */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('timeline')}>
          <div className="stat-header">
            <span className="stat-label">Milestones Done</span>
            <Calendar size={20} color="var(--color-secondary)" />
          </div>
          <div>
            <div className="stat-value">{timeline.progressPercent || 0}%</div>
            <div className="progress-container">
              <div 
                className="progress-fill"
                style={{ width: `${timeline.progressPercent || 0}%`, background: 'linear-gradient(90deg, var(--color-secondary), #3b82f6)' }}
              />
            </div>
            <div className="stat-subtitle" style={{ marginTop: '0.45rem' }}>
              {timeline.completedCount || 0} of {timeline.totalTasks || 0} tasks completed ({timeline.pendingCount || 0} pending)
            </div>
          </div>
        </div>

        {/* Vendor Checklist Card */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('vendors')}>
          <div className="stat-header">
            <span className="stat-label">Vendor Booking</span>
            <ShieldCheck size={20} color="#34d399" />
          </div>
          <div>
            <div className="stat-value">{vendors.bookedCount || 0} / {vendors.totalVendors || 0}</div>
            <div className="progress-container">
              <div 
                className="progress-fill"
                style={{ width: `${vendors.bookingProgressPercent || 0}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
              />
            </div>
            <div className="stat-subtitle" style={{ marginTop: '0.45rem' }}>
              {unbookedVendors.length} services still need research or booking
            </div>
          </div>
        </div>

        {/* Saved Ideas Card */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('ideas')}>
          <div className="stat-header">
            <span className="stat-label">Creative Concepts</span>
            <Sparkles size={20} color="#ec4899" />
          </div>
          <div>
            <div className="stat-value">{savedIdeasCount}</div>
            <div className="stat-subtitle" style={{ marginTop: '0.45rem' }}>
              Bookmarked concepts in theme, decor, food & engagement
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Sections Quick Access */}
      <div className="grid-2">
        {/* Next Priority Tasks */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--color-primary-light)" />
              <span>Upcoming Milestones</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('timeline')}>
              View All ({timeline.totalTasks || 0}) <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(timeline.tasks || []).slice(0, 4).map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: task.status === 'completed' ? 'var(--text-dim)' : 'var(--text-main)'
                    }}>
                      {task.title}
                    </span>
                    {task.priority === 'Critical' && (
                      <span className="badge badge-danger">Critical</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Deadline: {task.suggestedDeadline || 'Flexible'} {task.assignedTo ? `• ${task.assignedTo}` : ''}
                  </span>
                </div>
                <span className={`badge ${task.status === 'completed' ? 'badge-success' : task.status === 'in_progress' ? 'badge-warning' : 'badge-neutral'}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Vendor Checkpoints */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--color-secondary)" />
              <span>Vendor Requirements</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('vendors')}>
              Manage Vendors ({vendors.totalVendors || 0}) <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(vendors.vendors || []).slice(0, 4).map((vendor) => (
              <div
                key={vendor.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{vendor.serviceName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {vendor.category} • Est: {formatMoney(vendor.estimatedCost, currency)}
                  </div>
                </div>
                <span className={`badge ${vendor.status === 'booked' || vendor.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                  {vendor.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
