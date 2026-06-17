import React, { useState } from 'react';
import { GitPullRequest, Vote, Users, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';

const MOCK_DISPUTES = [
  {
    id: 'disp1',
    topic: 'GraphQL vs REST API',
    chat: [
      { sender: 'Bob', msg: "I think REST is faster to setup, we're in a rush." },
      { sender: 'Alice', msg: "But GraphQL avoids under-fetching. Our client graphs are nested." },
      { sender: 'Diana', msg: "Wait, the client load is high. GraphQL reduces queries from 15 to 1." }
    ],
    options: [
      { text: 'Implement GraphQL API', baseWeight: 5.5, key: 'graphql' },
      { text: 'Implement REST endpoints with filters', baseWeight: 3.2, key: 'rest' }
    ],
    voters: [
      { name: 'Alice', weight: 4.5, voted: 'graphql', reason: 'Expert in schema models' },
      { name: 'Diana', weight: 3.0, voted: 'graphql', reason: 'Expert in frontend data' },
      { name: 'Bob', weight: 1.5, voted: 'rest', reason: 'Developer in charge of gateway' }
    ]
  },
  {
    id: 'disp2',
    topic: 'Auth System Strategy',
    chat: [
      { sender: 'Charlie', msg: "Let's host our own OAuth server to save license costs." },
      { sender: 'Alice', msg: "Hosting auth is a compliance liability. We need Auth0." },
      { sender: 'Diana', msg: "Agree with Alice, let's keep security outsourced." }
    ],
    options: [
      { text: 'Managed Identity Provider (Auth0/Firebase)', baseWeight: 7.0, key: 'managed' },
      { text: 'Self-Hosted OAuth2 Server', baseWeight: 1.5, key: 'self' }
    ],
    voters: [
      { name: 'Alice', weight: 4.5, voted: 'managed', reason: 'Security Officer role' },
      { name: 'Charlie', weight: 3.5, voted: 'self', reason: 'Lead DevOps infrastructure' },
      { name: 'Diana', weight: 2.0, voted: 'managed', reason: 'Regulatory compliance specialist' }
    ]
  }
];

const ConsensusPanel = ({ onAddLogEntry }) => {
  const [disputeIndex, setDisputeIndex] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const dispute = MOCK_DISPUTES[disputeIndex];

  // Calculate dynamic weights
  const totalVoterWeight = dispute.voters.reduce((acc, v) => acc + v.weight, 0) + (userVote ? 3.0 : 0);
  
  const getVotesForOption = (key) => {
    let weight = dispute.options.find(o => o.key === key)?.baseWeight || 0;
    
    // Add voter weights
    dispute.voters.forEach(v => {
      if (v.voted === key) {
        weight += v.weight;
      }
    });

    // Add user vote weight
    if (userVote === key) {
      weight += 3.0; // User weight is 3.0
    }

    return weight;
  };

  const getOptionPercent = (key) => {
    const total = dispute.options.reduce((acc, opt) => acc + getVotesForOption(opt.key), 0);
    if (total === 0) return 0;
    return Math.round((getVotesForOption(key) / total) * 100);
  };

  const handleVoteClick = (key) => {
    if (voteSubmitted) return;
    setUserVote(key);
  };

  const handleCastVote = () => {
    if (!userVote) return;
    setVoteSubmitted(true);
    
    const selectedText = dispute.options.find(o => o.key === userVote)?.text;
    onAddLogEntry('SYNC', `Cast weighted vote: "${selectedText}" [Signature registered]`);
    
    // Auto resolution timer
    setTimeout(() => {
      onAddLogEntry('AUTONOMIC', `Consensus locked: "${selectedText}". Triggering automated pull-request merges and workspace configuration rebuild.`);
    }, 2000);
  };

  const handleReset = () => {
    setUserVote(null);
    setVoteSubmitted(false);
    // Cycle dispute
    setDisputeIndex((disputeIndex + 1) % MOCK_DISPUTES.length);
  };

  return (
    <div className="consensus-card glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitPullRequest size={18} className="bullet-icon" style={{ color: 'var(--color-secondary)' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Consensus Synapse</h3>
        </div>
        <div className="logo-badge" style={{ color: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' }}>
          RESOLVER ACTIVE
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
        The system continuously parses team chats for technical conflict, maps domain experience weights, and spins up autonomic ballot gates.
      </p>

      {/* 1. Chat parser section */}
      <div className="consensus-chat-mock">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
          <MessageSquare size={12} />
          <span>AMBIENT DISCUSSION AUDIO/TEXT STREAM</span>
        </div>
        {dispute.chat.map((c, idx) => (
          <div key={idx} className="chat-bubble">
            <span className="chat-author">{c.sender}:</span>
            <span className="chat-msg">"{c.msg}"</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.15)', fontSize: '0.7rem', color: 'var(--color-secondary)', marginTop: '4px' }}>
          <AlertCircle size={12} className="pulse-primary" />
          <span>AI Synapse: Friction detected. Initiating ballot gate #{dispute.id}.</span>
        </div>
      </div>

      {/* 2. Ballot form */}
      <div className="consensus-ballot">
        <div className="ballot-meta">
          <span>BALLOT: {dispute.topic}</span>
          <span style={{ color: 'var(--color-accent)' }}>WEIGHTED VOTING</span>
        </div>

        <div className="ballot-options">
          {dispute.options.map((option) => {
            const votes = getVotesForOption(option.key);
            const pct = getOptionPercent(option.key);
            const isSelected = userVote === option.key;

            return (
              <div 
                key={option.key} 
                className={`ballot-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleVoteClick(option.key)}
              >
                <div className="option-details">
                  <span>{option.text}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{pct}% ({votes.toFixed(1)}w)</span>
                </div>
                <div className="option-votes-bar-bg">
                  <div className="option-votes-bar" style={{ width: `${pct}%`, background: isSelected ? 'var(--color-secondary)' : 'var(--color-accent)' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Voter expert weight mappings */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Users size={12} />
            <span>EXPERT WEIGHT MATRICES (Telemetry derived)</span>
          </div>
          <div className="consensus-voters-list">
            {dispute.voters.map((v, idx) => (
              <div key={idx} className="voter-tag" title={v.reason}>
                {v.name}: {v.weight}x weight ({v.voted === 'graphql' || v.voted === 'managed' ? 'Option A' : 'Option B'})
              </div>
            ))}
            {userVote && (
              <div className="voter-tag" style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}>
                You: 3.0x weight (Tentative)
              </div>
            )}
          </div>
        </div>

        {/* Control button */}
        {!voteSubmitted ? (
          <button 
            onClick={handleCastVote}
            disabled={!userVote}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              marginTop: '16px',
              padding: '8px',
              opacity: userVote ? 1 : 0.5,
              cursor: userVote ? 'pointer' : 'not-allowed'
            }}
          >
            <Vote size={14} />
            Cast Dynamic Ballot Signature
          </button>
        ) : (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', borderRadius: '6px', color: 'var(--color-success)', fontSize: '0.8rem' }}>
              <CheckCircle size={16} />
              <span>CONSENSUS RESOLVED & SECURED</span>
            </div>
            
            <button 
              onClick={handleReset}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
            >
              Analyze Next Dispute
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsensusPanel;
