import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, DollarSign, Calendar, ShieldCheck, 
  Sparkles, FileText, Plus, AlertCircle, CheckCircle2 
} from 'lucide-react';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BudgetPlanner from './components/BudgetPlanner';
import PreparationTimeline from './components/PreparationTimeline';
import VendorChecklist from './components/VendorChecklist';
import CreativeIdeas from './components/CreativeIdeas';
import ExportHub from './components/ExportHub';
import EventFormModal from './components/EventFormModal';
import SettingsModal from './components/SettingsModal';

import { 
  fetchEvents, fetchEventById, createEvent, updateEvent, 
  deleteEvent, regenerateSection, fetchAiStatus 
} from './api';

export default function App() {
  const [events, setEvents] = useState([]);
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial load: Fetch AI engine status and list of events
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, eventsRes] = await Promise.all([
        fetchAiStatus().catch(() => ({ geminiConfigured: false })),
        fetchEvents().catch(() => ({ data: [] }))
      ]);

      setAiStatus(statusRes);

      const eventList = eventsRes.data || [];
      setEvents(eventList);

      if (eventList.length > 0) {
        const firstId = eventList[0].id;
        setActiveEventId(firstId);
        loadFullEvent(firstId);
      } else {
        setShowNewEventModal(true);
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFullEvent = async (id) => {
    try {
      const res = await fetchEventById(id);
      if (res.success && res.data) {
        setActiveEvent(res.data);
      }
    } catch (err) {
      showToast('Failed to load event details', 'error');
    }
  };

  const handleSelectEvent = (id) => {
    setActiveEventId(id);
    loadFullEvent(id);
  };

  const handleCreateNewEvent = async (formData) => {
    setIsGenerating(true);
    try {
      const res = await createEvent(formData);
      if (res.success && res.data) {
        setEvents(prev => [res.data, ...prev]);
        setActiveEventId(res.data.id);
        setActiveEvent(res.data);
        setShowNewEventModal(false);
        setActiveTab('dashboard');
        showToast(`Personalized plan generated for "${res.data.eventName}"!`);
      } else {
        showToast(res.error || 'Failed to generate plan', 'error');
      }
    } catch (err) {
      showToast('An error occurred during plan generation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateActiveEvent = async (updates) => {
    if (!activeEventId) return;

    // Optimistically update local active event state
    setActiveEvent(prev => ({
      ...prev,
      ...updates
    }));

    try {
      const res = await updateEvent(activeEventId, updates);
      if (res.success && res.data) {
        setActiveEvent(res.data);
        // Also update summary in events list
        setEvents(prev => prev.map(e => e.id === activeEventId ? { ...e, ...res.data } : e));
      }
    } catch (err) {
      console.error('Failed to sync event update with server:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const res = await deleteEvent(id);
      if (res.success) {
        const remaining = events.filter(e => e.id !== id);
        setEvents(remaining);
        showToast('Event plan deleted');
        if (remaining.length > 0) {
          setActiveEventId(remaining[0].id);
          loadFullEvent(remaining[0].id);
        } else {
          setActiveEventId(null);
          setActiveEvent(null);
          setShowNewEventModal(true);
        }
      }
    } catch (err) {
      showToast('Failed to delete event plan', 'error');
    }
  };

  const handleRegenerateSection = async (sectionName) => {
    if (!activeEvent) return;
    setIsRegenerating(true);
    try {
      const res = await regenerateSection(sectionName, activeEvent);
      if (res.success && res.data) {
        const updates = { [sectionName]: res.data };
        await handleUpdateActiveEvent(updates);
        showToast(`${sectionName.toUpperCase()} section freshly regenerated!`);
      } else {
        showToast(res.error || 'Section regeneration failed', 'error');
      }
    } catch (err) {
      showToast('Error regenerating section', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAiStatusRefresh = async () => {
    try {
      const statusRes = await fetchAiStatus();
      setAiStatus(statusRes);
    } catch {}
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budget', label: 'Smart Budget', icon: DollarSign },
    { id: 'timeline', label: 'Timeline & Tasks', icon: Calendar },
    { id: 'vendors', label: 'Vendor Checklist', icon: ShieldCheck },
    { id: 'ideas', label: 'Creative Ideas', icon: Sparkles },
    { id: 'export', label: 'Export & Share', icon: FileText }
  ];

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 2000,
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'error' ? 'var(--color-danger)' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.875rem'
        }} role="status" aria-live="polite">
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Navbar
        events={events}
        currentEventId={activeEventId}
        onSelectEvent={handleSelectEvent}
        onOpenNewEventModal={() => setShowNewEventModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        aiStatus={aiStatus}
      />

      {/* Tab Navigation */}
      {activeEvent && (
        <nav className="tab-navigation" role="tablist" aria-label="Event Planning Sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Main Tab Panels */}
      <main id="main-content">
        {isLoading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="brand-icon-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
              <Sparkles size={24} />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Loading EventGenie AI...</h2>
          </div>
        ) : !activeEvent ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="brand-icon-box" style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem' }}>
              <Sparkles size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Event Plans Found</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              Create your first AI-powered event plan to get tailored budget allocations, milestone timelines, vendor vetting requirements, and creative ideas.
            </p>
            <button className="btn btn-primary" onClick={() => setShowNewEventModal(true)}>
              <Plus size={16} />
              <span>Create Your First Event Plan</span>
            </button>
          </div>
        ) : (
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'dashboard' && (
              <Dashboard
                event={activeEvent}
                onNavigateTab={(tabKey) => setActiveTab(tabKey)}
                onDeleteEvent={handleDeleteEvent}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetPlanner
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onRegenerateSection={handleRegenerateSection}
                isRegenerating={isRegenerating}
              />
            )}

            {activeTab === 'timeline' && (
              <PreparationTimeline
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onRegenerateSection={handleRegenerateSection}
                isRegenerating={isRegenerating}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorChecklist
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onRegenerateSection={handleRegenerateSection}
                isRegenerating={isRegenerating}
              />
            )}

            {activeTab === 'ideas' && (
              <CreativeIdeas
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onRegenerateSection={handleRegenerateSection}
                isRegenerating={isRegenerating}
              />
            )}

            {activeTab === 'export' && (
              <ExportHub event={activeEvent} />
            )}
          </div>
        )}
      </main>

      {/* Event Creation Modal */}
      <EventFormModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onSubmit={handleCreateNewEvent}
        isGenerating={isGenerating}
      />

      {/* Settings & AI Key Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onApiKeyChanged={handleAiStatusRefresh}
        aiStatus={aiStatus}
      />
    </div>
  );
}
