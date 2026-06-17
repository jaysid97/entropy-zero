import React, { useEffect, useRef, useState } from 'react';

const NeuralGraph = ({ 
  nodes, 
  links, 
  onNodeClick, 
  telemetryNoise, 
  isAutonomicMode,
  selectedNode,
  packets,
  setPackets
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  // Handle resizing of the canvas parent container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 450
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Initial delay to let CSS settle
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [containerRef]);

  // Main physical simulation and rendering loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Simulation settings
    const chargeStrength = 1200; // Repulsion
    const linkStrength = 0.08; // Attraction
    const centerGravity = 0.03; // Centripetal pull
    const damping = 0.82; // Velocity slowdown

    const width = dimensions.width;
    const height = dimensions.height;

    // Set high-DPI resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize node velocities and positions if missing
    nodes.forEach(node => {
      if (node.x === undefined || node.x === null) node.x = Math.random() * width;
      if (node.y === undefined || node.y === null) node.y = Math.random() * height;
      if (node.vx === undefined) node.vx = 0;
      if (node.vy === undefined) node.vy = 0;
    });

    // Animate data packet flows
    const updatePackets = () => {
      setPackets(prevPackets => {
        return prevPackets
          .map(p => {
            const sourceNode = nodes.find(n => n.id === p.source);
            const targetNode = nodes.find(n => n.id === p.target);
            if (!sourceNode || !targetNode) return null;
            
            // Advance progress
            const newProgress = p.progress + p.speed;
            
            // Calculate current coords
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const cx = sourceNode.x + dx * newProgress;
            const cy = sourceNode.y + dy * newProgress;

            return {
              ...p,
              progress: newProgress,
              cx,
              cy
            };
          })
          .filter(p => p && p.progress < 1); // Remove completed packets
      });
    };

    // Auto-spawn random packet transmissions representing telemetry syncs
    let packetTimer = 0;
    const spawnRandomPackets = () => {
      packetTimer++;
      // Spawn probability adjusted by telemetry noise
      const threshold = Math.max(10, 45 - Math.round(telemetryNoise / 2));
      if (packetTimer > threshold && links.length > 0) {
        packetTimer = 0;
        // Select random link
        const randomLink = links[Math.floor(Math.random() * links.length)];
        // Find source & target IDs
        const sId = typeof randomLink.source === 'object' ? randomLink.source.id : randomLink.source;
        const tId = typeof randomLink.target === 'object' ? randomLink.target.id : randomLink.target;
        
        setPackets(prev => [
          ...prev,
          {
            id: `pk_${Date.now()}_${Math.random()}`,
            source: sId,
            target: tId,
            progress: 0,
            speed: 0.015 + Math.random() * 0.02,
            color: Math.random() > 0.5 ? '#6366f1' : '#06b6d4',
            size: 2 + Math.random() * 3
          }
        ]);
      }
    };

    // Physics update step
    const stepSimulation = () => {
      // 1. Charge force (Repulsion between all pairs of nodes)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          // Avoid division by zero
          if (dx === 0) dx = 0.1;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;
          
          // Strength drops off over distance
          const force = chargeStrength / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          if (n1 !== draggedNode) {
            n1.vx -= fx;
            n1.vy -= fy;
          }
          if (n2 !== draggedNode) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Link force (Attraction along links)
      links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        const n1 = nodes.find(n => n.id === sourceId);
        const n2 = nodes.find(n => n.id === targetId);
        
        if (!n1 || !n2) return;
        
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Target length for links (tasks are closer to assignees, collaborations are looser)
        const targetLen = link.type === 'collab' ? 140 : 80;
        const diff = dist - targetLen;
        const force = diff * linkStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (n1 !== draggedNode) {
          n1.vx += fx;
          n1.vy += fy;
        }
        if (n2 !== draggedNode) {
          n2.vx -= fx;
          n2.vy -= fy;
        }
      });

      // 3. Central Gravity (Pull all nodes towards center to prevent floating off screen)
      const cx = width / 2;
      const cy = height / 2;
      nodes.forEach(node => {
        if (node === draggedNode) return;
        
        const dx = cx - node.x;
        const dy = cy - node.y;
        
        node.vx += dx * centerGravity;
        node.vy += dy * centerGravity;
      });

      // 4. Update positions & apply damping
      nodes.forEach(node => {
        if (node === draggedNode) return;
        
        node.x += node.vx;
        node.y += node.vy;
        
        node.vx *= damping;
        node.vy *= damping;

        // Keep inside screen bounds
        const r = 24;
        if (node.x < r) { node.x = r; node.vx *= -0.5; }
        if (node.x > width - r) { node.x = width - r; node.vx *= -0.5; }
        if (node.y < r) { node.y = r; node.vy *= -0.5; }
        if (node.y > height - r) { node.y = height - r; node.vy *= -0.5; }
      });
    };

    // Draw the entire scene
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid points (background context for canvas)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      const gridSize = 30;
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw connection lines
      links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        const sNode = nodes.find(n => n.id === sourceId);
        const tNode = nodes.find(n => n.id === targetId);
        
        if (!sNode || !tNode) return;

        ctx.beginPath();
        ctx.moveTo(sNode.x, sNode.y);
        ctx.lineTo(tNode.x, tNode.y);

        if (link.type === 'collab') {
          // Communication paths are dashed/flexible
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1.5;
        } else {
          // Allocation paths are glowing solid tubes
          ctx.strokeStyle = isAutonomicMode 
            ? 'rgba(6, 182, 212, 0.25)' 
            : 'rgba(255, 255, 255, 0.08)';
          ctx.setLineDash([]);
          ctx.lineWidth = 2;
        }
        ctx.stroke();
      });
      ctx.setLineDash([]); // Reset line dash

      // Draw data packets
      packets.forEach(p => {
        if (!p.cx || !p.cy) return;
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        // Add drop shadow glow to packets
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      });

      // Draw nodes
      nodes.forEach(node => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;

        ctx.save();
        ctx.translate(node.x, node.y);

        if (node.type === 'developer') {
          // CONCENTRIC GAUGE: Cognitive Load concentric ring
          const radius = 22;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Arc progress representing developer load
          const loadPercent = Math.min(100, Math.max(0, node.load));
          let loadColor = '#10b981'; // Green (balanced)
          if (loadPercent > 60) loadColor = '#f59e0b'; // Yellow (loaded)
          if (loadPercent > 80) loadColor = '#ef4444'; // Red (overloaded / fatigued)
          
          ctx.beginPath();
          ctx.arc(0, 0, radius, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (loadPercent / 100)));
          ctx.strokeStyle = loadColor;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Main node circle
          ctx.beginPath();
          ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
          ctx.fillStyle = isSelected 
            ? 'rgba(99, 102, 241, 0.9)' 
            : (isHovered ? 'rgba(30, 30, 45, 0.95)' : 'rgba(15, 15, 25, 0.9)');
          ctx.strokeStyle = isSelected ? '#a855f7' : (isHovered ? '#6366f1' : '#334155');
          ctx.lineWidth = 2;
          
          // Glow effect on selected or active
          if (isSelected || isHovered) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = isSelected ? '#a855f7' : '#6366f1';
          }
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset

          // Draw initials
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px var(--font-display)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const initials = node.label.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          ctx.fillText(initials, 0, 0);

          // Status small dot overlay
          let statusColor = '#10b981'; // focus/active
          if (node.status === 'fatigued') statusColor = '#ef4444';
          if (node.status === 'idle') statusColor = '#64748b';
          if (node.status === 'ooo') statusColor = '#f59e0b';

          ctx.beginPath();
          ctx.arc(12, -12, 4, 0, Math.PI * 2);
          ctx.fillStyle = statusColor;
          ctx.strokeStyle = '#050508';
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();

        } else if (node.type === 'task') {
          // TASK NODE: Diamond shape
          const size = 12;
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size, 0);
          ctx.lineTo(0, size);
          ctx.lineTo(-size, 0);
          ctx.closePath();

          let taskColor = '#06b6d4'; // Cyan
          if (node.urgency === 'high') taskColor = '#f59e0b';
          if (node.urgency === 'critical') taskColor = '#ef4444';
          if (node.urgency === 'low') taskColor = '#64748b';

          ctx.fillStyle = isSelected 
            ? 'rgba(255, 255, 255, 0.95)' 
            : (isHovered ? 'rgba(30, 45, 50, 0.9)' : 'rgba(10, 20, 25, 0.85)');
          ctx.strokeStyle = taskColor;
          ctx.lineWidth = 2;

          if (isHovered || isSelected) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = taskColor;
          }
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw brief task symbol (first letter of name or T)
          ctx.fillStyle = isSelected ? '#000' : '#f8fafc';
          ctx.font = '700 8px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((node.label[0] || 'T').toUpperCase(), 0, 0);

        } else if (node.type === 'decision') {
          // CONSENSUS NODE: Hexagon
          const size = 15;
          ctx.beginPath();
          for (let side = 0; side < 6; side++) {
            const angle = (side * Math.PI) / 3;
            ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
          }
          ctx.closePath();

          ctx.fillStyle = 'rgba(168, 85, 247, 0.25)'; // Purple translucent
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;

          if (isHovered || isSelected || true) {
            // Decision nodes always pulse/glow
            const pulse = 4 + Math.sin(Date.now() / 200) * 3;
            ctx.shadowBlur = pulse;
            ctx.shadowColor = '#a855f7';
          }
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw letter 'C' (Consensus)
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('C', 0, 0);
        }

        ctx.restore();
      });
    };

    // Game loop orchestrator
    const loop = () => {
      stepSimulation();
      updatePackets();
      spawnRandomPackets();
      render();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, links, dimensions, telemetryNoise, isAutonomicMode, hoveredNode, draggedNode, selectedNode, packets]);

  // Handle canvas mouse move (hover and drag physics)
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Exact coords relative to canvas sizing
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggedNode) {
      draggedNode.x = x;
      draggedNode.y = y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else {
      // Check if mouse is hovering over a node
      let foundNode = null;
      for (const node of nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = node.type === 'developer' ? 22 : (node.type === 'task' ? 14 : 16);
        
        if (dist <= radius) {
          foundNode = node;
          break;
        }
      }
      setHoveredNode(foundNode);
    }
  };

  const handleMouseDown = (e) => {
    if (hoveredNode) {
      setDraggedNode(hoveredNode);
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      setDraggedNode(null);
    }
  };

  const handleCanvasClick = () => {
    if (hoveredNode) {
      onNodeClick(hoveredNode);
    } else {
      onNodeClick(null);
    }
  };

  return (
    <div ref={containerRef} className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="canvas-element"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Node Tooltip overlay */}
      {hoveredNode && (
        <div 
          style={{
            position: 'absolute',
            left: `${Math.min(dimensions.width - 240, mousePos.x + 15)}px`,
            top: `${Math.min(dimensions.height - 180, mousePos.y + 15)}px`,
            pointerEvents: 'none',
            zIndex: 10,
            width: '220px'
          }}
          className="glass-card slide-up"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{hoveredNode.label}</span>
            <span 
              className="logo-badge" 
              style={{ 
                color: hoveredNode.type === 'developer' ? '#6366f1' : (hoveredNode.type === 'task' ? '#06b6d4' : '#a855f7'),
                borderColor: hoveredNode.type === 'developer' ? '#6366f1' : (hoveredNode.type === 'task' ? '#06b6d4' : '#a855f7'),
              }}
            >
              {hoveredNode.type.toUpperCase()}
            </span>
          </div>

          {hoveredNode.type === 'developer' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong style={{ color: '#fff' }}>Role:</strong> {hoveredNode.role}</div>
              <div><strong style={{ color: '#fff' }}>Primary Skill:</strong> {hoveredNode.skill}</div>
              <div><strong style={{ color: '#fff' }}>Cognitive Load:</strong> {hoveredNode.load}%</div>
              <div>
                <strong style={{ color: '#fff' }}>Status:</strong>{' '}
                <span style={{ 
                  color: hoveredNode.status === 'focus' || hoveredNode.status === 'active' ? '#10b981' : 
                         (hoveredNode.status === 'fatigued' ? '#ef4444' : '#64748b') 
                }}>
                  {hoveredNode.status.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {hoveredNode.type === 'task' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong style={{ color: '#fff' }}>Stage:</strong> {hoveredNode.stage}</div>
              <div>
                <strong style={{ color: '#fff' }}>Urgency:</strong>{' '}
                <span style={{ color: hoveredNode.urgency === 'critical' ? '#ef4444' : (hoveredNode.urgency === 'high' ? '#f59e0b' : '#06b6d4') }}>
                  {hoveredNode.urgency.toUpperCase()}
                </span>
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Assignee:</strong>{' '}
                {nodes.find(n => n.id === hoveredNode.assignee)?.label || 'UNASSIGNED (Autonomic Queue)'}
              </div>
            </div>
          )}

          {hoveredNode.type === 'decision' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong style={{ color: '#fff' }}>Issue:</strong> {hoveredNode.label}</div>
              <div><strong style={{ color: '#fff' }}>Voters Configured:</strong> {hoveredNode.votersCount}</div>
              <div><strong style={{ color: '#fff' }}>Status:</strong> Awaiting expert signatures</div>
              <div><strong style={{ color: '#fff' }}>Consensus Level:</strong> {hoveredNode.consensusPercent}%</div>
            </div>
          )}
        </div>
      )}

      {/* Floating Canvas Badges */}
      <div className="canvas-node-overlay">
        <div className="overlay-status">
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isAutonomicMode ? '#10b981' : '#64748b' }}></span>
          <span>SYSTEM AUTO-BALANCING: {isAutonomicMode ? 'ACTIVE' : 'MANUAL'}</span>
        </div>
        <div className="overlay-status">
          <span>NET FLUX SENSORS: 100% ONLINE</span>
        </div>
      </div>
    </div>
  );
};

export default NeuralGraph;
