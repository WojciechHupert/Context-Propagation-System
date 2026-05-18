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

/**
 * Lightbox System for CPS Studio Gallery
 */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const captionText = document.getElementById('caption');
  const closeBtn = document.querySelector('.close-modal');
  const lightboxTriggers = document.querySelectorAll('.cps-interface-tile, .cps-social-flow-container');

  if (!lightbox || !lightboxImg || !lightboxTriggers.length) return;

  lightboxTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const img = trigger.querySelector('img');
      const fullSrc = img?.currentSrc || img?.getAttribute('src') || trigger.getAttribute('data-full');
      const altText = img ? img.getAttribute('alt') : '';

      if (!fullSrc) return;

      lightbox.style.display = 'block';
      lightboxImg.src = fullSrc;
      captionText.innerHTML = altText;
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
  });

  const closeLightbox = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxImg || e.target === closeBtn) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// Initialize the system
document.addEventListener('DOMContentLoaded', () => {
  initLightbox();
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
