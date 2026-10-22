import React, { useState } from 'react';
import { 
  Printer, Download, FileText, Share2, Check, 
  Copy, Sparkles, DollarSign, Calendar, ShieldCheck 
} from 'lucide-react';
import { formatMoney } from '../api';

export default function ExportHub({ event }) {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const currency = event.currency || 'USD';
  const budget = event.budget || {};
  const timeline = event.timeline || {};
  const vendors = event.vendors || {};
  const ideas = event.creativeIdeas || {};

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    let summaryText = `🧞 EVENTGENIE AI PLAN: ${event.eventName}\n`;
    summaryText += `Event Type: ${event.eventType.toUpperCase()}\n`;
    summaryText += `Date: ${event.eventDate} ${event.startTime ? `(${event.startTime} - ${event.endTime || 'End'})` : ''}\n`;
    summaryText += `Location: ${event.location}\n`;
    summaryText += `Guests: ${event.guestCount}\n`;
    summaryText += `Total Budget: ${formatMoney(event.totalBudget, currency)} (Allocated: ${formatMoney(budget.totalAllocated || 0, currency)}, Left: ${formatMoney(budget.remainingBalance || 0, currency)})\n\n`;
    
    summaryText += `VISION & CONCEPT:\n${event.summary?.concept || ''}\n\n`;

    summaryText += `PREPARATION MILESTONES (${timeline.progressPercent}% Completed):\n`;
    (timeline.tasks || []).forEach(t => {
      summaryText += `• [${t.status.toUpperCase()}] ${t.title} (Due: ${t.suggestedDeadline || 'TBD'}) - ${t.assignedTo || 'Unassigned'}\n`;
    });
    summaryText += `\n`;

    summaryText += `VENDOR REQUIREMENTS:\n`;
    (vendors.vendors || []).forEach(v => {
      summaryText += `• [${v.status.toUpperCase()}] ${v.serviceName} (${v.category}) - Est: ${formatMoney(v.estimatedCost, currency)}\n`;
    });
    summaryText += `\nGenerated via EventGenie AI.`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Export Actions */}
      <div className="action-buttons-no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={24} color="var(--color-primary-light)" />
            <span>Export & Share Hub</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Export your complete event plan to Markdown, raw JSON backup, or print directly to PDF.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePrint}
            id="btn-print-plan"
          >
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>

          <a
            href={`/api/export/${event.id}/markdown`}
            download
            className="btn btn-secondary btn-sm"
            id="btn-export-markdown"
          >
            <Download size={15} />
            <span>Download Markdown (.md)</span>
          </a>

          <a
            href={`/api/export/${event.id}/json`}
            download
            className="btn btn-secondary btn-sm"
            id="btn-export-json"
          >
            <Download size={15} />
            <span>Download JSON</span>
          </a>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopySummary}
            id="btn-copy-summary"
          >
            {copied ? (
              <>
                <Check size={15} color="var(--color-success)" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 size={15} />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Document Preview */}
      <div className="glass-card" style={{ padding: '2.5rem', background: 'var(--bg-card-solid)', border: '1px solid var(--border-glass)' }}>
        <div style={{ borderBottom: '2px solid var(--border-glass)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.45rem' }}>{event.eventType.toUpperCase()}</span>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{event.eventName}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {event.location} • {event.eventDate} {event.startTime ? `(${event.startTime} - ${event.endTime})` : ''} • {event.guestCount} Guests
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>GENERATED VIA</div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{event.aiModelUsed || 'EventGenie AI'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {event.generationMode === 'gemini' ? 'Live Gemini AI' : 'Algorithmic Mode'}</div>
            </div>
          </div>

          {event.summary?.concept && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)' }}>
              <strong>Event Concept:</strong> {event.summary.concept}
              {event.summary.assumptions && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                  <em>Assumptions:</em> {event.summary.assumptions}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budget Breakdown Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <DollarSign size={18} color="var(--color-primary-light)" />
            <span>Budget Allocation Breakdown</span>
          </h3>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <div>Total Budget: <strong>{formatMoney(event.totalBudget, currency)}</strong></div>
            <div>Total Allocated: <strong>{formatMoney(budget.totalAllocated || 0, currency)}</strong></div>
            <div>Remaining Contingency: <strong style={{ color: budget.isOverBudget ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatMoney(budget.remainingBalance || 0, currency)}</strong></div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 0' }}>Category</th>
                <th style={{ padding: '0.5rem 0' }}>Allocated Amount</th>
                <th style={{ padding: '0.5rem 0' }}>% of Budget</th>
                <th style={{ padding: '0.5rem 0' }}>Priority</th>
                <th style={{ padding: '0.5rem 0' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(budget.categories || []).map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ padding: '0.5rem 0' }}>{formatMoney(cat.allocatedAmount, currency)}</td>
                  <td style={{ padding: '0.5rem 0' }}>{cat.percentOfBudget}%</td>
                  <td style={{ padding: '0.5rem 0' }}>{cat.priority}</td>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>{cat.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preparation Timeline Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Calendar size={18} color="var(--color-secondary)" />
            <span>Preparation Milestones ({timeline.progressPercent || 0}% Complete)</span>
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 0' }}>Status</th>
                <th style={{ padding: '0.5rem 0' }}>Milestone Task</th>
                <th style={{ padding: '0.5rem 0' }}>Phase</th>
                <th style={{ padding: '0.5rem 0' }}>Suggested Deadline</th>
                <th style={{ padding: '0.5rem 0' }}>Priority</th>
                <th style={{ padding: '0.5rem 0' }}>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {(timeline.tasks || []).map((task) => (
                <tr key={task.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '0.5rem 0' }}>
                    <span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-neutral'}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{task.title}</td>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>{task.phase}</td>
                  <td style={{ padding: '0.5rem 0' }}>{task.suggestedDeadline || 'Flexible'}</td>
                  <td style={{ padding: '0.5rem 0' }}>{task.priority}</td>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>{task.assignedTo || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vendors Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldCheck size={18} color="#34d399" />
            <span>Vendor & Service Requirements</span>
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 0' }}>Status</th>
                <th style={{ padding: '0.5rem 0' }}>Service</th>
                <th style={{ padding: '0.5rem 0' }}>Category</th>
                <th style={{ padding: '0.5rem 0' }}>Est. Cost</th>
                <th style={{ padding: '0.5rem 0' }}>Contact / Notes</th>
              </tr>
            </thead>
            <tbody>
              {(vendors.vendors || []).map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '0.5rem 0' }}>
                    <span className={`badge ${v.status === 'booked' || v.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                      {v.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{v.serviceName}</td>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>{v.category}</td>
                  <td style={{ padding: '0.5rem 0' }}>{formatMoney(v.estimatedCost, currency)}</td>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>{v.contactName ? `${v.contactName} (${v.contactDetails})` : 'TBD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Creative Ideas */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={18} color="#ec4899" />
            <span>Featured Creative Ideas</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {Object.entries(ideas).flatMap(([catKey, items]) => 
              (items || []).filter(item => item.saved).map(idea => (
                <div key={idea.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{idea.title}</div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{idea.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
