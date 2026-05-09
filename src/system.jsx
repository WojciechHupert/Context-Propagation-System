import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, Controls, Background,
  applyNodeChanges, applyEdgeChanges,
  Handle, Position, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import './system.css';

const nodeInfo = {
  player_talk: { title: "Player Conversation", body: "The player interacts with a Group(a) NPC via local Ollama LLM. UPlayerConversationComponent manages the chat lifecycle.", list: ["Owner: UPlayerConversationComponent", "Endpoint: Ollama /v1/chat/completions"] },
  llm_gen: { title: "LLM Generation", body: "Ollama processes the prompt with durable memory context, pending actions, shared hearsay, and recent authoritative transcript.", list: ["Input: Memory + Actions + Transcript", "Output: Raw assistant text"] },
  sanitize: { title: "Dialogue Sanitization", body: "Assistant output is scrubbed of reasoning traces, chain-of-thought, meta-commentary, and style notes BEFORE persistence and UI display.", list: ["Goal: Prevent Context Poisoning", "Rule: Only clean spoken dialogue survives"] },
  repair: { title: "Repair Pass", body: "If primary output looks like reasoning or meta text, runtime issues ONE low-temperature repair request for spoken dialogue only.", list: ["Trigger: Bad/empty primary output", "Limit: Single retry attempt"] },
  fallback: { title: "Generic Fallback", body: "If repair also fails, runtime emits a generic fallback reply tagged as non-authoritative. This row never re-enters active context.", list: ["Tag: game_fallback (non-authoritative)", "Rule: Excluded from prompt replay"] },
  persist: { title: "Transcript Persistence", body: "Only sanitized, authoritative dialogue is saved to ConversationTurns in the canonical SQLite DB.", list: ["Storage: SQLite3 canonical DB", "Rule: Non-authoritative rows excluded from maintenance"] },
  maintenance: { title: "Memory Maintenance", body: "Secondary LLM request after turn threshold. Extracts ONLY durable, transcript-grounded facts from authoritative rows.", list: ["Trigger: Turn count threshold or session boundary", "Guardrail: No style notes, no chain-of-thought, no speculation"] },
  mem_record: { title: "MemoryRecord Creation", body: "Atomic unit of information. Each record chains chronologically via PreviousMemoryId. Includes enriched metadata fields.", list: ["Fields: ConfidenceLevel, PrivacyLevel, EmotionalWeight", "Fields: RecallStability, DistortionRisk, SourceKind", "Chaining: PreviousMemoryId links narrative threads"] },
  action_record: { title: "ActionRecord Creation", body: "When an NPC commits to a future action, a structured intent is extracted and stored.", list: ["Lifecycle: pending → triggered → used → expired", "Fields: TriggerWindowStart/End, CooldownUntil", "Rule: Expired actions never re-enter prompts"] },
  action_eval: { title: "Action Evaluation", body: "Pending actions are evaluated against time windows. If window passes without triggering, they expire or convert to past reflections.", list: ["Sweep: On-load continuity synthesis", "Result: Execute or expire"] },
  continuity: { title: "MoiraiContinuitySubsystem", body: "Global system authority for elapsed time and continuity. Runs autonomous 60s propagation cycles.", list: ["Owner: UMoiraiContinuitySubsystem (UE Subsystem)", "Cycle: Evaluates 'shareable' memories", "Cap: 15 propagation events per cycle"] },
  gate_eligible: { title: "Gate 1: Eligibility", body: "Memory must be PrivacyLevel='shareable' or 'public'. Private memories NEVER propagate automatically.", list: ["Check: PrivacyLevel field", "Also: MutationCount < 2 (depth cap)"] },
  gate_identity: { title: "Gate 2: Identity", body: "Source and target must be distinct NPCs with valid identities in ConversationActors.", list: ["IDs: NPC1-NPC6 standardized"] },
  gate_relationship: { title: "Gate 3: Relationship", body: "Propagation prefers NPCs sharing ShareGroupName. Scored by relationship and relevance.", list: ["Primary: Shared group membership", "Scoring: Relationship + relevance + emotional weight"] },
  gate_resonance: { title: "Gate 4: Resonance", body: "Tags and NarrativeNetworks provide secondary resonance. Target NPC's networks must align thematically.", list: ["Fallback: Tag/network matching if no shared group", "Failure: Rumor is silently ignored"] },
  gate_dedup: { title: "Gate 5: Deduplication", body: "Blocks propagation for existing hearsay unless the target NPC is directly implicated in new events.", list: ["Loop Suppression: Prevents recursive hearsay", "Rule: No duplicate social spread"] },
  clone_write: { title: "Atomic Propagation Write", body: "When all 5 gates pass, a SINGLE TRANSACTION writes: new recipient-owned MemoryRecord + PropagationEvent + NpcInteractionRecord.", list: ["Ownership: Recipient owns the clone", "Linkage: SourceMemoryId traces origin", "Tracking: MutationCount incremented"] },
  social_drift: { title: "Social Drift / Mutation", body: "Cloned memory preserves OriginalSummaryText but confidence degrades. Core facts remain stable; tone/certainty may shift.", list: ["Preserved: OriginalSummaryText", "Degraded: ConfidenceLevel", "Cap: MutationCount ≥ 2 = permanently ineligible"] },
  rej_private: { title: "Blocked: Private", body: "Memories with PrivacyLevel='private' are permanently blocked from social propagation.", list: ["Security: Prevents secret leakage", "Fix: Privacy leak was patched May 7, 2026"] },
  rej_no_resonance: { title: "Blocked: No Resonance", body: "Target NPC's networks don't align thematically with the memory content.", list: ["Result: Memory is silently ignored for this target"] },
  rej_dedup: { title: "Blocked: Already Known", body: "Target NPC already possesses this information from a previous propagation cycle.", list: ["Prevention: Stops gossip loops"] },
  approach: { title: "Player Approaches NPC", body: "A NEW conversation begins. The system loads context for this specific NPC from the canonical DB.", list: ["Trigger: Player initiates new dialogue", "Timing: Completely separate from propagation"] },
  retrieval: { title: "Bucketed Retrieval", body: "Memory retrieval is categorized into 4 buckets with hard prompt caps to prevent context sprawl.", list: ["Bucket: Recent (latest interactions)", "Bucket: Stable (core background facts)", "Bucket: Social (propagated hearsay/gossip)", "Bucket: Emotional (high emotional weight)"] },
  recall_filter: { title: "Recall Filter Layer", body: "Active filter between DB and prompt. Applies forgetting, vagueness, distortion, and emotional framing. This is NOT stored data — it's generated at retrieval time.", list: ["Vagueness: Older memories lose specific details", "Hesitation: Hearsay forces hedging language", "Policy: 'must attribute', 'must hedge' for rumors", "Labels: 'Your Experiences', 'Local Rumors & News'"] },
  prompt_inject: { title: "Prompt Assembly", body: "Filtered, imperfect memory context is injected into the system prompt alongside durable memory, pending actions, and recent transcript.", list: ["Speech Policy: Explicit LLM permissions per bucket", "Budget: Hard caps per category"] },
  npc_output: { title: "NPC Spoken Dialogue", body: "The final dialogue delivered to the player. NPCs don't recite DB entries — they speak with human imperfection.", list: ["Rule: Moirai remembers accurately; NPCs remember humanly", "Engine: UPlayerConversationComponent"] },
  'studio-sys': { title: "Sanctum / Systems", body: "Health telemetry showing active conversation turns, verified memories, and DB latency." },
  'studio-sub': { title: "Subject Weaver", body: "Schema-backed identity editing. Personality sliders compile into canonical SystemPrompt for runtime NPC behavior." },
  'studio-arc': { title: "The Archives / Oracle", body: "Moderation grid for transcripts, summaries, memories. Propagation trace with hop counters and mutation audit." },
};

const MinimalNode = ({ data, selected }) => (
  <div style={{
    padding: '8px 14px', borderRadius: '2px',
    background: selected ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${selected ? 'var(--accent-color)' : (data.borderColor || 'rgba(255,255,255,0.1)')}`,
    color: selected ? '#000' : 'rgba(255,255,255,0.8)',
    fontSize: '10px', fontWeight: '600', fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    transition: 'all 0.15s ease', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', minWidth: '110px',
    maxWidth: '160px', lineHeight: 1.3
  }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: data.color || '#fff', flexShrink: 0, opacity: selected ? 1 : 0.6 }} />
    {data.label}
    <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
  </div>
);

const SectionLabel = ({ data }) => (
  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: data.color || 'var(--accent-color)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700, borderBottom: `1px solid ${data.color || 'var(--accent-color)'}`, paddingBottom: 4 }}>
    {data.label}
  </div>
);

const nodeTypes = { minimal: MinimalNode, label: SectionLabel };

// --- WRITE PATH (left, y: 0-900) ---
// --- READ PATH (right, y: 0-500) ---
const X_WRITE = 60;
const X_BRANCH_L = -140;
const X_BRANCH_R = 280;
const X_READ = 550;
const X_READ_R = 750;

const initialNodes = [
  // === SECTION LABELS ===
  { id: 'lbl_write', type: 'label', position: { x: X_WRITE - 10, y: -40 }, data: { label: '// WRITE PATH — Conversation → Storage → Propagation', color: '#ff4d00' }, selectable: false },
  { id: 'lbl_read', type: 'label', position: { x: X_READ - 10, y: -40 }, data: { label: '// READ PATH — Retrieval → Recall → Output', color: '#00aaff' }, selectable: false },

  // === WRITE PATH (Conversation & Extraction) ===
  { id: 'player_talk', type: 'minimal', position: { x: X_WRITE, y: 0 }, data: { id: 'player_talk', label: 'Conversation', color: '#ff4d00' } },
  { id: 'llm_gen', type: 'minimal', position: { x: X_WRITE, y: 70 }, data: { id: 'llm_gen', label: 'LLM Generate', color: '#ff4d00' } },
  { id: 'sanitize', type: 'minimal', position: { x: X_WRITE, y: 140 }, data: { id: 'sanitize', label: 'Sanitize', color: '#ff4d00' } },

  // Repair branch
  { id: 'repair', type: 'minimal', position: { x: X_BRANCH_R, y: 110 }, data: { id: 'repair', label: 'Repair Pass', color: '#ff8800' } },
  { id: 'fallback', type: 'minimal', position: { x: X_BRANCH_R, y: 170 }, data: { id: 'fallback', label: 'Fallback', color: '#ff8800', borderColor: 'rgba(255,136,0,0.3)' } },

  { id: 'persist', type: 'minimal', position: { x: X_WRITE, y: 220 }, data: { id: 'persist', label: 'Persist Turn', color: '#ff4d00' } },
  { id: 'maintenance', type: 'minimal', position: { x: X_WRITE, y: 300 }, data: { id: 'maintenance', label: 'Maintenance', color: '#ff4d00' } },

  // Extraction outputs
  { id: 'mem_record', type: 'minimal', position: { x: X_WRITE - 20, y: 385 }, data: { id: 'mem_record', label: 'MemoryRecord', color: '#ff4d00' } },
  { id: 'action_record', type: 'minimal', position: { x: X_BRANCH_R - 20, y: 385 }, data: { id: 'action_record', label: 'ActionRecord', color: '#8a2be2' } },
  { id: 'action_eval', type: 'minimal', position: { x: X_BRANCH_R - 20, y: 455 }, data: { id: 'action_eval', label: 'Evaluate/Expire', color: '#8a2be2' } },

  // === WRITE PATH (Propagation) ===
  { id: 'continuity', type: 'minimal', position: { x: X_WRITE, y: 480 }, data: { id: 'continuity', label: 'Continuity Engine', color: '#ff4d00' } },

  // 5 Logic Gates
  { id: 'gate_eligible', type: 'minimal', position: { x: X_WRITE - 60, y: 560 }, data: { id: 'gate_eligible', label: '① Eligibility', color: '#ffcc00' } },
  { id: 'gate_identity', type: 'minimal', position: { x: X_WRITE - 60, y: 620 }, data: { id: 'gate_identity', label: '② Identity', color: '#ffcc00' } },
  { id: 'gate_relationship', type: 'minimal', position: { x: X_WRITE - 60, y: 680 }, data: { id: 'gate_relationship', label: '③ Relationship', color: '#ffcc00' } },
  { id: 'gate_resonance', type: 'minimal', position: { x: X_WRITE - 60, y: 740 }, data: { id: 'gate_resonance', label: '④ Resonance', color: '#ffcc00' } },
  { id: 'gate_dedup', type: 'minimal', position: { x: X_WRITE - 60, y: 800 }, data: { id: 'gate_dedup', label: '⑤ Deduplication', color: '#ffcc00' } },

  // Rejection branches off gates
  { id: 'rej_private', type: 'minimal', position: { x: X_BRANCH_R, y: 560 }, data: { id: 'rej_private', label: 'Blocked: Private', color: '#ff3333', borderColor: 'rgba(255,51,51,0.3)' } },
  { id: 'rej_no_resonance', type: 'minimal', position: { x: X_BRANCH_R, y: 740 }, data: { id: 'rej_no_resonance', label: 'No Resonance', color: '#ff3333', borderColor: 'rgba(255,51,51,0.3)' } },
  { id: 'rej_dedup', type: 'minimal', position: { x: X_BRANCH_R, y: 800 }, data: { id: 'rej_dedup', label: 'Already Known', color: '#ff3333', borderColor: 'rgba(255,51,51,0.3)' } },

  // Propagation result
  { id: 'clone_write', type: 'minimal', position: { x: X_WRITE, y: 880 }, data: { id: 'clone_write', label: 'Atomic Write', color: '#00cc66' } },
  { id: 'social_drift', type: 'minimal', position: { x: X_WRITE, y: 950 }, data: { id: 'social_drift', label: 'Social Drift', color: '#00cc66' } },

  // === READ PATH ===
  { id: 'approach', type: 'minimal', position: { x: X_READ, y: 0 }, data: { id: 'approach', label: 'Player Approaches', color: '#00aaff' } },
  { id: 'retrieval', type: 'minimal', position: { x: X_READ, y: 80 }, data: { id: 'retrieval', label: 'Bucket Retrieval', color: '#00aaff' } },

  // Retrieval buckets
  { id: 'bk_recent', type: 'minimal', position: { x: X_READ_R, y: 40 }, data: { id: 'retrieval', label: 'Recent', color: '#00aaff', borderColor: 'rgba(0,170,255,0.2)' } },
  { id: 'bk_stable', type: 'minimal', position: { x: X_READ_R, y: 80 }, data: { id: 'retrieval', label: 'Stable', color: '#00aaff', borderColor: 'rgba(0,170,255,0.2)' } },
  { id: 'bk_social', type: 'minimal', position: { x: X_READ_R, y: 120 }, data: { id: 'retrieval', label: 'Social', color: '#00aaff', borderColor: 'rgba(0,170,255,0.2)' } },
  { id: 'bk_emotional', type: 'minimal', position: { x: X_READ_R, y: 160 }, data: { id: 'retrieval', label: 'Emotional', color: '#00aaff', borderColor: 'rgba(0,170,255,0.2)' } },

  { id: 'recall_filter', type: 'minimal', position: { x: X_READ, y: 200 }, data: { id: 'recall_filter', label: 'Recall Filter', color: '#00aaff' } },
  { id: 'prompt_inject', type: 'minimal', position: { x: X_READ, y: 290 }, data: { id: 'prompt_inject', label: 'Prompt Assembly', color: '#00aaff' } },
  { id: 'npc_output', type: 'minimal', position: { x: X_READ, y: 375 }, data: { id: 'npc_output', label: 'NPC Dialogue', color: '#00aaff' } },
];

const initialEdges = [
  // Write main line
  { id: 'w1', source: 'player_talk', target: 'llm_gen' },
  { id: 'w2', source: 'llm_gen', target: 'sanitize' },
  { id: 'w3', source: 'sanitize', target: 'persist' },
  { id: 'w4', source: 'persist', target: 'maintenance' },
  { id: 'w5', source: 'maintenance', target: 'mem_record' },
  { id: 'w5b', source: 'maintenance', target: 'action_record' },
  { id: 'w6', source: 'mem_record', target: 'continuity' },
  { id: 'w_act', source: 'action_record', target: 'action_eval' },

  // Repair branch
  { id: 'r1', source: 'sanitize', target: 'repair', animated: true },
  { id: 'r2', source: 'repair', target: 'fallback', animated: true },

  // Continuity → Gates
  { id: 'g0', source: 'continuity', target: 'gate_eligible' },
  { id: 'g1', source: 'gate_eligible', target: 'gate_identity' },
  { id: 'g2', source: 'gate_identity', target: 'gate_relationship' },
  { id: 'g3', source: 'gate_relationship', target: 'gate_resonance' },
  { id: 'g4', source: 'gate_resonance', target: 'gate_dedup' },
  { id: 'g5', source: 'gate_dedup', target: 'clone_write' },
  { id: 'g6', source: 'clone_write', target: 'social_drift' },

  // Rejection edges
  { id: 'rej1', source: 'gate_eligible', target: 'rej_private', animated: true },
  { id: 'rej2', source: 'gate_resonance', target: 'rej_no_resonance', animated: true },
  { id: 'rej3', source: 'gate_dedup', target: 'rej_dedup', animated: true },

  // Read path
  { id: 'rd1', source: 'approach', target: 'retrieval' },
  { id: 'rd2', source: 'retrieval', target: 'recall_filter' },
  { id: 'rd3', source: 'recall_filter', target: 'prompt_inject' },
  { id: 'rd4', source: 'prompt_inject', target: 'npc_output' },

  // Buckets
  { id: 'bk1', source: 'retrieval', target: 'bk_recent' },
  { id: 'bk2', source: 'retrieval', target: 'bk_stable' },
  { id: 'bk3', source: 'retrieval', target: 'bk_social' },
  { id: 'bk4', source: 'retrieval', target: 'bk_emotional' },

  // Cross-link: propagated memories feed into READ path DB
  { id: 'cross1', source: 'social_drift', target: 'retrieval', style: { strokeDasharray: '6 3' } },
].map(e => ({
  ...e,
  type: 'smoothstep',
  style: { stroke: e.style?.strokeDasharray ? 'rgba(0,170,255,0.3)' : 'rgba(255,255,255,0.12)', strokeWidth: 1, ...(e.style || {}) }
}));

const SystemDiagram = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [active, setActive] = useState(nodeInfo['player_talk']);
  const [selectedId, setSelectedId] = useState('player_talk');

  const onNodeClick = useCallback((_, node) => {
    setSelectedId(node.id);
    if (nodeInfo[node.data.id]) setActive(nodeInfo[node.data.id]);
    setEdges(eds => eds.map(e => {
      const hit = e.source === node.id || e.target === node.id;
      return { ...e, style: { ...e.style, stroke: hit ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)', strokeWidth: hit ? 2 : 1, opacity: hit ? 1 : 0.25 } };
    }));
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', marginTop: '40px', height: '1050px' }}>
      <div style={{ height: '100%', border: '1px solid rgba(255,255,255,0.05)', background: '#080808' }}>
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodeClick={onNodeClick} fitView fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3} maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#111" gap={30} size={1} />
        </ReactFlow>
      </div>
      <div style={{ position: 'sticky', top: 100, alignSelf: 'start', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,10,10,0.95)', padding: '28px', minHeight: 300 }}>
        <span style={{ fontSize: 10, color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>// NODE_INSPECTOR</span>
        <h3 style={{ marginTop: 10, fontSize: '1.15rem', color: '#fff', letterSpacing: '0.02em' }}>{active?.title || 'Select Node'}</h3>
        <p style={{ marginTop: 16, lineHeight: 1.6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>{active?.body}</p>
        {active?.list && (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 14 }}>
            {active.list.map((item, i) => (
              <li key={i} style={{ marginBottom: 10, paddingLeft: 16, position: 'relative', fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent-color)', opacity: 0.5 }}>–</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Mount immediately instead of waiting for DOMContentLoaded
// since module scripts are already deferred
const el = document.getElementById('react-flow-root');
if (el) createRoot(el).render(<SystemDiagram />);

// Studio cards
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
