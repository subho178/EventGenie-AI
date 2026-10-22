import React, { useState, useEffect } from 'react';
import { Settings, X, Key, CheckCircle2, AlertCircle, Cpu, Sparkles, RefreshCw } from 'lucide-react';
import { getCustomApiKey, setCustomApiKey, testGeminiKey, fetchAiStatus } from '../api';

export default function SettingsModal({ isOpen, onClose, onApiKeyChanged, aiStatus }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getCustomApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    setCustomApiKey(apiKeyInput);
    if (onApiKeyChanged) onApiKeyChanged();
    setTestResult({
      success: true,
      message: apiKeyInput.trim() ? 'Gemini API key saved for this session.' : 'Switched to Algorithmic Fallback Engine.'
    });
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a Gemini API key first.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiKey(apiKeyInput.trim());
      if (res.valid) {
        setTestResult({
          success: true,
          message: 'Connection verified! Google Gemini is ready for live plan generation.'
        });
        setCustomApiKey(apiKeyInput.trim());
        if (onApiKeyChanged) onApiKeyChanged();
      } else {
        setTestResult({
          success: false,
          message: res.message || 'Key validation failed.'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Network error communicating with validation server.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearKey = () => {
    setApiKeyInput('');
    setCustomApiKey('');
    if (onApiKeyChanged) onApiKeyChanged();
    setTestResult({
      success: true,
      message: 'Active key cleared. Reverted to High-Fidelity Algorithmic Planning Mode.'
    });
  };

  const isConfigured = aiStatus?.geminiConfigured;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
              <Settings size={20} />
            </div>
            <div>
              <h2 id="settings-title" style={{ fontSize: '1.25rem' }}>AI Engine & Settings</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configure live Google Gemini AI credentials or explore in Algorithmic Mode.
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close Settings">
            <X size={18} />
          </button>
        </div>

        {/* Current Engine Status */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: isConfigured ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          border: isConfigured ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            {isConfigured ? (
              <CheckCircle2 size={18} color="var(--color-success)" />
            ) : (
              <Cpu size={18} color="var(--color-warning)" />
            )}
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isConfigured ? '#34d399' : '#fbbf24' }}>
              Active Mode: {isConfigured ? 'Live Google Gemini AI' : 'Algorithmic Planning Engine (Offline / Demo)'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {isConfigured 
              ? `Generating plans using ${aiStatus?.modelName || 'Google Gemini'}. Structured JSON mode and exponential retry enabled.`
              : 'Generating realistic, personalized plans dynamically using EventGenie\'s deterministic rule engine without requiring external API keys.'}
          </p>
        </div>

        {/* API Key Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="apiKeyInput" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Google Gemini API Key (Optional)</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Stored in browser session only</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="apiKeyInput"
              type="password"
              className="form-control"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            Get a free key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary-light)' }}>Google AI Studio</a>. You can also configure <code>GEMINI_API_KEY</code> in <code>.env</code>.
          </p>
        </div>

        {/* Feedback message */}
        {testResult && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.825rem',
            marginBottom: '1.25rem',
            background: testResult.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            color: testResult.success ? '#34d399' : '#f87171',
            border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClearKey}
            disabled={testing}
          >
            Clear / Use Demo Engine
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestKey}
              disabled={testing || !apiKeyInput.trim()}
              id="btn-test-gemini-key"
            >
              {testing ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
              <span>{testing ? 'Testing...' : 'Verify Key'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveKey}
              id="btn-save-settings"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
