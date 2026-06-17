import React, { useState } from 'react';
import { Shield, Zap, Sparkles, Activity, AlertTriangle, UserMinus, Flame, Compass } from 'lucide-react';

const SimulatorControls = ({
  entropy,
  latency,
  fatigue,
  telemetryNoise,
  setTelemetryNoise,
  isAutonomicMode,
  setIsAutonomicMode,
  onTriggerShock,
  onInjectTask
}) => {
  const [taskName, setTaskName] = useState('');
  const [taskUrgency, setTaskUrgency] = useState('medium');

  const handleInjectSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    onInjectTask(taskName, taskUrgency);
    setTaskName('');
  };

  // Select color based on entropy score
  const getEntropyColor = (val) => {
    if (val < 20) return 'var(--color-success)';
    if (val < 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div className="sidebar-panel">
      {/* 1. Global System Telemetry Gauges */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Activity size={18} className="bullet-icon" style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Neural Telemetry</h3>
        </div>

        <div className="metric-grid">
          <div className="metric-gauge-card" style={{ borderColor: getEntropyColor(entropy) }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>COORDINATION ENTROPY</div>
            <div className="gauge-val" style={{ color: getEntropyColor(entropy), textShadow: `0 0 10px ${getEntropyColor(entropy)}22` }}>
              {entropy.toFixed(1)}%
            </div>
          </div>
          
          <div className="metric-gauge-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>ROUTING LATENCY</div>
            <div className="gauge-val" style={{ color: 'var(--color-accent)' }}>
              {latency}ms
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            <span>AVG TEAM COGNITIVE RESERVE</span>
            <span>{(100 - fatigue).toFixed(0)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${100 - fatigue}%`, 
                background: fatigue > 70 ? 'var(--color-error)' : 'var(--color-success)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Control Mode Panel */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} className="bullet-icon" style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>Operating Mode</h3>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
          <button 
            onClick={() => setIsAutonomicMode(true)}
            className={`tab-btn ${isAutonomicMode ? 'active' : ''}`}
            style={{ flex: 1, padding: '8px' }}
          >
            <Sparkles size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Autonomic
          </button>
          <button 
            onClick={() => setIsAutonomicMode(false)}
            className={`tab-btn ${!isAutonomicMode ? 'active' : ''}`}
            style={{ flex: 1, padding: '8px' }}
          >
            Manual (Jira)
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
          {isAutonomicMode 
            ? "Autonomic Mode dynamically routes tasks and mitigates stress in real time using edge-weight algorithms and telemetry checkpoints. Coordination overhead is driven to zero."
            : "Manual Mode forces engineers to claim issues. Shock events cause alignment decay, task queues back up, and developer fatigue drives entropy past critical bounds."
          }
        </p>
      </div>

      {/* 3. Telemetry Parameter Adjustments */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={18} className="bullet-icon" style={{ color: 'var(--color-secondary)' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Telemetry Tuning</h3>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>COMMUNICATION NOISE</span>
            <span>{telemetryNoise}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={telemetryNoise}
            onChange={(e) => setTelemetryNoise(parseInt(e.target.value))}
            className="slider-input"
          />
        </div>
      </div>

      {/* 4. Network Shock Generator */}
      <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Flame size={18} style={{ color: 'var(--color-error)' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Stress Injector</h3>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Introduce shocks to evaluate the self-healing and re-routing limits of the social engine.
        </p>
        
        <div className="shock-btn-grid">
          <button onClick={() => onTriggerShock('ooo')} className="shock-btn" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <UserMinus size={14} style={{ color: 'var(--color-warning)' }} />
            Dev OOO
          </button>
          <button onClick={() => onTriggerShock('sev1')} className="shock-btn" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--color-error)' }} />
            Sev-1 Crash
          </button>
          <button onClick={() => onTriggerShock('creep')} className="shock-btn">
            <Flame size={14} style={{ color: 'var(--color-secondary)' }} />
            Scope Creep
          </button>
          <button onClick={() => onTriggerShock('deadline')} className="shock-btn">
            <Zap size={14} style={{ color: 'var(--color-accent)' }} />
            Accelerate
          </button>
        </div>
      </div>

      {/* 5. Custom Ingest Ticket */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} className="bullet-icon" style={{ color: 'var(--color-success)' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Ingest Custom Ticket</h3>
        </div>

        <form onSubmit={handleInjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="text"
            placeholder="e.g., Fix SQL Injections"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-glow)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input 
                type="radio" 
                name="urgency" 
                value="low" 
                checked={taskUrgency === 'low'}
                onChange={() => setTaskUrgency('low')}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              Low
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-accent)' }}>
              <input 
                type="radio" 
                name="urgency" 
                value="medium" 
                checked={taskUrgency === 'medium'}
                onChange={() => setTaskUrgency('medium')}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              Med
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-warning)' }}>
              <input 
                type="radio" 
                name="urgency" 
                value="high" 
                checked={taskUrgency === 'high'}
                onChange={() => setTaskUrgency('high')}
                style={{ accentColor: 'var(--color-warning)' }}
              />
              High
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-error)' }}>
              <input 
                type="radio" 
                name="urgency" 
                value="critical" 
                checked={taskUrgency === 'critical'}
                onChange={() => setTaskUrgency('critical')}
                style={{ accentColor: 'var(--color-error)' }}
              />
              Critical
            </label>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-outline-accent" 
            style={{ 
              padding: '8px', 
              fontSize: '0.8rem', 
              justifyContent: 'center',
              marginTop: '4px'
            }}
          >
            Inject Into Network
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimulatorControls;
