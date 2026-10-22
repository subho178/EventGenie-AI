import React, { useState } from 'react';
import { 
  ShieldCheck, Plus, Trash2, RefreshCw, CheckCircle2, 
  HelpCircle, ChevronDown, ChevronUp, UserCheck, Phone, FileText 
} from 'lucide-react';
import { formatMoney } from '../api';

export default function VendorChecklist({ event, onUpdateEvent, onRegenerateSection, isRegenerating }) {
  const vendorsData = event.vendors || {};
  const vendors = vendorsData.vendors || [];
  const currency = event.currency || 'USD';

  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [expandedVendorId, setExpandedVendorId] = useState(null);

  const [newServiceName, setNewServiceName] = useState('');
  const [newCategory, setNewCategory] = useState('General Service');
  const [newEstCost, setNewEstCost] = useState('');
  const [newIsRequired, setNewIsRequired] = useState(true);

  const handleStatusChange = (vendorId, nextStatus) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        return {
          ...v,
          status: nextStatus,
          completed: nextStatus === 'booked' || nextStatus === 'confirmed'
        };
      }
      return v;
    });
    recalculateVendors(updated);
  };

  const handleFieldChange = (vendorId, field, value) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        return { ...v, [field]: value };
      }
      return v;
    });
    recalculateVendors(updated);
  };

  const handleDeleteVendor = (vendorId) => {
    const updated = vendors.filter(v => v.id !== vendorId);
    recalculateVendors(updated);
  };

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newVendor = {
      id: `vendor-custom-${Date.now()}`,
      category: newCategory.trim(),
      serviceName: newServiceName.trim(),
      isRequired: newIsRequired,
      status: 'needed',
      estimatedCost: parseFloat(newEstCost) || 0,
      contactName: '',
      contactDetails: '',
      contractNotes: '',
      selectionCriteria: 'Standard quality check and references verification',
      questionsToAsk: [
        'What is included in the baseline fee?',
        'What are the overtime and cancellation terms?'
      ],
      completed: false
    };

    const updated = [...vendors, newVendor];
    setNewServiceName('');
    setNewEstCost('');
    setShowAddVendor(false);
    recalculateVendors(updated);
  };

  const recalculateVendors = (updatedVendors) => {
    let totalEst = 0;
    let booked = 0;
    let needed = 0;
    let reqCount = 0;
    let optCount = 0;

    updatedVendors.forEach(v => {
      totalEst += (v.estimatedCost || 0);
      if (v.status === 'booked' || v.status === 'confirmed') booked++;
      else needed++;

      if (v.isRequired) reqCount++;
      else optCount++;
    });

    const total = updatedVendors.length;
    const progress = total > 0 ? Math.round((booked / total) * 100) : 0;

    onUpdateEvent({
      vendors: {
        ...vendorsData,
        vendors: updatedVendors,
        totalVendors: total,
        bookedCount: booked,
        neededCount: needed,
        requiredCount: reqCount,
        optionalCount: optCount,
        totalEstimatedCost: Math.round(totalEst * 100) / 100,
        bookingProgressPercent: progress
      }
    });
  };

  const filteredVendors = vendors.filter(v => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'needed') return v.status === 'needed' || v.status === 'researching';
    if (filterStatus === 'booked') return v.status === 'booked' || v.status === 'confirmed';
    return v.status === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck size={24} color="#34d399" />
            <span>Smart Vendor Checklist</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Categorized vendor requirements, practical vetting criteria, and booking pipeline. (No fabricated businesses or fake quotes).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onRegenerateSection('vendors')}
            disabled={isRegenerating}
            id="btn-regenerate-vendors"
          >
            <RefreshCw size={14} className={isRegenerating ? 'spin' : ''} />
            <span>AI Regenerate Checklist</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddVendor(true)}
            id="btn-add-vendor"
          >
            <Plus size={14} />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {vendorsData.bookedCount || 0} of {vendorsData.totalVendors || 0} Services Booked ({vendorsData.bookingProgressPercent || 0}%)
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Total Est. Spend: {formatMoney(vendorsData.totalEstimatedCost || 0, currency)} • {vendorsData.neededCount || 0} pending confirmation
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({vendors.length})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'needed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('needed')}
            >
              Needed ({vendorsData.neededCount || 0})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'booked' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('booked')}
            >
              Booked / Confirmed ({vendorsData.bookedCount || 0})
            </button>
          </div>
        </div>

        <div className="progress-container" style={{ height: '10px', marginTop: '1rem' }}>
          <div
            className="progress-fill"
            style={{
              width: `${vendorsData.bookingProgressPercent || 0}%`,
              background: 'linear-gradient(90deg, #10b981, #06b6d4)'
            }}
          />
        </div>
      </div>

      {/* Add Vendor Form */}
      {showAddVendor && (
        <div className="glass-card" style={{ border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem' }}>Add Service / Vendor Requirement</h3>
          <form onSubmit={handleAddVendor} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-label" htmlFor="newServiceName">Service / Vendor Name</label>
              <input
                id="newServiceName"
                type="text"
                className="form-control"
                placeholder="e.g. Wedding Cake Designer or Photo Booth"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                required
              />
            </div>

            <div style={{ width: '160px' }}>
              <label className="form-label" htmlFor="newCategory">Category</label>
              <input
                id="newCategory"
                type="text"
                className="form-control"
                placeholder="e.g. Catering, Audio, Decor"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              />
            </div>

            <div style={{ width: '130px' }}>
              <label className="form-label" htmlFor="newEstCost">Est. Cost ({currency})</label>
              <input
                id="newEstCost"
                type="number"
                min="0"
                step="50"
                className="form-control"
                placeholder="800"
                value={newEstCost}
                onChange={e => setNewEstCost(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '38px' }}>
              <input
                type="checkbox"
                id="newIsRequired"
                checked={newIsRequired}
                onChange={e => setNewIsRequired(e.target.checked)}
              />
              <label htmlFor="newIsRequired" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Essential</label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">Add Vendor</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddVendor(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vendor Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredVendors.map((vendor) => {
          const isExpanded = expandedVendorId === vendor.id;
          const isBooked = vendor.status === 'booked' || vendor.status === 'confirmed';

          return (
            <div
              key={vendor.id}
              className="glass-card"
              style={{
                borderLeft: isBooked ? '4px solid var(--color-success)' : '4px solid var(--color-warning)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{vendor.serviceName}</h3>
                    <span className="badge badge-neutral">{vendor.category}</span>
                    <span className={`badge ${vendor.isRequired ? 'badge-primary' : 'badge-neutral'}`}>
                      {vendor.isRequired ? 'Required' : 'Optional'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <strong>Selection Criteria:</strong> {vendor.selectionCriteria}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  {/* Status Dropdown */}
                  <div>
                    <label htmlFor={`status-${vendor.id}`} className="sr-only">Status</label>
                    <select
                      id={`status-${vendor.id}`}
                      className="form-control"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.8rem',
                        width: '130px',
                        background: isBooked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        borderColor: isBooked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
                        color: isBooked ? '#34d399' : '#fbbf24',
                        fontWeight: 600
                      }}
                      value={vendor.status}
                      onChange={(e) => handleStatusChange(vendor.id, e.target.value)}
                    >
                      <option value="needed">⏳ Needed</option>
                      <option value="researching">🔍 Researching</option>
                      <option value="contacted">📞 Contacted</option>
                      <option value="booked">📝 Booked</option>
                      <option value="confirmed">✅ Confirmed</option>
                    </select>
                  </div>

                  {/* Estimated Cost */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>Est:</span>
                    <input
                      type="number"
                      min="0"
                      step="25"
                      className="form-control"
                      style={{ width: '100px', padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                      value={vendor.estimatedCost || 0}
                      onChange={(e) => handleFieldChange(vendor.id, 'estimatedCost', parseFloat(e.target.value) || 0)}
                      aria-label={`Estimated cost for ${vendor.serviceName}`}
                    />
                  </div>

                  {/* Accordion Toggle */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setExpandedVendorId(isExpanded ? null : vendor.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>Details</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {/* Delete */}
                  <button
                    className="btn btn-secondary btn-icon"
                    style={{ width: '30px', height: '30px', color: 'var(--color-danger)' }}
                    onClick={() => handleDeleteVendor(vendor.id)}
                    title="Remove vendor requirement"
                    aria-label={`Remove vendor requirement ${vendor.serviceName}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded Details: Questions to ask & Contact info */}
              {isExpanded && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
                  <div className="grid-2">
                    {/* Practical Questions to Ask */}
                    <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.6)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary-light)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                        <HelpCircle size={15} />
                        <span>Recommended Questions to Ask Vendor</span>
                      </div>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {(vendor.questionsToAsk || [
                          'What is included in the base package vs add-ons?',
                          'What is the deposit and cancellation policy?',
                          'Do you carry liability insurance required by venues?'
                        ]).map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact & Contract Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          Vendor Business / Contact Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          placeholder="e.g. Austin Sound & Stage Co. (Marcus)"
                          value={vendor.contactName || ''}
                          onChange={(e) => handleFieldChange(vendor.id, 'contactName', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          Contact Details (Phone / Email / Portfolio Link)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          placeholder="e.g. contact@austinsound.example.com"
                          value={vendor.contactDetails || ''}
                          onChange={(e) => handleFieldChange(vendor.id, 'contactDetails', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          Contract Notes & Special Conditions
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          placeholder="e.g. Deposit paid on May 4th. Arrives at 12:00 PM on event day."
                          value={vendor.contractNotes || ''}
                          onChange={(e) => handleFieldChange(vendor.id, 'contractNotes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
