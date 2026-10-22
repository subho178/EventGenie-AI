import React, { useState } from 'react';
import { Sparkles, X, Wand2, Calendar, MapPin, Users, DollarSign, Palette, Utensils, Music, ShieldCheck } from 'lucide-react';

const PRESETS = [
  {
    label: '💍 Garden Wedding',
    eventType: 'wedding',
    eventName: 'Elena & Lucas Botanical Nuptials',
    eventDate: '2026-10-18',
    startTime: '15:30',
    endTime: '22:30',
    location: 'Emerald Glasshouse, Seattle, WA',
    guestCount: 110,
    totalBudget: 24000,
    currency: 'USD',
    theme: 'Earthy Botanical Romance (Sage Green, Champagne, Eucalyptus)',
    foodPreferences: 'Farm-fresh plated dinner, artisan mocktail bar, vegan dessert options',
    decorationPreferences: 'Potted olive trees, hanging fairy lights, brass lanterns, zero cut foam',
    entertainmentPreferences: 'Live acoustic cello & guitar duo for ceremony, jazz quartet for reception',
    specialRequirements: 'Step-free wheelchair ramp to gazebo, quiet lounge for elder guests'
  },
  {
    label: '🎂 30th Milestone Birthday',
    eventType: 'birthday',
    eventName: 'Jordan’s Retro Arcade & Neon Birthday',
    eventDate: '2026-08-12',
    startTime: '19:00',
    endTime: '01:00',
    location: 'Warehouse District Lounge, Chicago, IL',
    guestCount: 65,
    totalBudget: 6500,
    currency: 'USD',
    theme: '80s Synthwave & Neon Glow (Electric Violet, Cyan, Magenta)',
    foodPreferences: 'Gourmet slider station, truffle fries, custom 2-tier pixel art cake',
    decorationPreferences: 'Custom neon sign with birthday name, retro arcade cabinets, blacklight glow',
    entertainmentPreferences: 'Live DJ playing synthwave and retro pop remixes, retro photo booth',
    specialRequirements: 'High-energy dance floor space, gluten-free snack options'
  },
  {
    label: '💻 Campus Hackathon & Fest',
    eventType: 'college event',
    eventName: 'InnovateAI 2026 National Hackathon',
    eventDate: '2026-11-07',
    startTime: '08:30',
    endTime: '21:30',
    location: 'Engineering Auditorium, MIT Campus, Cambridge, MA',
    guestCount: 250,
    totalBudget: 15000,
    currency: 'USD',
    theme: 'Cybernetic AI & Green Computing (Cyber Green, Obsidian, Silver)',
    foodPreferences: 'Continuous coffee & tea bar, box lunches, midnight pizza delivery',
    decorationPreferences: 'Large LED backdrop walls, directional digital signage, stage trussing',
    entertainmentPreferences: 'Keynote speakers, rapid lightning pitches, electronic ambient music during hacking',
    specialRequirements: '10 Gbps wired network drops, redundant power strips, quiet rest zone'
  },
  {
    label: '🎉 Community Harvest Fair',
    eventType: 'community celebration',
    eventName: 'Maplewood Annual Autumn Community Fair',
    eventDate: '2026-10-03',
    startTime: '10:00',
    endTime: '18:00',
    location: 'Riverside Community Park, Portland, OR',
    guestCount: 400,
    totalBudget: 18000,
    currency: 'USD',
    theme: 'Rustic Harvest & Family Unity (Warm Amber, Terracotta, Forest Green)',
    foodPreferences: 'Local artisan food trucks, fresh apple cider station, kettle corn',
    decorationPreferences: 'Hay bale seating, carved wooden entry arch, autumnal pumpkin displays',
    entertainmentPreferences: 'Local bluegrass bands, kids face painting, community pie-baking contest',
    specialRequirements: 'Accessible portable restrooms, lost child information booth, pet-friendly zones'
  }
];

export default function EventFormModal({ isOpen, onClose, onSubmit, isGenerating }) {
  const [formData, setFormData] = useState({
    eventType: 'wedding',
    eventName: '',
    eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '22:00',
    location: '',
    guestCount: 75,
    totalBudget: 10000,
    currency: 'USD',
    theme: '',
    foodPreferences: '',
    decorationPreferences: '',
    entertainmentPreferences: '',
    specialRequirements: ''
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const applyPreset = (preset) => {
    setFormData({ ...preset });
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!formData.eventName || formData.eventName.trim().length < 2) {
      errs.eventName = 'Please enter an event name (at least 2 characters)';
    }
    if (!formData.eventDate) {
      errs.eventDate = 'Please select a valid event date';
    }
    if (!formData.location || formData.location.trim().length < 2) {
      errs.location = 'Please provide a location or city';
    }
    if (!formData.guestCount || parseInt(formData.guestCount, 10) < 1) {
      errs.guestCount = 'Guest count must be at least 1';
    }
    if (formData.totalBudget === '' || parseFloat(formData.totalBudget) < 0) {
      errs.totalBudget = 'Budget must be a non-negative number';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
              <Wand2 size={20} />
            </div>
            <div>
              <h2 id="modal-title" style={{ fontSize: '1.25rem' }}>Plan a New Event with AI</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Fill in your event vision and let EventGenie build a tailored budget, schedule, and checklist.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onClose} 
            disabled={isGenerating}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Fill Preset Templates */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick-Fill Templates:
          </span>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset(p)}
                disabled={isGenerating}
                style={{ fontSize: '0.75rem' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isGenerating ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div className="brand-icon-box" style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', animation: 'spin 3s linear infinite' }}>
              <Sparkles size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Generating Your Personalized Plan...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
              EventGenie is analyzing guest logistics, computing category allocations, building chronological milestones, and compiling curated creative concepts.
            </p>
            <div className="progress-container" style={{ maxWidth: '300px', margin: '1.5rem auto 0' }}>
              <div className="progress-fill" style={{ width: '80%', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              {/* Event Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="eventType">
                  Event Type <span className="required">*</span>
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  className="form-control"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                >
                  <option value="wedding">💍 Wedding</option>
                  <option value="birthday">🎂 Birthday Celebration</option>
                  <option value="college event">💻 College / Campus Fest</option>
                  <option value="community celebration">🎉 Community Celebration</option>
                  <option value="anniversary">🥂 Anniversary</option>
                  <option value="custom">✨ Custom Event</option>
                </select>
              </div>

              {/* Event Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="eventName">
                  Event Name <span className="required">*</span>
                </label>
                <input
                  id="eventName"
                  name="eventName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Maya & Leo's Celebration"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                />
                {errors.eventName && <p className="form-error">{errors.eventName}</p>}
              </div>
            </div>

            <div className="grid-3">
              {/* Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="eventDate">
                  Event Date <span className="required">*</span>
                </label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  className="form-control"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                />
                {errors.eventDate && <p className="form-error">{errors.eventDate}</p>}
              </div>

              {/* Start Time */}
              <div className="form-group">
                <label className="form-label" htmlFor="startTime">Start Time</label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  className="form-control"
                  value={formData.startTime}
                  onChange={handleChange}
                />
              </div>

              {/* End Time */}
              <div className="form-group">
                <label className="form-label" htmlFor="endTime">End Time</label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  className="form-control"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid-3">
              {/* Location */}
              <div className="form-group">
                <label className="form-label" htmlFor="location">
                  Location / City <span className="required">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Austin, TX or City Botanical Gardens"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
                {errors.location && <p className="form-error">{errors.location}</p>}
              </div>

              {/* Guest Count */}
              <div className="form-group">
                <label className="form-label" htmlFor="guestCount">
                  Estimated Guests <span className="required">*</span>
                </label>
                <input
                  id="guestCount"
                  name="guestCount"
                  type="number"
                  min="1"
                  max="50000"
                  className="form-control"
                  value={formData.guestCount}
                  onChange={handleChange}
                  required
                />
                {errors.guestCount && <p className="form-error">{errors.guestCount}</p>}
              </div>

              {/* Total Budget & Currency */}
              <div className="form-group">
                <label className="form-label" htmlFor="totalBudget">
                  Total Budget & Currency <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <select
                    id="currency"
                    name="currency"
                    className="form-control"
                    style={{ width: '85px', flexShrink: 0 }}
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                  <input
                    id="totalBudget"
                    name="totalBudget"
                    type="number"
                    min="0"
                    step="100"
                    className="form-control"
                    value={formData.totalBudget}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.totalBudget && <p className="form-error">{errors.totalBudget}</p>}
              </div>
            </div>

            {/* Theme & Style */}
            <div className="form-group">
              <label className="form-label" htmlFor="theme">
                Theme, Color Palette, or Styling Preference
              </label>
              <input
                id="theme"
                name="theme"
                type="text"
                className="form-control"
                placeholder="e.g. Modern Rustic Elegance with Emerald, Cream and Warm Gold"
                value={formData.theme}
                onChange={handleChange}
              />
            </div>

            <div className="grid-2">
              {/* Food & Dining Preferences */}
              <div className="form-group">
                <label className="form-label" htmlFor="foodPreferences">
                  Food & Beverage Preferences
                </label>
                <textarea
                  id="foodPreferences"
                  name="foodPreferences"
                  className="form-control"
                  placeholder="e.g. Farm-to-table organic buffet with artisan vegan and gluten-free choices"
                  value={formData.foodPreferences}
                  onChange={handleChange}
                />
              </div>

              {/* Decor & Entertainment */}
              <div className="form-group">
                <label className="form-label" htmlFor="entertainmentPreferences">
                  Entertainment & Decoration Ideas
                </label>
                <textarea
                  id="entertainmentPreferences"
                  name="entertainmentPreferences"
                  className="form-control"
                  placeholder="e.g. Acoustic string duo for welcome, live cover band for party, fairy lights"
                  value={formData.entertainmentPreferences}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Special & Accessibility Requirements */}
            <div className="form-group">
              <label className="form-label" htmlFor="specialRequirements">
                Special Requirements, Cultural Traditions & Accessibility Needs
              </label>
              <input
                id="specialRequirements"
                name="specialRequirements"
                type="text"
                className="form-control"
                placeholder="e.g. Wheelchair accessible entrances, sensory quiet room, tea ceremony arrangement"
                value={formData.specialRequirements}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                id="btn-submit-event"
              >
                <Sparkles size={16} />
                <span>Generate Event Plan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
