import React, { useState, useEffect } from 'react';
import NeuralGraph from './components/NeuralGraph';
import SimulatorControls from './components/SimulatorControls';
import ConsensusPanel from './components/ConsensusPanel';
import PitchDeck from './components/PitchDeck';
import { Network, Presentation, Database, Settings, Terminal, Info, RefreshCw } from 'lucide-react';

const INITIAL_NODES = [
  // Developers
  { id: 'dev1', type: 'developer', label: 'Alice', role: 'System Architect', x: 200, y: 150, load: 45, status: 'focus', skill: 'Backend/Go' },
  { id: 'dev2', type: 'developer', label: 'Bob', role: 'Frontend Lead', x: 450, y: 220, load: 60, status: 'active', skill: 'React/UI' },
  { id: 'dev3', type: 'developer', label: 'Charlie', role: 'DevOps Engineer', x: 180, y: 350, load: 30, status: 'active', skill: 'K8s/YAML' },
  { id: 'dev4', type: 'developer', label: 'Diana', role: 'Database Engineer', x: 500, y: 100, load: 55, status: 'active', skill: 'Postgres/SQL' },
  
  // Tasks
  { id: 'task1', type: 'task', label: 'Refactor API Gateway', urgency: 'high', x: 280, y: 220, stage: 'Coding', assignee: 'dev1', progress: 15 },
  { id: 'task2', type: 'task', label: 'Slide Deck Animations', urgency: 'medium', x: 400, y: 320, stage: 'Review', assignee: 'dev2', progress: 40 },
  { id: 'task3', type: 'task', label: 'Optimize SQL Indexes', urgency: 'low', x: 520, y: 200, stage: 'Coding', assignee: 'dev4', progress: 60 },
  
  // Decisions
  { id: 'dec1', type: 'decision', label: 'API Protocol Ballot', votersCount: 3, consensusPercent: 75, x: 350, y: 120 }
];

const INITIAL_LINKS = [
  { source: 'dev1', target: 'task1', type: 'allocation' },
  { source: 'dev2', target: 'task2', type: 'allocation' },
  { source: 'dev4', target: 'task3', type: 'allocation' },
  { source: 'dev1', target: 'dec1', type: 'collab' },
  { source: 'dev2', target: 'dec1', type: 'collab' },
  { source: 'dev4', target: 'dec1', type: 'collab' },
  { source: 'dev1', target: 'dev2', type: 'collab' },
  { source: 'dev2', target: 'dev4', type: 'collab' }
];

function App() {
  const [mode, setMode] = useState('pitch'); // 'pitch' or 'dashboard'
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [links, setLinks] = useState(INITIAL_LINKS);
  
  // Telemetry variables
  const [entropy, setEntropy] = useState(4.2);
  const [latency, setLatency] = useState(15);
  const [fatigue, setFatigue] = useState(47);
  const [telemetryNoise, setTelemetryNoise] = useState(20);
  const [isAutonomicMode, setIsAutonomicMode] = useState(true);
  
  // Animations Packets
  const [packets, setPackets] = useState([
    { id: 'pk_init1', source: 'dev1', target: 'dec1', progress: 0.2, speed: 0.02, color: '#6366f1', size: 3 },
    { id: 'pk_init2', source: 'dev2', target: 'task2', progress: 0.5, speed: 0.03, color: '#06b6d4', size: 4 }
  ]);

  // Console output log list
  const [logs, setLogs] = useState([
    { id: 'l1', type: 'SYSTEM', time: '17:44:02', text: 'Entropy-Zero social computational kernel loaded.' },
    { id: 'l2', type: 'TELEMETRY', time: '17:44:05', text: 'Listening to workspace ambient streams. Precision: 98%.' },
    { id: 'l3', type: 'AUTONOMIC', time: '17:44:10', text: 'Initial allocation stable. Coordination entropy minimized to 4.2%.' }
  ]);

  const [selectedNode, setSelectedNode] = useState(null);

  const addLogEntry = (type, text) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [
      {
        id: `log_${Date.now()}_${Math.random()}`,
        type,
        time: timeStr,
        text
      },
      ...prev
    ].slice(0, 40)); // Cap logs to last 40 lines
  };

  // Trigger developer shock scenarios
  const handleTriggerShock = (shockType) => {
    if (shockType === 'ooo') {
      // Bob goes OOO
      setNodes(prevNodes => {
        let bobName = 'Bob';
        const updated = prevNodes.map(n => {
          if (n.id === 'dev2') {
            bobName = n.label;
            return { ...n, status: 'ooo', load: 0 };
          }
          return n;
        });
        
        // Remove Bob's tasks allocations (or assign them to unassigned tasks)
        addLogEntry('ALERT', `Developer "${bobName}" went OOO suddenly. Telemetry reports focus loss.`);
        return updated;
      });

      // Detach Bob from his tasks
      setNodes(prev => prev.map(n => {
        if (n.type === 'task' && n.assignee === 'dev2') {
          return { ...n, assignee: null };
        }
        return n;
      }));

      setLinks(prevLinks => prevLinks.filter(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return !(sourceId === 'dev2' && l.type === 'allocation');
      }));

    } else if (shockType === 'sev1') {
      addLogEntry('CRITICAL', 'ALERT: Sev-1 Database crash detected. Spawning emergency hotfix nodes.');
      
      const newTasks = [
        { id: `sev1_1`, type: 'task', label: 'Restore Main DB', urgency: 'critical', x: 300, y: 150, stage: 'Coding', assignee: null, progress: 0 },
        { id: `sev1_2`, type: 'task', label: 'Verify Transaction Log', urgency: 'high', x: 260, y: 280, stage: 'Coding', assignee: null, progress: 0 }
      ];

      setNodes(prev => [...prev, ...newTasks]);

      // Draw links between decisions and tasks
      newTasks.forEach(t => {
        setLinks(prev => [...prev, { source: 'dec1', target: t.id, type: 'collab' }]);
      });

    } else if (shockType === 'creep') {
      addLogEntry('ALERT', 'Scope Creep: Product manager added 3 unplanned layout features.');
      const newTasks = [
        { id: `creep_1`, type: 'task', label: 'Redesign Settings UI', urgency: 'medium', x: 120, y: 100, stage: 'Planning', assignee: null, progress: 0 },
        { id: `creep_2`, type: 'task', label: 'Export PDF Formats', urgency: 'low', x: 400, y: 380, stage: 'Planning', assignee: null, progress: 0 },
        { id: `creep_3`, type: 'task', label: 'Dark Mode Toggle', urgency: 'low', x: 550, y: 300, stage: 'Planning', assignee: null, progress: 0 }
      ];
      setNodes(prev => [...prev, ...newTasks]);

    } else if (shockType === 'deadline') {
      addLogEntry('ALERT', 'Workspace Shock: Deliverable timeline accelerated by 48 hours.');
      setNodes(prev => prev.map(n => {
        if (n.type === 'task') {
          let newUrgency = 'critical';
          if (n.urgency === 'low') newUrgency = 'medium';
          if (n.urgency === 'medium') newUrgency = 'high';
          return { ...n, urgency: newUrgency };
        }
        return n;
      }));
    }
  };

  // Ingest custom tasks
  const handleInjectTask = (name, urgency) => {
    const taskId = `task_${Date.now()}`;
    const newTask = {
      id: taskId,
      type: 'task',
      label: name,
      urgency,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 250,
      stage: 'Coding',
      assignee: null,
      progress: 0
    };

    setNodes(prev => [...prev, newTask]);
    addLogEntry('INGEST', `Custom issue ingested: "${name}" [Priority: ${urgency.toUpperCase()}]`);
  };

  // Simulation core ticks
  useEffect(() => {
    const tickInterval = setInterval(() => {
      // 1. Process tasks progress
      setNodes(prevNodes => {
        let tasksCompleted = [];
        
        // Map updated nodes
        const updated = prevNodes.map(node => {
          if (node.type === 'task' && node.assignee) {
            const dev = prevNodes.find(n => n.id === node.assignee);
            if (dev && dev.status !== 'ooo') {
              // fatiguing devs work slower
              const rate = dev.load > 85 ? 4 : (node.urgency === 'critical' ? 12 : (node.urgency === 'high' ? 9 : 6));
              const newProgress = Math.min(100, node.progress + rate);
              
              if (newProgress >= 100) {
                tasksCompleted.push(node);
              }
              return { ...node, progress: newProgress };
            }
          }
          return node;
        });

        // Log completions and remove nodes
        tasksCompleted.forEach(t => {
          addLogEntry('RESOLVED', `Task resolved: "${t.label}" [Telemetry signatures complete]`);
        });

        // Filter out completed tasks
        const completedIds = tasksCompleted.map(t => t.id);
        
        // Remove links for completed tasks
        if (completedIds.length > 0) {
          setLinks(prevLinks => prevLinks.filter(l => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            return !completedIds.includes(sourceId) && !completedIds.includes(targetId);
          }));
        }

        return updated.filter(n => !completedIds.includes(n.id));
      });

      // 2. Autonomic stress management & task assignment
      if (isAutonomicMode) {
        // Run self-routing allocations
        setNodes(prevNodes => {
          let updated = [...prevNodes];
          const developers = updated.filter(n => n.type === 'developer' && n.status !== 'ooo');
          const unassignedTasks = updated.filter(n => n.type === 'task' && !n.assignee);
          
          if (developers.length === 0) return prevNodes;

          // Target: assign unassigned tasks to developers with lowest load
          unassignedTasks.forEach(task => {
            // Re-fetch sorted devs to ensure correct loads
            developers.sort((a, b) => a.load - b.load);
            const targetDev = developers[0];
            
            // Assign
            const nodeToUpdate = updated.find(n => n.id === task.id);
            if (nodeToUpdate) {
              nodeToUpdate.assignee = targetDev.id;
              targetDev.load = Math.min(100, targetDev.load + (task.urgency === 'critical' ? 25 : 15));
              
              addLogEntry('AUTONOMIC', `Routed "${task.label}" to ${targetDev.label} (Current Load: ${targetDev.load}%)`);
              
              // Add links state
              setLinks(prev => [...prev, { source: targetDev.id, target: task.id, type: 'allocation' }]);
            }
          });

          // Stress balancing: shift task if developer load > 85% and someone else is free
          const overloadedDevs = developers.filter(d => d.load > 82);
          const freeDevs = developers.filter(d => d.load < 45);

          if (overloadedDevs.length > 0 && freeDevs.length > 0) {
            overloadedDevs.sort((a,b) => b.load - a.load);
            freeDevs.sort((a,b) => a.load - b.load);

            const sourceDev = overloadedDevs[0];
            const targetDev = freeDevs[0];

            // Find a task assigned to sourceDev
            const taskToShift = updated.find(t => t.type === 'task' && t.assignee === sourceDev.id);
            if (taskToShift) {
              taskToShift.assignee = targetDev.id;
              sourceDev.load = Math.max(10, sourceDev.load - 20);
              targetDev.load = Math.min(100, targetDev.load + 15);

              addLogEntry('AUTONOMIC', `Stress balancing: Reassigned "${taskToShift.label}" from fatigued ${sourceDev.label} to ${targetDev.label}.`);

              // Update link source
              setLinks(prev => prev.map(l => {
                const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                if (targetId === taskToShift.id && l.type === 'allocation') {
                  return { ...l, source: targetDev.id };
                }
                return l;
              }));
            }
          }

          // Gradually decay idle developer fatigue and increase loaded developer load
          updated = updated.map(n => {
            if (n.type === 'developer') {
              if (n.status === 'ooo') return n;
              const hasTasks = updated.some(t => t.type === 'task' && t.assignee === n.id);
              if (hasTasks) {
                return { ...n, load: Math.min(95, n.load + 1) };
              } else {
                return { ...n, load: Math.max(15, n.load - 3) };
              }
            }
            return n;
          });

          return updated;
        });

        // Drift telemetry parameters to zero-entropy stable states
        setEntropy(prev => prev + (2.8 + (telemetryNoise / 12) - prev) * 0.15);
        setLatency(prev => Math.round(prev + (12 + (telemetryNoise / 5) - prev) * 0.15));

      } else {
        // MANUAL MODE: Tasks stay unassigned, fatigue grows, entropy surges
        setNodes(prevNodes => {
          let updated = [...prevNodes];
          const unassignedTasksCount = updated.filter(n => n.type === 'task' && !n.assignee).length;
          
          // Incremental load increase for active devs
          updated = updated.map(n => {
            if (n.type === 'developer' && n.status !== 'ooo') {
              const taskCount = updated.filter(t => t.type === 'task' && t.assignee === n.id).length;
              if (taskCount > 0) {
                return { ...n, load: Math.min(100, n.load + (taskCount * 2)) };
              }
            }
            return n;
          });
          
          return updated;
        });

        const unassignedTasksCount = nodes.filter(n => n.type === 'task' && !n.assignee).length;
        setEntropy(prev => Math.min(100, prev + 1.8 + (unassignedTasksCount * 2.2)));
        setLatency(prev => Math.min(30000, prev + 1200 + (unassignedTasksCount * 450)));
      }

      // 3. Compute aggregate fatigue score
      const devs = nodes.filter(n => n.type === 'developer' && n.status !== 'ooo');
      if (devs.length > 0) {
        const avgFatigue = devs.reduce((acc, d) => acc + d.load, 0) / devs.length;
        setFatigue(avgFatigue);
      }

    }, 2000);

    return () => clearInterval(tickInterval);
  }, [nodes, isAutonomicMode, telemetryNoise]);

  const activeDevCount = nodes.filter(n => n.type === 'developer' && n.status !== 'ooo').length;
  const activeTaskCount = nodes.filter(n => n.type === 'task').length;

  return (
    <div className="app-container">
      {/* Glow Orbs background elements */}
      <div className="glow-orb glow-orb-primary"></div>
      <div className="glow-orb glow-orb-secondary"></div>

      {/* Top Navbar */}
      <header className="top-nav">
        <div className="nav-logo">
          <Network className="bullet-icon" style={{ color: 'var(--color-primary)' }} />
          <div>
            <span className="logo-text">ENTROPY-ZERO</span>
            <span className="logo-badge" style={{ marginLeft: '8px' }}>V1.0</span>
          </div>
        </div>

        <div className="nav-links">
          <button 
            onClick={() => setMode('pitch')} 
            className={`btn ${mode === 'pitch' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Presentation size={16} />
            Pitch Presentation (PPT)
          </button>
          <button 
            onClick={() => setMode('dashboard')} 
            className={`btn ${mode === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Database size={16} />
            Autonomic Dashboard
          </button>
        </div>
      </header>

      {/* Primary Content Container */}
      <main className="content-area">
        {mode === 'pitch' ? (
          <PitchDeck onSwitchToDashboard={() => setMode('dashboard')} />
        ) : (
          <div className="dashboard-grid slide-up">
            
            {/* Column 1: Simulator Controls */}
            <SimulatorControls 
              entropy={entropy}
              latency={latency}
              fatigue={fatigue}
              telemetryNoise={telemetryNoise}
              setTelemetryNoise={setTelemetryNoise}
              isAutonomicMode={isAutonomicMode}
              setIsAutonomicMode={setIsAutonomicMode}
              onTriggerShock={handleTriggerShock}
              onInjectTask={handleInjectTask}
            />

            {/* Column 2: Center graph & Operational system logs */}
            <div className="center-panel">
              
              {/* Force directed Graph card */}
              <div className="canvas-container-card glass-card">
                <div className="graph-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Network size={16} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1rem' }}>Active Team Coordination Space</h3>
                  </div>
                  <div className="graph-legend">
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: 'var(--color-primary)' }}></span>
                      <span>Dev ({activeDevCount})</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: 'var(--color-accent)' }}></span>
                      <span>Issues ({activeTaskCount})</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: 'var(--color-secondary)' }}></span>
                      <span>Decisions (1)</span>
                    </div>
                  </div>
                </div>

                <NeuralGraph 
                  nodes={nodes}
                  links={links}
                  onNodeClick={setSelectedNode}
                  telemetryNoise={telemetryNoise}
                  isAutonomicMode={isAutonomicMode}
                  selectedNode={selectedNode}
                  packets={packets}
                  setPackets={setPackets}
                />
              </div>

              {/* Monospace Operational Telemetry console */}
              <div className="telemetry-logs-card glass-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={16} style={{ color: 'var(--color-accent)' }} />
                    <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>OPERATIONAL TELEMETRY FEED</h3>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    POLLING ACTIVE - SECURED ENDPOINT
                  </span>
                </div>

                <div className="log-window">
                  {logs.map((log) => (
                    <div key={log.id} className="log-entry">
                      <span className="log-time">[{log.time}]</span>
                      <span 
                        className="log-type" 
                        style={{ 
                          color: log.type === 'ALERT' || log.type === 'CRITICAL' ? 'var(--color-error)' : 
                                 (log.type === 'AUTONOMIC' ? 'var(--color-success)' : 'var(--color-accent)') 
                        }}
                      >
                        {log.type}:
                      </span>
                      <span className="log-text">{log.text}</span>
                    </div>
                  ))}
                  <div className="log-entry" style={{ border: 'none' }}>
                    <span className="log-time">[{new Date().toTimeString().split(' ')[0]}]</span>
                    <span className="log-type" style={{ color: 'var(--text-muted)' }}>IDLE:</span>
                    <span className="log-text">Listening for system telemetry<span className="log-cursor"></span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Consensus Synapse & Inspection Card */}
            <div className="sidebar-panel">
              <ConsensusPanel onAddLogEntry={addLogEntry} />

              {/* Inspection card details */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Info size={16} style={{ color: 'var(--color-accent)' }} />
                  <h3 style={{ fontSize: '1rem' }}>Element Inspector</h3>
                </div>

                {selectedNode ? (
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Name:</span>
                      <span style={{ color: '#fff' }}>{selectedNode.label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Type:</span>
                      <span className="logo-badge" style={{ fontSize: '0.6rem' }}>{selectedNode.type.toUpperCase()}</span>
                    </div>

                    {selectedNode.type === 'developer' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>Specialization:</span>
                          <span>{selectedNode.skill}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>Operational Status:</span>
                          <span style={{ color: selectedNode.status === 'focus' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {selectedNode.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>Real-Time Stress:</span>
                          <span style={{ color: selectedNode.load > 75 ? 'var(--color-error)' : 'var(--color-success)' }}>
                            {selectedNode.load}%
                          </span>
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'task' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>Priority:</span>
                          <span style={{ color: selectedNode.urgency === 'critical' ? 'var(--color-error)' : 'var(--color-accent)' }}>
                            {selectedNode.urgency.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>Resolution:</span>
                          <span>{selectedNode.progress}% Done</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>Assigned Developer:</span>
                          <span>{nodes.find(n => n.id === selectedNode.assignee)?.label || 'Awaiting Routing'}</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                    Select any node on the canvas graph workspace to intercept raw performance telemetry, stress readings, and active task progress metrics.
                  </p>
                )}
              </div>
            </div>
            
          </div>
        )}
      </main>

      {/* Global App Footer */}
      <footer className="app-footer">
        <div>
          Entropy-Zero: The Autonomic Social Engine &copy; 2026. Built for Future of Productivity.
        </div>
        <div className="footer-links">
          <a href="https://github.com/entropy-zero/social-engine" target="_blank" className="footer-link">GitHub Codebase</a>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--color-success)' }}>Secure IPFS Build</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
