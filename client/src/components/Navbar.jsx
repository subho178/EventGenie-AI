import React from 'react';
import { Sparkles, Calendar, Plus, Settings, CheckCircle2, Cpu } from 'lucide-react';

export default function Navbar({
  events,
  currentEventId,
  onSelectEvent,
  onOpenNewEventModal,
  onOpenSettingsModal,
  aiStatus
}) {
  const isLiveAi = aiStatus?.geminiConfigured;

  return (
    <header className="navbar" role="banner">
      <div className="brand-wrapper">
        <div className="brand-icon-box" aria-hidden="true">
          <Sparkles size={24} />
        </div>
        <div>
          <h1 className="brand-title">EventGenie AI</h1>
          <p className="brand-tagline">Intelligent Event Planning Assistant</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        {/* AI Engine Status Indicator */}
        <div 
          className={`badge ${isLiveAi ? 'badge-success' : 'badge-warning'}`}
          title={isLiveAi ? 'Powered by Google Gemini Generative AI' : 'Running High-Fidelity Algorithmic Planning Engine (Configure Gemini Key in Settings)'}
          style={{ cursor: 'pointer' }}
          onClick={onOpenSettingsModal}
        >
          {isLiveAi ? <CheckCircle2 size={13} /> : <Cpu size={13} />}
          <span>{isLiveAi ? 'Gemini AI Active' : 'Algorithmic Mode'}</span>
        </div>

        {/* Saved Events Switcher Dropdown */}
        {events && events.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="event-switcher" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
              Select Active Event Plan
            </label>
            <select
              id="event-switcher"
              className="form-control"
              style={{ width: 'auto', minWidth: '170px', padding: '0.45rem 0.8rem', fontSize: '0.825rem' }}
              value={currentEventId || ''}
              onChange={(e) => onSelectEvent(e.target.value)}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.eventName} ({ev.eventType})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* New Plan Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenNewEventModal}
          id="btn-create-new-plan"
        >
          <Plus size={16} />
          <span>New Plan</span>
        </button>

        {/* Settings Button */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenSettingsModal}
          title="AI Engine Settings & API Keys"
          aria-label="Open Settings"
          id="btn-open-settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
