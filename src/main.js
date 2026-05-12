import './style.css'
import React from 'react';
import { createRoot } from 'react-dom/client';
import GraphApp from './GraphApp';

// Mount React force graph into the hero
const graphMount = document.getElementById('force-graph-mount');
if (graphMount) {
  const root = createRoot(graphMount);
  root.render(React.createElement(GraphApp));
}

// Initialize the system
document.addEventListener('DOMContentLoaded', () => {
  // Auto-initialize visualization
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('moirai-initialize'));
    const hero = document.querySelector('.hero');
    if (hero) hero.classList.add('graph-active');
  }, 500);
  
  // Update status numbers randomly to simulate "processing"
  const statusItems = document.querySelectorAll('.status-item span:last-child');
  
  setInterval(() => {
    statusItems.forEach(item => {
      if (item.innerText.includes('%')) {
        const current = parseFloat(item.innerText);
        const next = (current + (Math.random() * 0.02 - 0.01)).toFixed(2);
        item.innerText = `${next}%`;
      }
    });
  }, 3000);

  // System Log Simulation
  const logContainer = document.getElementById('log-container');
  const logMessages = [
    '> NEURAL_RECORD: New high-fidelity fact extracted [Type: IDT]',
    '> DURABLE_STORAGE: Persisting cognitive preference for Subject 2',
    '> KNOWLEDGE_FLOW: Subject 5 → Subject 2 [Social Hop: 1]',
    '> RECALL_FILTER: Fading older memory details for Subject 4',
    '> SYNTHESIS: Distilling durable facts from Subject 1 interactions',
    '> INTENT_FLOW: Subject 3 goal → ACTIVATED',
    '> SCHEMA_SYNC: Historical records validated',
    '> PRIVACY_GATE: Protecting private thoughts from social spread',
    '> RECALL_BALANCE: Organizing memory tiers for efficiency',
    '> SOCIAL_ROUTING: Identifying eligible recipients in shared circles',
    '> DRIFT_MONITOR: Subject 5 hearsay reaching propagation limit',
    '> RECALL_STABILITY: Adjusting memory clarity for Subject 6',
    '> VITALITY_MONITOR: System latency stable, memory depth increasing',
    '> SUBJECT_WEAVER: Subject 1 identity refined and updated',
    '> LOOP_SUPPRESSION: Preventing redundant gossip cycles',
    '> [INFO] ENGINE_HEALTH: Narrative processing active',
    '> TEMPORAL_CHAIN: Linking Subject 2 experiences chronologically'
  ];

  if (logContainer) {
    setInterval(() => {
      const msg = document.createElement('div');
      msg.innerText = logMessages[Math.floor(Math.random() * logMessages.length)];
      logContainer.prepend(msg);
      if (logContainer.children.length > 15) {
        logContainer.lastElementChild.remove();
      }
    }, 2000);
  }
});
