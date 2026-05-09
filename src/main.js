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
  console.log('MOIRAI System Initialized...');
  
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

  // CTA Interaction — "Initialize Moirai" button
  const cta = document.querySelector('.cta-button');
  if (cta) {
    let initialized = false;
    cta.addEventListener('click', () => {
      if (initialized) return;
      
      cta.innerText = 'INITIALIZING...';
      cta.style.opacity = '0.7';
      cta.style.pointerEvents = 'none';
      
      // Fire custom event to show the graph
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('moirai-initialize'));
        cta.innerText = 'SYSTEM ACTIVE';
        cta.style.background = 'transparent';
        cta.style.border = '1px solid var(--accent-color)';
        cta.style.color = 'var(--accent-color)';
        cta.style.opacity = '1';
        initialized = true;
        
        // Add the active class to hero for visual feedback
        const hero = document.querySelector('.hero');
        if (hero) hero.classList.add('graph-active');
      }, 1200);
    });
  }

  // System Log Simulation
  const logContainer = document.getElementById('log-container');
  const logMessages = [
    '> PROPAGATION_EVENT: NPC5 → NPC2 [MutationCount: 1]',
    '> RECALL_FILTER: Applying age-vagueness to NPC4.MemoryRecord #417',
    '> MAINTENANCE: Extracting durable facts from NPC1 transcript',
    '> ACTION_LIFECYCLE: NPC3.ActionRecord #89 → TRIGGERED',
    '> SCHEMA_SYNC: 11 canonical tables validated',
    '> PRIVACY_GATE: Blocking private clause from propagation',
    '> PROMPT_BUDGET: Recent=4, Stable=6, Social=3, Emotional=2',
    '> ASSOCIATIVE_ROUTING: ShareGroup "dome_core" → 3 eligible recipients',
    '> DRIFT_COUNTER: NPC5 hearsay at hop 2/2 [DEPTH_CAP]',
    '> RECALL_STABILITY: Degrading fragile memory for NPC6',
    '> SANCTUM_TELEMETRY: DB latency 12ms, active turns 847',
    '> SUBJECT_WEAVER: NPC1 SystemPrompt recompiled',
    '> LOOP_SUPPRESSION: Blocking recursive hearsay for existing record',
    '> [INFO] OLLAMA_HEALTH: 127.0.0.1:11434 responsive',
    '> TEMPORAL_CHAIN: Linking NPC2.Memory #503 → #501 via PreviousMemoryId'
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
