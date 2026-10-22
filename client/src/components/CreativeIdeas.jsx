import React, { useState } from 'react';
import { 
  Sparkles, Heart, Copy, Check, RefreshCw, 
  Palette, Music, Mail, Users, Utensils, DollarSign, CloudRain 
} from 'lucide-react';

export default function CreativeIdeas({ event, onUpdateEvent, onRegenerateSection, isRegenerating }) {
  const ideas = event.creativeIdeas || {};
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const categories = [
    { key: 'themeConcepts', label: 'Theme & Decor', icon: Palette },
    { key: 'activitiesAndEntertainment', label: 'Activities & Entertainment', icon: Music },
    { key: 'invitationWording', label: 'Invitation Wording', icon: Mail },
    { key: 'guestEngagement', label: 'Guest Engagement', icon: Users },
    { key: 'foodAndPresentation', label: 'Food & Presentation', icon: Utensils },
    { key: 'budgetFriendlyAlternatives', label: 'Budget Alternatives', icon: DollarSign },
    { key: 'weatherBackupPlan', label: 'Weather Backup', icon: CloudRain }
  ];

  const toggleSaveIdea = (categoryKey, ideaId) => {
    const list = ideas[categoryKey] || [];
    const updatedList = list.map(item => {
      if (item.id === ideaId) {
        return { ...item, saved: !item.saved };
      }
      return item;
    });

    onUpdateEvent({
      creativeIdeas: {
        ...ideas,
        [categoryKey]: updatedList
      }
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderSection = (categoryKey, title, iconComponent, items) => {
    if (!items || items.length === 0) return null;
    const Icon = iconComponent;

    return (
      <div key={categoryKey} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div className="brand-icon-box" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)' }}>
            <Icon size={16} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{title}</h3>
          <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>{items.length} Ideas</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {items.map((idea) => {
            const isSaved = Boolean(idea.saved);
            return (
              <div
                key={idea.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  border: isSaved ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                  background: isSaved ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-card)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35 }}>
                      {idea.title}
                    </h4>
                    <button
                      className="btn btn-secondary btn-icon"
                      style={{
                        width: '32px',
                        height: '32px',
                        flexShrink: 0,
                        color: isSaved ? '#f43f5e' : 'var(--text-muted)'
                      }}
                      onClick={() => toggleSaveIdea(categoryKey, idea.id)}
                      title={isSaved ? 'Remove from saved' : 'Save this idea'}
                      aria-label={`Save ${idea.title}`}
                    >
                      <Heart size={16} fill={isSaved ? '#f43f5e' : 'none'} />
                    </button>
                  </div>

                  {idea.description && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.35rem' }}>
                      {idea.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)' }}>
                  <span className={`badge ${isSaved ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                    {isSaved ? 'Saved Concept' : 'Suggested'}
                  </span>

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                    onClick={() => copyToClipboard(`${idea.title}\n\n${idea.description || ''}`, idea.id)}
                  >
                    {copiedId === idea.id ? (
                      <>
                        <Check size={12} color="var(--color-success)" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={24} color="#ec4899" />
            <span>Personalized Creative Concepts</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Bespoke concepts tailored to "{event.eventName}" with indoor contingencies and budget-friendly alternatives.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onRegenerateSection('creativeIdeas')}
          disabled={isRegenerating}
          id="btn-regenerate-ideas"
        >
          <RefreshCw size={14} className={isRegenerating ? 'spin' : ''} />
          <span>AI Generate Fresh Ideas</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('all')}
        >
          All Concepts
        </button>
        {categories.map((c) => {
          const count = (ideas[c.key] || []).length;
          return (
            <button
              key={c.key}
              className={`btn btn-sm ${activeCategory === c.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveCategory(c.key)}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Render Categorized Content */}
      {categories.map((cat) => {
        if (activeCategory !== 'all' && activeCategory !== cat.key) return null;
        return renderSection(cat.key, cat.label, cat.icon, ideas[cat.key]);
      })}
    </div>
  );
}
