import React, { useState, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, Background,
  Handle, Position, MarkerType,
  applyNodeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import './system.css';

const nodeInfo = {
  // === DUAL-LAYER MEMORY ===
  layer_system: { 
    title: "Layer 1: System Memory (Canonical)", 
    body: "The canonical SQLite database. Accurate, structured, append-only, and never destructively edited. It contains the complete source chain of how information was acquired.", 
    list: ["Integrity: Immutable append-only", "Storage: SQLite3 shared DB", "Tables: 11 canonical tables", "Access: Shared by Runtime and Moirai Studio"] 
  },
  layer_character: { 
    title: "Layer 2: Character Recall (Volatile)", 
    body: "Generated at retrieval time. Imperfect, selective, and emotional. This layer ensures Subjects don't recite database entries, but instead 'remember' naturally.", 
    list: ["Nature: Active filter, not stored data", "Behaviors: Forgetting, vagueness, drift", "Influence: Time and Emotion", "Output: Humanized recall"] 
  },

  player_talk: { title: "Conversation", body: "The player interacts with a Subject. The engine manages the dialogue lifecycle and ensures the persistence of shared experiences.", list: ["Input: Spoken dialogue", "Processing: Narrative extraction"] },
  llm_gen: { title: "Memory Generation", body: "The engine processes the conversation with context from past history, shared hearsay, and recent interactions.", list: ["Input: Context + Transcript", "Output: Refined narrative text"] },
  sanitize: { title: "Dialogue Polishing", body: "Dialogue is refined to remove system traces and technical metadata before it becomes a part of the Subject's history.", list: ["Goal: Maintain narrative immersion", "Rule: Only natural dialogue is preserved"] },
  repair: { title: "Quality Check", body: "If the output deviates from natural speech, the system performs a quick adjustment to maintain the integrity of the conversation.", list: ["Trigger: Inconsistent output", "Action: Real-time correction"] },
  fallback: { title: "Contextual Fallback", body: "In rare cases where a memory cannot be fully reconstructed, a stable fallback ensures the conversation continues smoothly.", list: ["Tag: stable_fallback", "Rule: Maintains narrative flow"] },
  persist: { title: "Experience Archival", body: "Only natural, meaningful dialogue is saved as a permanent part of the collective history.", list: ["Storage: Secure historical database", "Rule: System noise is excluded"] },
  maintenance: { title: "Memory Synthesis", body: "Periodic synthesis identifies key facts and emotional weights from recent interactions to form durable memories.", list: ["Trigger: Interaction threshold", "Focus: Facts and relationships"] },
  mem_record: { title: "Memory Formation", body: "An atomic unit of history. Each record is woven into a chronological chain that defines a Subject's past.", list: ["Metadata: Emotion and Confidence", "Metadata: Stability and Risk", "Chaining: Links related experiences"] },
  action_record: { title: "Intent Formation", body: "When a Subject commits to a future action, a structured intent is captured to ensure follow-through.", list: ["Lifecycle: Pending → Active → Fulfilled", "Focus: Commitments and goals"] },
  action_eval: { title: "Intent Evaluation", body: "Pending intents are monitored. If the right conditions aren't met, they naturally fade or evolve into reflections.", list: ["Process: Continuity check", "Result: Trigger or expire"] },
  continuity: { title: "Moirai Engine", body: "The central authority for time and history. It orchestrates the natural flow of information across the social network.", list: ["Process: Social propagation", "Cycle: Regular experience review"] },
  gate_eligible: { title: "Step 1: Eligibility", body: "Information must be shareable to flow. Private thoughts remain personal and never spread without cause.", list: ["Check: Accessibility level", "Limit: Propagation depth"] },
  gate_identity: { title: "Step 2: Social Context", body: "The system ensures information flows between distinct individuals with unique roles in the simulation.", list: ["IDs: Standardized Subject markers"] },
  gate_relationship: { title: "Step 3: Bonds", body: "Information prefers to move through established social circles and meaningful relationships.", list: ["Focus: Social ties and relevance", "Scoring: Emotional weight"] },
  gate_resonance: { title: "Step 4: Resonance", body: "Knowledge moves where it fits. Information is ignored if it doesn't align with a Subject's existing knowledge or interests.", list: ["Focus: Network alignment", "Action: Filter irrelevant gossip"] },
  gate_dedup: { title: "Step 5: Equilibrium", body: "Prevents the repetitive spread of information. Subjects only acknowledge news that is fresh or personally relevant.", list: ["Rule: Prevent loops", "Action: Suppress redundant hearsay"] },
  clone_write: { title: "Social Acquisition", body: "When a story is shared, it is written into the recipient's history as a new, personal perspective.", list: ["Ownership: Recipient's perspective", "Linkage: Traceable origin"] },
  social_drift: { title: "Social Mutation", body: "As stories spread, their tone and certainty shift, reflecting the living nature of social communication.", list: ["Preserved: Core essence", "Mutation: Tone and confidence"] },
  rej_private: { title: "Blocked: Private", body: "Intimate or secret information is protected and prevented from social spread.", list: ["Security: Privacy protection", "Safety: Prevents secret leaks"] },
  rej_no_resonance: { title: "Blocked: No Interest", body: "The information failed to resonate with the target Subject's perspective or social networks.", list: ["Result: Naturally ignored"] },
  rej_dedup: { title: "Blocked: Already Known", body: "The Subject already possesses this information, maintaining information equilibrium.", list: ["Prevention: Gossip suppression"] },
  approach: { title: "Interaction Initiated", body: "A new conversation begins. The system prepares the social and historical context for this specific Subject.", list: ["Trigger: Direct interaction", "Focus: Social continuity"] },
  retrieval: { title: "Contextual Retrieval", body: "Experiences are gathered from history and organized by relevance to ensure a focused and meaningful interaction.", list: ["Tier: Recent interactions", "Tier: Foundational history", "Tier: Social hearsay", "Tier: Emotional weight"] },
  recall_filter: { title: "Recall Filter", body: "An active lens between history and dialogue. It applies the natural nuances of thought: forgetting, hesitation, and personal perspective.", list: ["Fluidity: Details shift with time", "Nuance: Hearsay encourages caution", "Authenticity: 'must hedge' for rumors", "Labels: 'Your Experiences', 'Rumors & News'"] },
  prompt_inject: { title: "Narrative Assembly", body: "The filtered context is woven into the Subject's current state of mind, preparing them for a natural interaction.", list: ["Focus: Narrative immersion", "Constraint: Maintain personal history"] },
  npc_output: { title: "Subject Dialogue", body: "The final interaction. Subjects speak with a depth rooted in their personal and shared history, not just data.", list: ["Rule: Moirai remembers accurately; Subjects remember naturally", "Goal: Human-centric simulation"] },
  act_pending: { title: "Pending Intent", body: "A future goal formed in conversation, awaiting the right moment to be realized." },
  act_triggered: { title: "Active Intent", body: "The moment for action has arrived. The intent is now a part of the Subject's current focus." },
  act_used: { title: "Fulfilled Intent", body: "The action has been performed and is now a part of the Subject's historical record." },
  act_expired: { title: "Faded Intent", body: "The moment passed or the goal was forgotten. It now exists only as a past reflection." },
  'studio-sys': { title: "Sanctum / Systems", body: "Vitality monitor tracking interaction flow and memory formation in real-time." },
  'studio-sub': { title: "Subject Weaver", body: "Curation of core identities. Refine the perspectives and personalities that drive Subject behavior." },
  'studio-arc': { title: "The Archives / Oracle", body: "Historical audit suite. Visualize story migration and the evolution of shared truth." },
};

const AreaNode = ({ data }) => (
  <div style={{
    width: data.width || '450px',
    height: data.height || '600px',
    border: `2px solid ${data.color || 'rgba(255,255,255,0.4)'}`,
    borderRadius: '8px',
    background: data.bgColor || 'rgba(255,255,255,0.04)',
    pointerEvents: 'none',
    position: 'relative',
    boxSizing: 'border-box',
    boxShadow: `0 0 40px ${data.color}11`,
  }}>
    {/* Label floats on top border — classic fieldset style */}
    <div style={{
      position: 'absolute',
      top: '-18px',
      left: '20px',
      fontSize: '18px',
      fontFamily: 'var(--font-mono)',
      color: data.color || '#fff',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      fontWeight: '800',
      background: '#010810',
      padding: '5px 16px',
      border: `1px solid ${data.color || '#fff'}`,
      whiteSpace: 'nowrap',
      zIndex: 20
    }}>
      {data.label}
    </div>
    {data.description && (
      <div style={{
        position: 'absolute',
        bottom: '18px',
        left: '20px',
        right: '20px',
      fontSize: '20px',
      fontFamily: 'var(--font-sans)',
      color: 'rgba(255,255,255,0.65)',
      lineHeight: 1.5,
        fontWeight: '400',
        pointerEvents: 'none',
        borderTop: `1px solid ${data.color || 'rgba(255,255,255,0.1)'}22`,
        paddingTop: '12px',
      }}>
        {data.description}
      </div>
    )}
  </div>
);

const ModernNode = ({ data }) => (
  <div style={{
    background: '#050505',
    border: `1px solid ${data.borderColor || 'rgba(255,255,255,0.6)'}`,
    borderRadius: '2px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    width: '350px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    opacity: 1
  }}>
    <div style={{
      height: '4px',
      background: data.color || '#fff',
      width: '100%',
    }} />
    <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: '24px', color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {data.label}
      </div>
    </div>
    <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)' }} />
    <div style={{ padding: '12px 16px', fontSize: '15px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
      {data.id ? `ID: ${data.id.toUpperCase()}` : ''}
    </div>
    <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', width: 1, height: 1, opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', width: 1, height: 1, opacity: 0 }} />
    <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 'none', width: 1, height: 1, opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 'none', width: 1, height: 1, opacity: 0 }} />
  </div>
);

const SectionLabel = ({ data }) => (
  <div style={{ 
    fontSize: '18px', 
    fontFamily: 'var(--font-mono)', 
    color: data.color || 'rgba(255,255,255,0.6)', 
    letterSpacing: '0.25em', 
    textTransform: 'uppercase', 
    fontWeight: 800, 
    padding: '8px 0',
    borderBottom: `1px solid ${data.color || 'rgba(255,255,255,0.2)'}`,
    width: 'fit-content',
    pointerEvents: 'none',
  }}>
    {data.label}
  </div>
);

const nodeTypes = { modern: ModernNode, label: SectionLabel, area: AreaNode };

// Layout constants
// Layout constants - Spread wide to fill 2560px screens and eliminate side gaps
const COL_LEFT   = 100;  // rejection nodes
const COL_MAIN   = 600;  // write path main chain
const COL_MID    = 1150; // action lifecycle
const COL_RIGHT  = 1750; // read path
const COL_BUCKET = 2150; // retrieval buckets
const ROW = 160;         // vertical step between nodes

const initialNodes = [
  // ── BACKGROUND AREAS ──────────────────────────────────────────────────────
  {
    id: 'area_system',
    type: 'area',
    position: { x: 36.24277456647394, y: -816.184971098266 },
    data: {
      id: 'layer_system',
      label: 'Layer 1 — Canonical System Memory',
      color: '#ff4d00',
      bgColor: 'rgba(255,77,0,0.03)',
      width: '1000px',
      height: '2300px',
      description: 'The canonical SQLite database. Accurate, structured, append-only, and never destructively edited. Contains the full truth and the complete source chain of how information was acquired.',
    },
  },
  {
    id: 'area_lifecycle',
    type: 'area',
    position: { x: 1091.878612716763, y: -297.68786127167625 },
    data: {
      label: 'Action Lifecycle',
      color: '#8a2be2',
      bgColor: 'rgba(138,43,226,0.03)',
      width: '480px',
      height: '1400px',
    },
  },
  {
    id: 'area_character',
    type: 'area',
    position: { x: 1690, y: 350 },
    data: {
      id: 'layer_character',
      label: 'Layer 2 — Volatile Character Recall',
      color: '#00aaff',
      bgColor: 'rgba(0,170,255,0.03)',
      width: '950px',
      height: '1200px',
      description: 'Generated at retrieval time. Imperfect, selective, and emotional. Subjects may forget, distort, or hesitate based on their current state and relationship to the information.',
    },
  },

  // ── WRITE PATH HEADER ─────────────────────────────────────────────────────
  { id: 'lbl_write', type: 'label', position: { x: 385.83815028901734, y: -755.578034682081 }, data: { label: '// WRITE PATH — Conversation → Storage → Propagation', color: '#ff4d00' }, selectable: false },

  // ── WRITE PATH NODES ──────────────────────────────────────────────────────
  { id: 'player_talk',       type: 'modern', position: { x: 600, y: -700 }, data: { id: 'player_talk',       label: 'Conversation',     color: '#ff4d00' } },
  { id: 'llm_gen',           type: 'modern', position: { x: 600, y: -540 }, data: { id: 'llm_gen',           label: 'LLM Generate',    color: '#ff4d00' } },
  { id: 'sanitize',          type: 'modern', position: { x: 600, y: -380 }, data: { id: 'sanitize',      label: 'Sanitize',         color: '#ff4d00' } },
  { id: 'persist',           type: 'modern', position: { x: 600, y: -220 }, data: { id: 'persist',        label: 'Persist Turn',     color: '#ff4d00' } },
  { id: 'maintenance',       type: 'modern', position: { x: 600, y: -60 }, data: { id: 'maintenance',    label: 'Maintenance',      color: '#ff4d00' } },
  { id: 'mem_record',        type: 'modern', position: { x: 600, y: 100 }, data: { id: 'mem_record',     label: 'MemoryRecord',     color: '#ff4d00' } },
  { id: 'continuity',        type: 'modern', position: { x: 600, y: 260 }, data: { id: 'continuity',     label: 'Moirai Engine',color: '#ff4d00' } },

  // ── PROPAGATION GATES ─────────────────────────────────────────────────────
  { id: 'gate_eligible',     type: 'modern', position: { x: 600, y: 420  }, data: { id: 'gate_eligible',    label: '① Eligibility',    color: '#ffcc00' } },
  { id: 'gate_identity',     type: 'modern', position: { x: 600, y: 580  }, data: { id: 'gate_identity',    label: '② Identity',       color: '#ffcc00' } },
  { id: 'gate_relationship', type: 'modern', position: { x: 600, y: 740  }, data: { id: 'gate_relationship',label: '③ Relationship',   color: '#ffcc00' } },
  { id: 'gate_resonance',    type: 'modern', position: { x: 600, y: 900 }, data: { id: 'gate_resonance',   label: '④ Resonance',      color: '#ffcc00' } },
  { id: 'gate_dedup',        type: 'modern', position: { x: 600, y: 1060 }, data: { id: 'gate_dedup',       label: '⑤ Deduplication',  color: '#ffcc00' } },
  { id: 'clone_write',       type: 'modern', position: { x: 600, y: 1220 }, data: { id: 'clone_write',      label: 'Atomic Write',     color: '#00cc66' } },
  { id: 'social_drift',      type: 'modern', position: { x: 600, y: 1380 }, data: { id: 'social_drift',     label: 'Social Drift',     color: '#00cc66' } },

  // ── REJECTION NODES (left column) ─────────────────────────────────────────
  { id: 'repair',            type: 'modern', position: { x: 100, y: -380 }, data: { id: 'repair',    label: 'Repair Pass',    color: '#ff8800' } },
  { id: 'fallback',          type: 'modern', position: { x: 100, y: -220 }, data: { id: 'fallback',  label: 'Fallback',       color: '#ff8800' } },
  { id: 'rej_private',       type: 'modern', position: { x: 103.757225433526, y: 574.0462427745665  }, data: { id: 'rej_private',     label: 'Blocked: Private',color: '#ff3333' } },
  { id: 'rej_no_resonance',  type: 'modern', position: { x: 98.12138728323703, y: 1076.5895953757226 }, data: { id: 'rej_no_resonance',label: 'No Resonance',    color: '#ff3333' } },
  { id: 'rej_dedup',         type: 'modern', position: { x: 98.12138728323703, y: 1236.5895953757226 }, data: { id: 'rej_dedup',       label: 'Already Known',   color: '#ff3333' } },

  // ── ACTION LIFECYCLE (middle column) ──────────────────────────────────────
  { id: 'action_record',  type: 'modern', position: { x: 1150, y: -220 }, data: { id: 'action_record', label: 'ActionRecord',    color: '#8a2be2' } },
  { id: 'action_eval',    type: 'modern', position: { x: 1150, y: -60 }, data: { id: 'action_eval',   label: 'Evaluate/Expire', color: '#8a2be2' } },
  { id: 'act_pending',    type: 'modern', position: { x: 1150, y: 100 }, data: { id: 'act_pending',   label: 'Pending',         color: '#ffaa00' } },
  { id: 'act_triggered',  type: 'modern', position: { x: 1150, y: 260 }, data: { id: 'act_triggered', label: 'Triggered',       color: '#00cc66' } },
  { id: 'act_used',       type: 'modern', position: { x: 1150, y: 420 }, data: { id: 'act_used',      label: 'Used',            color: '#4488ff' } },
  { id: 'act_expired',    type: 'modern', position: { x: 1150, y: 580 }, data: { id: 'act_expired',   label: 'Expired',         color: '#666' } },

  // ── READ PATH (right column) ───────────────────────────────────────────────
  { id: 'lbl_read_label', type: 'label', position: { x: 1750, y: 390 }, data: { label: '// READ PATH — Retrieval → Recall → Output', color: '#00aaff' }, selectable: false },
  { id: 'approach',       type: 'modern', position: { x: 1750, y: 420  }, data: { id: 'approach',      label: 'Player Approaches', color: '#00aaff' } },
  { id: 'retrieval',      type: 'modern', position: { x: 1750, y: 580  }, data: { id: 'retrieval',     label: 'Bucket Retrieval',  color: '#00aaff' } },
  { id: 'recall_filter',  type: 'modern', position: { x: 1748.121387283237, y: 1012.398843930636  }, data: { id: 'recall_filter', label: 'Recall Filter',     color: '#00aaff' } },
  { id: 'prompt_inject',  type: 'modern', position: { x: 1748.121387283237, y: 1172.398843930636 }, data: { id: 'prompt_inject', label: 'Prompt Assembly',   color: '#00aaff' } },
  { id: 'npc_output',     type: 'modern', position: { x: 1748.121387283237, y: 1332.398843930636 }, data: { id: 'npc_output',    label: 'Subject Dialogue',      color: '#00aaff' } },

  // ── RETRIEVAL BUCKETS ─────────────────────────────────────────────────────
  { id: 'bk_recent',    type: 'modern', position: { x: 2140.606936416185, y: 734.0462427745665       }, data: { id: 'retrieval', label: 'Recent',    color: '#00aaff' } },
  { id: 'bk_stable',    type: 'modern', position: { x: 2144.3641618497113, y: 874.8265895953757  }, data: { id: 'retrieval', label: 'Stable',    color: '#00aaff' } },
  { id: 'bk_social',    type: 'modern', position: { x: 2150, y: 1009.971098265896 }, data: { id: 'retrieval', label: 'Social',    color: '#00aaff' } },
  { id: 'bk_emotional', type: 'modern', position: { x: 2150, y: 1169.5375722543354 }, data: { id: 'retrieval', label: 'Emotional', color: '#00aaff' } },
];

const initialEdges = [
  { id: 'w1', source: 'player_talk', target: 'llm_gen', type: 'straight' },
  { id: 'w2', source: 'llm_gen', target: 'sanitize', type: 'straight' },
  { id: 'w3', source: 'sanitize', target: 'persist', type: 'straight' },
  { id: 'w4', source: 'persist', target: 'maintenance', type: 'straight' },
  { id: 'w5', source: 'maintenance', target: 'mem_record', type: 'straight' },
  { id: 'w5b', source: 'maintenance', target: 'action_record', type: 'straight' },
  { id: 'w6', source: 'mem_record', target: 'continuity', type: 'straight' },
  { id: 'w_act', source: 'action_record', target: 'action_eval', type: 'straight' },
  { id: 'act1', source: 'action_eval', target: 'act_pending', type: 'straight' },
  { id: 'act2', source: 'act_pending', target: 'act_triggered', type: 'straight' },
  { id: 'act3', source: 'act_triggered', target: 'act_used', type: 'straight' },
  { id: 'act4', source: 'act_used', target: 'act_expired', type: 'straight' },
  { id: 'r1', source: 'sanitize', target: 'repair', type: 'straight' },
  { id: 'r2', source: 'repair', target: 'fallback', type: 'straight', animated: true },
  { id: 'g0', source: 'continuity', target: 'gate_eligible', type: 'straight' },
  { id: 'g1', source: 'gate_eligible', target: 'gate_identity', type: 'straight' },
  { id: 'g2', source: 'gate_identity', target: 'gate_relationship', type: 'straight' },
  { id: 'g3', source: 'gate_relationship', target: 'gate_resonance', type: 'straight' },
  { id: 'g4', source: 'gate_resonance', target: 'gate_dedup', type: 'straight' },
  { id: 'g5', source: 'gate_dedup', target: 'clone_write', type: 'straight' },
  { id: 'g6', source: 'clone_write', target: 'social_drift', type: 'straight' },
  { id: 'rej1', source: 'gate_eligible', target: 'rej_private', type: 'straight', animated: true },
  { id: 'rej2', source: 'gate_resonance', target: 'rej_no_resonance', type: 'straight', animated: true },
  { id: 'rej3', source: 'gate_dedup', target: 'rej_dedup', type: 'straight', animated: true },
  { id: 'rd1', source: 'approach', target: 'retrieval', type: 'straight' },
  { id: 'rd2', source: 'retrieval', target: 'recall_filter', type: 'straight' },
  { id: 'rd3', source: 'recall_filter', target: 'prompt_inject', type: 'straight' },
  { id: 'rd4', source: 'prompt_inject', target: 'npc_output', type: 'straight' },
  { id: 'bk1', source: 'retrieval', target: 'bk_recent', type: 'straight' },
  { id: 'bk2', source: 'retrieval', target: 'bk_stable' },
  { id: 'bk3', source: 'retrieval', target: 'bk_social' },
  { id: 'bk4', source: 'retrieval', target: 'bk_emotional' },
  { id: 'cross1', source: 'social_drift', target: 'retrieval', style: { strokeDasharray: '8 4' } },
].map(e => ({
  ...e,
  type: e.type || 'smoothstep',
  pathOptions: { borderRadius: 12 },
  markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.6)', width: 16, height: 16 },
  style: { 
    stroke: 'rgba(255,255,255,0.5)', 
    strokeWidth: 2, 
    ...(e.style || {}) 
  }
}));

const SystemDiagram = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [active, setActive] = useState(nodeInfo['player_talk']);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onNodeClick = useCallback((_, node) => {
    const infoId = node.data.id || node.id;
    if (nodeInfo[infoId]) setActive(nodeInfo[infoId]);
    setEdges(eds => eds.map(e => {
      const hit = e.source === node.id || e.target === node.id;
      const highlightColor = e.style?.strokeDasharray ? '#00aaff' : 'var(--accent-color)';
      return { 
        ...e, 
        style: { 
          ...e.style, 
          stroke: hit ? highlightColor : 'rgba(255,255,255,0.4)', 
          strokeWidth: hit ? 3 : 2,
          opacity: 1
        },
        markerEnd: { ...e.markerEnd, color: hit ? highlightColor : 'rgba(255,255,255,0.4)' }
      };
    }));
  }, []);

  return (
    <div style={{
      position: 'relative',
      marginTop: '10px',
      marginLeft: '-40px',
      marginRight: '-40px',
      height: '2100px', // Increased to accommodate the full vertical span of the new layout
      width: 'calc(100% + 80px)',
      border: '1px solid rgba(255,255,255,0.1)',
      background: '#010810'
    }}>
      
      {/* Diagram Header: AI Responsibility Protocol */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        padding: '40px',
        background: 'linear-gradient(180deg, rgba(1, 8, 16, 0.9) 0%, transparent 100%)',
        zIndex: 10
      }}>
        <div style={{ 
          maxWidth: '1100px',
          borderLeft: '2px solid var(--accent-color)',
          paddingLeft: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI IS the interpreter
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '4px' }}>
                EXTRACTION / CLASSIFICATION / PROPAGATION / RECALL FILTERING
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI IS NOT the source of truth
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '4px' }}>
                ZERO PERSISTENT STATE OUTSIDE THE CANONICAL DATABASE
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: '100%', width: '100%', pointerEvents: 'auto' }}>
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick} 
          fitView 
          fitViewOptions={{ padding: 0.01, minZoom: 0.1, maxZoom: 2.0 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255,255,255,0.03)" gap={40} size={1} variant="lines" />
          <Background color="rgba(255,255,255,0.01)" gap={10} size={0.5} variant="lines" />
        </ReactFlow>
      </div>

      {/* Sticky Inspector Wrapper */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '30px'
      }}>
        <div style={{ 
          position: 'sticky', 
          top: '100px', 
          width: '360px',
          height: 'fit-content',
          border: '1px solid rgba(255,255,255,0.2)', 
          background: 'rgba(5, 10, 20, 0.9)', 
          padding: '36px', 
          backdropFilter: 'blur(16px)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 20px rgba(255, 77, 0, 0.05)',
          pointerEvents: 'auto',
          marginRight: '20px'
        }}>
          <span style={{ fontSize: 13, color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.15em' }}>// NODE_INSPECTOR</span>
          <h3 style={{ marginTop: 12, fontSize: '1.75rem', color: '#fff', letterSpacing: '0.02em', fontWeight: 600 }}>{active?.title || 'Select Node'}</h3>
          <p style={{ marginTop: 18, lineHeight: 1.6, fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)' }}>{active?.body}</p>
          {active?.list && (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
              {active.list.map((item, i) => (
                <li key={i} style={{ marginBottom: 12, paddingLeft: 18, position: 'relative', fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                  <span style={{ position: 'absolute', left: 0, color: 'var(--accent-color)', opacity: 0.6 }}>–</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const el = document.getElementById('react-flow-root');
if (el) createRoot(el).render(<SystemDiagram />);

const title = document.querySelector('#studio-panel-title');
const content = document.querySelector('#studio-panel-content');
document.querySelectorAll('.studio-modules .module-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.module-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const d = nodeInfo[card.getAttribute('data-info')];
    if (d && title && content) {
      title.innerText = d.title;
      content.innerHTML = `<p style='line-height:1.6;font-size:0.85rem;color:rgba(255,255,255,0.6);'>${d.body}</p>`;
    }
  });
});
