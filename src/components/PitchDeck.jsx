import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, AlertTriangle, ShieldCheck, Zap, BarChart2, Briefcase, RefreshCw } from 'lucide-react';

const PitchDeck = ({ onSwitchToDashboard }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [miniSimState, setMiniSimState] = useState('stable');
  const [logs, setLogs] = useState(['[Telemetry] System status: Nominal']);
  const miniCanvasRef = useRef(null);
  const animRef = useRef(null);

  // Keyboard navigation for presentation feel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  // Mini-simulation loop inside Slide 4
  useEffect(() => {
    if (currentSlide !== 3) return; // Only run when on Slide 4
    
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let nodes = [
      { id: 'alice', name: 'Alice', x: 80, y: 100, targetX: 80, targetY: 100, load: 40, status: 'active' },
      { id: 'bob', name: 'Bob', x: 200, y: 100, targetX: 200, targetY: 100, load: 30, status: 'active' },
      { id: 'charlie', name: 'Charlie', x: 320, y: 100, targetX: 320, targetY: 100, load: 95, status: 'active' },
      { id: 'task', name: 'P0 Bug', x: 200, y: 30, targetX: 200, targetY: 30, type: 'task' }
    ];

    let packets = [];

    const handleSimulationState = () => {
      if (miniSimState === 'ooo') {
        // Bob goes OOO
        const bob = nodes.find(n => n.id === 'bob');
        if (bob) {
          bob.status = 'ooo';
          bob.load = 0;
        }
        // Redirect tasks: task moves to Alice
        const task = nodes.find(n => n.id === 'task');
        if (task) {
          task.targetX = 80;
          task.targetY = 80;
        }
      } else if (miniSimState === 'stable') {
        const bob = nodes.find(n => n.id === 'bob');
        if (bob) {
          bob.status = 'active';
          bob.load = 30;
        }
        const task = nodes.find(n => n.id === 'task');
        if (task) {
          task.targetX = 200;
          task.targetY = 100;
        }
      } else if (miniSimState === 'healed') {
        // Redraw allocations, balance tasks to Alice & Bob
        const task = nodes.find(n => n.id === 'task');
        if (task) {
          task.targetX = 80;
          task.targetY = 100;
        }
        const alice = nodes.find(n => n.id === 'alice');
        if (alice) alice.load = 75;
      }
    };

    handleSimulationState();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gridlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // Smooth positions
      nodes.forEach(n => {
        n.x += (n.targetX - n.x) * 0.08;
        n.y += (n.targetY - n.y) * 0.08;
      });

      // Draw lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      ctx.lineTo(nodes[1].x, nodes[1].y);
      ctx.lineTo(nodes[2].x, nodes[2].y);
      ctx.stroke();

      // If task is assigned, draw connection to target
      const task = nodes.find(n => n.id === 'task');
      let assignee = null;
      if (miniSimState === 'ooo') assignee = nodes[0]; // Alice
      else if (miniSimState === 'stable') assignee = nodes[1]; // Bob
      else if (miniSimState === 'healed') assignee = nodes[0]; // Alice

      if (assignee && task) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.moveTo(task.x, task.y);
        ctx.lineTo(assignee.x, assignee.y);
        ctx.stroke();
      }

      // Draw developer circles
      nodes.filter(n => n.type !== 'task').forEach(n => {
        // Outermost progress indicator for load
        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 3;
        ctx.stroke();

        let progressColor = '#10b981';
        if (n.load > 60) progressColor = '#f59e0b';
        if (n.load > 90) progressColor = '#ef4444';
        if (n.status === 'ooo') progressColor = '#64748b';

        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * (n.load/100)));
        ctx.strokeStyle = progressColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, 16, 0, Math.PI*2);
        ctx.fillStyle = n.status === 'ooo' ? '#1e293b' : '#0f0f1c';
        ctx.strokeStyle = n.status === 'ooo' ? '#475569' : '#6366f1';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px var(--font-display)';
        ctx.textAlign = 'center';
        ctx.fillText(n.name[0], n.x, n.y + 3);

        // Name underneath
        ctx.font = '8px var(--font-mono)';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText(`${n.name} (${n.status.toUpperCase()})`, n.x, n.y + 32);
      });

      // Draw task diamond
      if (task) {
        ctx.save();
        ctx.translate(task.x, task.y);
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        
        ctx.font = '8px var(--font-mono)';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(task.name, task.x, task.y - 12);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [currentSlide, miniSimState]);

  const slides = [
    {
      title: "ENTROPY-ZERO",
      subtitle: "The Autonomic Social Engine for Autonomous Teams",
      content: (
        <div className="slide-content-grid">
          <div className="slide-text-section">
            <h2>The Future of Coordination</h2>
            <p className="slide-subtitle">
              Traditional productivity suites generate infinite administrative entropy. We build the self-managing nervous system to remove manual coordination entirely.
            </p>
            <ul className="slide-bullet-list">
              <li className="slide-bullet-item">
                <ShieldCheck size={18} className="bullet-icon" />
                <div>
                  <span className="bullet-bold">Autonomic Orchestration:</span>
                  <span className="bullet-desc"> Passive telemetry routes tasks, balances workload, and resolves conflicts with zero manual tickets.</span>
                </div>
              </li>
              <li className="slide-bullet-item">
                <Zap size={18} className="bullet-icon" />
                <div>
                  <span className="bullet-bold">Biological Model:</span>
                  <span className="bullet-desc"> Behaves like an organic nervous system, re-balancing team structures instantly during network stress events.</span>
                </div>
              </li>
              <li className="slide-bullet-item">
                <BarChart2 size={18} className="bullet-icon" />
                <div>
                  <span className="bullet-bold">Secured Focus:</span>
                  <span className="bullet-desc"> Increases real flow-state hours by up to 40% by absorbing context switches.</span>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="slide-visual-container">
            {/* Visual presentation model */}
            <div className="concept-network">
              <div className="glow-orb glow-orb-primary" style={{ top: '20%', left: '20%', width: '150px', height: '150px' }}></div>
              <div 
                className="concept-node concept-node-chaos" 
                style={{ 
                  left: '50%', 
                  top: '50%', 
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(99, 102, 241, 0.3)',
                  width: '80px',
                  height: '80px',
                  fontSize: '1rem',
                  borderColor: 'var(--color-primary)'
                }}
              >
                Σ0
              </div>
              <div className="concept-node" style={{ left: '15%', top: '20%', width: '40px', height: '40px' }}>DEV</div>
              <div className="concept-node" style={{ right: '15%', top: '20%', width: '40px', height: '40px' }}>TASK</div>
              <div className="concept-node" style={{ left: '50%', bottom: '10%', width: '40px', height: '40px' }}>SYN</div>

              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
                <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "THE PROBLEM",
      subtitle: "The Growing Tax of Collaboration Entropy",
      content: (
        <div className="slide-content-grid">
          <div className="slide-text-section">
            <h2>The Chaos of Modern Work</h2>
            <p className="slide-subtitle">
              Teams spend up to 60% of their operational energy on "work-about-work"—status syncs, manual issue routing, writing updates, and aligning schedules.
            </p>
            <ul className="slide-bullet-list">
              <li className="slide-bullet-item" style={{ color: 'var(--color-error)' }}>
                <AlertTriangle size={18} className="bullet-icon" style={{ color: 'var(--color-error)' }} />
                <div>
                  <span className="bullet-bold" style={{ color: '#fff' }}>Meeting Overhead:</span>
                  <span className="bullet-desc"> Daily standups and alignment alignments slice coding time into fragments.</span>
                </div>
              </li>
              <li className="slide-bullet-item">
                <AlertTriangle size={18} className="bullet-icon" style={{ color: 'var(--color-error)' }} />
                <div>
                  <span className="bullet-bold" style={{ color: '#fff' }}>Static Task Tracking:</span>
                  <span className="bullet-desc"> Backlog tickets become stale instantly and require constant human manual updates.</span>
                </div>
              </li>
              <li className="slide-bullet-item">
                <AlertTriangle size={18} className="bullet-icon" style={{ color: 'var(--color-error)' }} />
                <div>
                  <span className="bullet-bold" style={{ color: '#fff' }}>Overload & Burnout:</span>
                  <span className="bullet-desc"> Task assignment ignores real-time developer fatigue and skill matching constraints.</span>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="slide-visual-container">
            {/* Visual showing high entropy vibrating node particles */}
            <div style={{ padding: '24px', textAlign: 'center', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                <div className="glass-card" style={{ width: '140px', padding: '16px', borderColor: 'var(--color-error)' }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>COORDINATION</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-error)', margin: '8px 0' }}>62%</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Energy Sapped</div>
                </div>
                <div className="glass-card" style={{ width: '140px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>ACTUAL FOCUS</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '8px 0' }}>38%</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Coding/Building</div>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "The larger the team grows, the closer coding capacity approaches 0 due to coordination entropy."
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "THE CORE ENGINE",
      subtitle: "Autonomous Dispatch, Telemetry, & Consensus Synapses",
      content: (
        <div className="slide-content-grid">
          <div className="slide-text-section">
            <h2>Under the Hood</h2>
            <p className="slide-subtitle">
              Entropy-Zero coordinates production using three automated layers acting in harmony:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>1. Passive Developer Telemetry</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Extracts skills, code complexities, and fatigue states directly from workspace behavior (IDE, Git, focus tools).
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>2. Autonomic Physics Routing</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Treats tasks as kinetic vectors that settle automatically on engineers based on skill proximity and load reserves.
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--color-secondary)' }}>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>3. Dynamic Consensus Synapse</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Friction in communication triggers instant, decentralized weighted votes routed directly to module domain experts.
                </p>
              </div>
            </div>
          </div>
          
          <div className="slide-visual-container">
            <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>T</div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>Telemetry Layer</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Mines passive focus & skill logs</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={20} style={{ transform: 'rotate(90deg)', color: 'var(--text-muted)' }} /></div>
              <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', borderColor: 'var(--color-accent)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700 }}>A</div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>Autonomic Auction</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Executes stress-aware job dispatch</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "LIVE SIMULATOR WIDGET",
      subtitle: "Test the Network Resilience",
      content: (
        <div className="slide-content-grid">
          <div className="slide-text-section">
            <h2>Stress Test the Network</h2>
            <p className="slide-subtitle">
              Play with this sandbox simulation of a 3-engineer workspace. Trigger network shocks and evaluate how the autonomic layer shifts.
            </p>
            
            <div className="mini-sim-embed">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    setMiniSimState('ooo');
                    setLogs(prev => [`[ALERT] Bob went OOO. Task reassigned.`, ...prev]);
                  }} 
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                >
                  Bob OOO
                </button>
                <button 
                  onClick={() => {
                    setMiniSimState('healed');
                    setLogs(prev => [`[AUTONOMIC] Balancing stress. Task locked on Alice.`, ...prev]);
                  }} 
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                >
                  Balance System
                </button>
                <button 
                  onClick={() => {
                    setMiniSimState('stable');
                    setLogs(prev => [`[Telemetry] Restored to nominal sync state.`, ...prev]);
                  }} 
                  className="btn btn-outline-accent"
                  style={{ fontSize: '0.75rem', padding: '6px' }}
                >
                  Reset
                </button>
              </div>

              {/* Log window inside slide */}
              <div style={{ background: '#000', height: '80px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', overflowY: 'auto' }}>
                {logs.map((l, idx) => (
                  <div key={idx} style={{ color: l.includes('ALERT') ? 'var(--color-error)' : 'var(--text-secondary)', marginBottom: '4px' }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="slide-visual-container">
            {/* Embedded interactive canvas */}
            <canvas ref={miniCanvasRef} width={400} height={250} className="mini-sim-canvas-wrap" />
          </div>
        </div>
      )
    },
    {
      title: "BUSINESS VALUE & ROI",
      subtitle: "The ROI of Eliminating Coordination Decay",
      content: (
        <div className="slide-content-grid">
          <div className="slide-text-section">
            <h2>Scale Without Management Decay</h2>
            <p className="slide-subtitle">
              Removing administrative meetings and manual routing scales your organization's output linearly, avoiding traditional overhead decay.
            </p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)' }}>METRIC</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-error)' }}>TRADITIONAL</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--color-success)' }}>ENTROPY-ZERO</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>Weekly Standup Overhead</td>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>5 Hours / dev</td>
                  <td style={{ padding: '10px 0', color: 'var(--color-success)', fontWeight: 700 }}>0 Hours</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>Task Assignment Latency</td>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>24-48 Hours (Meetings)</td>
                  <td style={{ padding: '10px 0', color: 'var(--color-success)', fontWeight: 700 }}>&lt; 5 Minutes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>Backlog Update Frequency</td>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>Bi-Weekly Sprint</td>
                  <td style={{ padding: '10px 0', color: 'var(--color-success)', fontWeight: 700 }}>Continuous Telemetry</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>Average Coding Flow State</td>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>35% of day</td>
                  <td style={{ padding: '10px 0', color: 'var(--color-success)', fontWeight: 700 }}>75% of day</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="slide-visual-container">
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div className="logo-badge" style={{ fontSize: '1rem', padding: '12px 24px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}>
                +40% FLOW TIME SECURED
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px', lineHeight: '1.4' }}>
                By automating routing and context switching, engineers remain in their developer environments instead of task boards.
              </p>
              <button 
                onClick={onSwitchToDashboard}
                className="btn btn-primary"
                style={{ marginTop: '24px' }}
              >
                <Play size={14} />
                Open Live Simulation Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div className="slides-wrapper slide-up">
      <div className="slide-card glass-card">
        <div className="slide-header">
          <div className="slide-title-number">SLIDE 0{currentSlide + 1} / 0{slides.length}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="logo-badge" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>PITCH MODE</span>
            <button 
              onClick={onSwitchToDashboard}
              className="logo-badge" 
              style={{ background: 'transparent', color: 'var(--color-accent)', borderColor: 'var(--color-accent)', cursor: 'pointer' }}
            >
              GO TO SIMULATOR
            </button>
          </div>
        </div>

        {slide.content}

        <div className="slide-header" style={{ borderBottom: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', paddingBottom: 0, paddingTop: '16px', marginTop: '24px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Use Left/Right arrow keys or control buttons below to navigate.
          </div>
          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
            {slide.title}
          </div>
        </div>
      </div>

      <div className="slides-nav">
        <button onClick={prevSlide} className="btn btn-secondary">
          <ArrowLeft size={16} />
          Prev Slide
        </button>

        <div className="slide-indicators">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`indicator-dot ${currentSlide === idx ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>

        <button onClick={nextSlide} className="btn btn-primary">
          Next Slide
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PitchDeck;
