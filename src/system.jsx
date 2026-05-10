import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, Background, Handle, Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import './system.css';

const nodeInfo = {
  layer_system: { 
    title: "Layer 1: Canonical System Memory", 
    body: "The authoritative SQLite 3 persistence layer. This shared database is the immutable record of all simulation history, ensuring narrative integrity across both the Unreal runtime and Moirai Studio.", 
    list: ["Storage: SQLite 3 Canonical DB", "Integrity: Append-only transaction log", "Role: Source of truth for all Subject history"] 
  },
  layer_character: { 
    title: "Layer 2: Volatile Character Recall", 
    body: "The human-centric retrieval layer. Instead of direct database access, Subjects reconstruct their past through the Recall Filter, which applies emotional weight and personality-driven bias to historical facts.", 
    list: ["Logic: Emotional & selective retrieval", "Rule: Authoritative Transcript Rule enforcement", "Effect: Natural memory drift and fading"] 
  },
  player_talk: { 
    title: "Conversation Input", 
    body: "The entry point for live interaction. Managed by the UPlayerConversationComponent, this node captures raw user input and initiates the cognitive processing pipeline.", 
    list: ["Source: UPlayerConversationComponent", "Trigger: Live player interaction"] 
  },
  llm_gen: { 
    title: "Primary Generation", 
    body: "The primary inference request. Raw dialogue is generated via local Ollama-compatible chat based on the Subject’s current context, personality, and historical memory buckets.", 
    list: ["Model: Local LLM Inference", "Context: Full narrative prompt assembly"] 
  },
  sanitize: { 
    title: "Output Sanitization", 
    body: "The dialogue extraction phase. This node filters assistant-output to remove technical artifacts, meta-reasoning, and reasoning leakage before it is displayed or persisted.", 
    list: ["Action: Meta-channel filtering", "Goal: Pure character dialogue extraction"] 
  },
  repair: { 
    title: "Dialogue Repair Pass", 
    body: "A secondary, low-temperature inference pass triggered if the primary output fails quality checks. It attempts to recover a clean spoken response to maintain simulation immersion.", 
    list: ["Trigger: Low-quality or empty primary output", "Logic: Temperature-locked repair request"] 
  },
  fallback: { 
    title: "Stability Fallback", 
    body: "The final safety protocol. If generation and repair both fail, a generic character-safe response is emitted and tagged as non-authoritative to prevent context poisoning.", 
    list: ["Status: Non-authoritative row", "Role: Narrative failsafe"] 
  },
  persist: { 
    title: "Turn Persistence", 
    body: "The authoritative write operation. Only sanitized and validated dialogue is committed to the ConversationTurns table, forming the basis for future recall.", 
    list: ["Target: ConversationTurns Table", "Rule: Sanitized-only write"] 
  },
  maintenance: { 
    title: "Memory Maintenance", 
    body: "The post-conversation synthesis pass. This node reviews authoritative transcripts to extract durable facts, relationship shifts, and social action candidates.", 
    list: ["Trigger: Session boundary or turn threshold", "Focus: Fact extraction and commitment tracking"] 
  },
  mem_record: { 
    title: "MemoryRecord Unit", 
    body: "An atomic unit of persistent knowledge. These records are chronologically linked using PreviousMemoryId to create a traceable continuity trail for every Subject.", 
    list: ["Structure: Linked-list temporal chaining", "Metadata: Fact durability & confidence scores"] 
  },
  action_record: { 
    title: "Social Action Candidate", 
    body: "A structured intention or commitment formed during a conversation. These candidates are evaluated for future execution within the simulation world.", 
    list: ["Type: Commitment / Goal / Interaction", "Link: Tied to original synthesis context"] 
  },
  action_eval: { 
    title: "Action Lifecycle Manager", 
    body: "Governs the execution window of social actions. It monitors simulation time and proximity to decide when a Subject should act on their stored intentions.", 
    list: ["State: Pending / Triggered / Used / Expired", "Role: Temporal intent scheduling"] 
  },
  continuity: { 
    title: "Moirai Core Synchronizer", 
    body: "The central management hub. It coordinates the flow of information between the persistence layer and the active simulation, ensuring world-state consistency.", 
    list: ["Role: Central state authority", "Function: Multi-system record synchronization"] 
  },
  gate_eligible: { 
    title: "Privacy & Eligibility Gate", 
    body: "The first filter of Associative Routing. It performs a privacy audit on synthesis records, stripping private clauses to prevent secret information from propagating.", 
    list: ["Action: Private-clause sanitization", "Result: Eligible social-transfer records"] 
  },
  gate_identity: { 
    title: "Identity Attribution", 
    body: "Standardizes source tracking. It ensures every piece of information is correctly linked to its original owner via SourceMemoryId before social transfer.", 
    list: ["Action: Source-memory linking", "Validation: Subject standard ID mapping"] 
  },
  gate_relationship: { 
    title: "Relationship Routing", 
    body: "The core of Associative Routing. Information is preferred for propagation between Subjects sharing a ShareGroupName or a strong relationship bond.", 
    list: ["Mechanism: ShareGroupName mapping", "Logic: Social network propagation"] 
  },
  gate_resonance: { 
    title: "Semantic Resonance", 
    body: "The relevance filter. Information only propagates if its tags and narrative weight match the interests or current goals of the potential recipient.", 
    list: ["Mechanism: Tag-based weight evaluation", "Logic: Interest-driven propagation"] 
  },
  gate_dedup: { 
    title: "Awareness Deduplication", 
    body: "Prevents 'old news' from spreading. This node checks if the recipient already possesses the information to maintain a natural social equilibrium.", 
    list: ["Action: Awareness check", "Goal: Social interaction efficiency"] 
  },
  clone_write: { 
    title: "Atomic Social Write", 
    body: "The creation of hearsay. A new recipient-owned MemoryRecord is written to the database, linked to the original source while becoming part of the new Subject's knowledge.", 
    list: ["Result: New recipient-owned record", "Audit: PropagationEvent logged"] 
  },
  social_drift: { 
    title: "Mutation & Drift Tracking", 
    body: "The measurement of information decay. Propagated memories track MutationCount and preserve the original summary text to monitor how stories change as they spread.", 
    list: ["Data: MutationCount tracking", "Data: Original fact preservation"] 
  },
  rej_private: { 
    title: "Halt: Privacy Violation", 
    body: "Information propagation terminated. The record contained private clauses that were not eligible for social transfer under current privacy protocols.", 
    list: ["Status: Propagation Halted"] 
  },
  rej_no_resonance: { 
    title: "Halt: Low Resonance", 
    body: "Information propagation terminated. The narrative weight of the information did not meet the relevance threshold for the targeted social circle.", 
    list: ["Status: Dropped by interest filter"] 
  },
  rej_dedup: { 
    title: "Halt: Existing Awareness", 
    body: "Information propagation terminated. The recipient was already aware of this fact, triggering the deduplication protocol to prevent redundant social turns.", 
    list: ["Status: Redundant information suppressed"] 
  },
  approach: { 
    title: "Context Initialization", 
    body: "Triggered when a player approaches a Subject. This initiates the deep-context retrieval process to prepare the Subject for a character-driven interaction.", 
    list: ["Source: Simulation proximity trigger", "Action: Context assembly start"] 
  },
  retrieval: { 
    title: "Bucket-Based Retrieval", 
    body: "The memory gathering phase. The system pulls from four distinct buckets—Recent, Stable, Social (Hearsay), and Emotional—to build a multi-dimensional persona prompt.", 
    list: ["Strategy: Multi-bucket retrieval", "Optimization: Prompt token budgeting"] 
  },
  recall_filter: { 
    title: "Recall Sanitization", 
    body: "Applying the human lens. This node filters retrieved memories through the Subject's current relationship status and emotional state, choosing what they 'choose' to remember.", 
    list: ["Logic: Contextual memory prioritization", "Goal: Authenticity over accuracy"] 
  },
  prompt_inject: { 
    title: "Narrative Prompt Injection", 
    body: "The final assembly. Retrieved and filtered memories are injected into the character persona template, creating a character-grounded prompt for the LLM.", 
    list: ["Format: Persona + Tiers + Current context", "Action: Live prompt injection"] 
  },
  npc_output: { 
    title: "Final Subject Output", 
    body: "The realization of character persistence. The Subject speaks with full awareness of their past, their social circle, and their evolving relationship with the player.", 
    list: ["Result: Persisted character continuity", "Status: Ready for UI display"] 
  },
  bk_recent: { 
    title: "Bucket: Recent Context", 
    body: "The short-term memory buffer. This bucket maintains the last 5-10 turns of active conversation to provide immediate continuity and context for the Subject’s next response.", 
    list: ["Short-term dialogue window", "Provides immediate continuity", "High priority for prompt assembly"] 
  },
  bk_stable: { 
    title: "Bucket: Stable Facts", 
    body: "Durable, high-confidence knowledge. These are synthesized facts and preferences that have been validated across multiple interactions, forming the Subject’s core baseline of truth.", 
    list: ["Durable fact extraction", "Verified character knowledge", "Resistant to short-term drift"] 
  },
  bk_social: { 
    title: "Bucket: Social Hearsay", 
    body: "Information acquired through propagation. This bucket contains knowledge shared by other Subjects in the Distrikt, often subject to mutation and varying confidence levels.", 
    list: ["Hearsay and gossip tracking", "Mutation and drift awareness", "Social network grounded"] 
  },
  bk_emotional: { 
    title: "Bucket: Emotional Bias", 
    body: "The relationship-weighted filter. This bucket tracks the Subject’s feelings towards the player and other actors, significantly influencing their tone and willingness to share information.", 
    list: ["Dynamic relationship metadata", "Emotional tone mapping", "Influences cooperative behavior"] 
  },
  act_pending: { title: "Status: Pending", body: "The social action has been synthesized but the environmental or temporal triggers have not yet been met." },
  act_triggered: { title: "Status: Triggered", body: "The conditions for action have been met. The Subject is now actively executing the intent within the world simulation." },
  act_used: { title: "Status: Used", body: "The action lifecycle is complete. The intent has been fulfilled and successfully transitioned into a historical memory record." },
  act_expired: { title: "Status: Expired", body: "The window for action has closed without execution. The intent is archived as an unfulfilled commitment." }
};

// --- Custom Node Components (Clean/Static) ---

const AreaNode = ({ data }) => (
  <div style={{
    width: '100%',
    height: '100%',
    border: `2px solid ${data.color || 'rgba(255,255,255,0.4)'}`,
    borderRadius: '8px',
    background: data.bgColor || 'rgba(255,255,255,0.04)',
    position: 'relative',
    boxSizing: 'border-box',
    boxShadow: `0 0 40px ${data.color}11`,
  }}>
    <div style={{ position: 'absolute', top: '-18px', left: '20px', fontSize: '18px', fontFamily: 'var(--font-mono)', color: data.color || '#fff', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '800', background: '#010810', padding: '5px 16px', border: `1px solid ${data.color || '#fff'}`, zIndex: 20 }}>{data.label}</div>
    {data.description && <div style={{ position: 'absolute', bottom: '18px', left: '20px', right: '20px', fontSize: '20px', fontFamily: 'var(--font-sans)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, borderTop: `1px solid ${data.color || 'rgba(255,255,255,0.1)'}22`, paddingTop: '12px' }}>{data.description}</div>}
    {/* Invisible handles for edge rendering */}
    <Handle id="t1" type="source" position={Position.Top} style={{ opacity: 0 }} />
    <Handle id="s1" type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle id="t2" type="source" position={Position.Left} style={{ opacity: 0 }} />
    <Handle id="s2" type="source" position={Position.Right} style={{ opacity: 0 }} />
  </div>
);

const ModernNode = ({ data }) => (
  <div style={{
    width: '100%',
    height: '100%',
    background: '#050505',
    border: `1px solid ${data.borderColor || 'rgba(255,255,255,0.6)'}`,
    borderRadius: '2px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <div style={{ height: '4px', background: data.color || '#fff', width: '100%' }} />
    <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', flexGrow: 1 }}>
      <div style={{ fontSize: '24px', color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{data.label}</div>
    </div>
    <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)' }} />
    <div style={{ padding: '12px 16px', fontSize: '15px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{data.id ? `ID: ${data.id.toUpperCase()}` : ''}</div>
    {/* Invisible handles for edge rendering */}
    <Handle id="t1" type="source" position={Position.Top} style={{ opacity: 0 }} />
    <Handle id="s1" type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle id="t2" type="source" position={Position.Left} style={{ opacity: 0 }} />
    <Handle id="s2" type="source" position={Position.Right} style={{ opacity: 0 }} />
  </div>
);

const SectionLabel = ({ data }) => (
  <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', color: data.color || 'rgba(255,255,255,0.6)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 800, padding: '8px 0', borderBottom: `1px solid ${data.color || 'rgba(255,255,255,0.2)'}`, width: 'fit-content' }}>{data.label}</div>
);

const nodeTypes = { modern: ModernNode, label: SectionLabel, area: AreaNode };

// --- LOCKED DATA FROM USER EXPORT ---

const initialNodes = [{"id":"area_system","type":"area","position":{"x":72,"y":-740},"data":{"id":"layer_system","label":"Layer 1 — Canonical System Memory","color":"#ff4d00","bgColor":"rgba(255,77,0,0.03)","description":"The canonical SQLite database. Accurate, structured, append-only."},"width":924,"height":2332},{"id":"area_lifecycle","type":"area","position":{"x":1091,"y":-297},"data":{"label":"Action Lifecycle","color":"#8a2be2","bgColor":"rgba(138,43,226,0.03)"},"width":466,"height":1056},{"id":"area_character","type":"area","position":{"x":1600,"y":370},"data":{"id":"layer_character","label":"Layer 2 — Volatile Character Recall","color":"#00aaff","bgColor":"rgba(0,170,255,0.03)","description":"Generated at retrieval time. Imperfect, selective, and emotional."},"width":798,"height":1218},{"id":"player_talk","type":"modern","position":{"x":600,"y":-700},"data":{"id":"player_talk","label":"Conversation","color":"#ff4d00"},"width":350,"height":130},{"id":"llm_gen","type":"modern","position":{"x":600,"y":-540},"data":{"id":"llm_gen","label":"LLM Generate","color":"#ff4d00"},"width":350,"height":130},{"id":"sanitize","type":"modern","position":{"x":600,"y":-380},"data":{"id":"sanitize","label":"Sanitize","color":"#ff4d00"},"width":350,"height":130},{"id":"persist","type":"modern","position":{"x":600,"y":-220},"data":{"id":"persist","label":"Persist Turn","color":"#ff4d00"},"width":350,"height":130},{"id":"maintenance","type":"modern","position":{"x":600,"y":-60},"data":{"id":"maintenance","label":"Maintenance","color":"#ff4d00"},"width":350,"height":130},{"id":"mem_record","type":"modern","position":{"x":600,"y":100},"data":{"id":"mem_record","label":"MemoryRecord","color":"#ff4d00"},"width":350,"height":130},{"id":"continuity","type":"modern","position":{"x":600,"y":260},"data":{"id":"continuity","label":"Moirai Engine","color":"#ff4d00"},"width":350,"height":130},{"id":"gate_eligible","type":"modern","position":{"x":600,"y":420},"data":{"id":"gate_eligible","label":"① Eligibility","color":"#ffcc00"},"width":350,"height":130},{"id":"gate_identity","type":"modern","position":{"x":600,"y":580},"data":{"id":"gate_identity","label":"② Identity","color":"#ffcc00"},"width":350,"height":130},{"id":"gate_relationship","type":"modern","position":{"x":600,"y":740},"data":{"id":"gate_relationship","label":"③ Relationship","color":"#ffcc00"},"width":350,"height":130},{"id":"gate_resonance","type":"modern","position":{"x":600,"y":900},"data":{"id":"gate_resonance","label":"④ Resonance","color":"#ffcc00"},"width":350,"height":130},{"id":"gate_dedup","type":"modern","position":{"x":600,"y":1060},"data":{"id":"gate_dedup","label":"⑤ Deduplication","color":"#ffcc00"},"width":350,"height":130},{"id":"clone_write","type":"modern","position":{"x":600,"y":1220},"data":{"id":"clone_write","label":"Atomic Write","color":"#00cc66"},"width":350,"height":130},{"id":"social_drift","type":"modern","position":{"x":600,"y":1380},"data":{"id":"social_drift","label":"Social Drift","color":"#00cc66"},"width":350,"height":130},{"id":"repair","type":"modern","position":{"x":100,"y":-380},"data":{"id":"repair","label":"Repair Pass","color":"#ff8800"},"width":350,"height":130},{"id":"fallback","type":"modern","position":{"x":100,"y":-220},"data":{"id":"fallback","label":"Fallback","color":"#ff8800"},"width":350,"height":130},{"id":"rej_private","type":"modern","position":{"x":111,"y":418},"data":{"id":"rej_private","label":"Blocked: Private","color":"#ff3333"},"width":350,"height":130},{"id":"rej_no_resonance","type":"modern","position":{"x":120,"y":900},"data":{"id":"rej_no_resonance","label":"No Resonance","color":"#ff3333"},"width":350,"height":130},{"id":"rej_dedup","type":"modern","position":{"x":118,"y":1060},"data":{"id":"rej_dedup","label":"Already Known","color":"#ff3333"},"width":350,"height":130},{"id":"action_record","type":"modern","position":{"x":1150,"y":-220},"data":{"id":"action_record","label":"ActionRecord","color":"#8a2be2"},"width":350,"height":130},{"id":"action_eval","type":"modern","position":{"x":1150,"y":-60},"data":{"id":"action_eval","label":"Evaluate/Expire","color":"#8a2be2"},"width":350,"height":130},{"id":"act_pending","type":"modern","position":{"x":1150,"y":100},"data":{"id":"act_pending","label":"Pending","color":"#ffaa00"},"width":350,"height":130},{"id":"act_triggered","type":"modern","position":{"x":1150,"y":260},"data":{"id":"act_triggered","label":"Triggered","color":"#00cc66"},"width":350,"height":130},{"id":"act_used","type":"modern","position":{"x":1150,"y":420},"data":{"id":"act_used","label":"Used","color":"#4488ff"},"width":350,"height":130},{"id":"act_expired","type":"modern","position":{"x":1150,"y":580},"data":{"id":"act_expired","label":"Expired","color":"#666"},"width":350,"height":130},{"id":"approach","type":"modern","position":{"x":1660,"y":574},"data":{"id":"approach","label":"Player Approaches","color":"#00aaff"},"width":350,"height":130},{"id":"retrieval","type":"modern","position":{"x":1660,"y":780},"data":{"id":"retrieval","label":"Bucket Retrieval","color":"#00aaff"},"width":350,"height":130},{"id":"recall_filter","type":"modern","position":{"x":1662,"y":970},"data":{"id":"recall_filter","label":"Recall Filter","color":"#00aaff"},"width":350,"height":130},{"id":"prompt_inject","type":"modern","position":{"x":1666,"y":1162},"data":{"id":"prompt_inject","label":"Prompt Assembly","color":"#00aaff"},"width":350,"height":130},{"id":"npc_output","type":"modern","position":{"x":1664,"y":1362},"data":{"id":"npc_output","label":"Subject Dialogue","color":"#00aaff"},"width":350,"height":130},{"id":"bk_recent","type":"modern","position":{"x":2100,"y":452},"data":{"id":"bk_recent","label":"Recent","color":"#00aaff"},"width":350,"height":130},{"id":"bk_stable","type":"modern","position":{"x":2100,"y":662},"data":{"id":"bk_stable","label":"Stable","color":"#00aaff"},"width":350,"height":130},{"id":"bk_social","type":"modern","position":{"x":2100,"y":869},"data":{"id":"bk_social","label":"Social","color":"#00aaff"},"width":350,"height":130},{"id":"bk_emotional","type":"modern","position":{"x":2100,"y":1041},"data":{"id":"bk_emotional","label":"Emotional","color":"#00aaff"},"width":350,"height":130}];

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
  { id: 'rej1', source: 'gate_eligible', target: 'rej_private', sourceHandle: 't2', targetHandle: 's2', type: 'straight', animated: true },
  { id: 'rej2', source: 'gate_resonance', target: 'rej_no_resonance', sourceHandle: 't2', targetHandle: 's2', type: 'straight', animated: true },
  { id: 'rej3', source: 'gate_dedup', target: 'rej_dedup', sourceHandle: 't2', targetHandle: 's2', type: 'straight', animated: true },
  { id: 'rd1', source: 'approach', target: 'retrieval', type: 'straight' },
  { id: 'rd2', source: 'retrieval', target: 'recall_filter', type: 'straight' },
  { id: 'rd3', source: 'recall_filter', target: 'prompt_inject', type: 'straight' },
  { id: 'rd4', source: 'prompt_inject', target: 'npc_output', type: 'straight' },
  { id: 'bk1', source: 'retrieval', target: 'bk_recent', sourceHandle: 's2', targetHandle: 't2', type: 'straight' },
  { id: 'bk2', source: 'retrieval', target: 'bk_stable', sourceHandle: 's2', targetHandle: 't2' },
  { id: 'bk3', source: 'retrieval', target: 'bk_social', sourceHandle: 's2', targetHandle: 't2' },
  { id: 'bk4', source: 'retrieval', target: 'bk_emotional', sourceHandle: 's2', targetHandle: 't2' },
  { id: 'cross1', source: 'social_drift', target: 'retrieval', sourceHandle: 's2', targetHandle: 't2', style: { strokeDasharray: '8 4' } },
].map(e => ({
  ...e,
  type: e.type || 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.4)', width: 16, height: 16 },
  style: { stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2, ...(e.style || {}) }
}));

const SystemDiagram = () => {
  // DISABLING LOCALSTORAGE TO FORCE SOURCE-OF-TRUTH UPDATE
  const [nodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [active, setActive] = useState(nodeInfo['player_talk']);

  const onNodeClick = useCallback((_, node) => {
    const infoId = node.data.id || node.id;
    if (nodeInfo[infoId]) setActive(nodeInfo[infoId]);
    
    // Highlight logic
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
      height: '2100px', 
      width: 'calc(100% + 80px)',
      border: '1px solid rgba(255,255,255,0.1)',
      background: '#010810'
    }}>
      
      {/* AI Responsibility Protocol Header */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        padding: '40px',
        background: 'linear-gradient(180deg, rgba(1, 8, 16, 0.9) 0%, transparent 100%)',
        zIndex: 10,
        pointerEvents: 'none'
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
            <div>
              <p style={{ 
                fontSize: '12px', 
                color: 'rgba(255,255,255,0.6)', 
                lineHeight: 1.6, 
                maxWidth: '800px', 
                marginTop: '10px' 
              }}>
                The Moirai Continuity Engine functions as a sophisticated cognitive architecture structured across three core domains. The <strong style={{ color: 'var(--accent-color)' }}>Write Path</strong> captures and distills conversations into persistent memory, facilitating social propagation through specialized logic gates. Complementing this, the <strong style={{ color: '#a855f7' }}>Action Lifecycle</strong> manages the flow of structured intents from initial extraction through to completion. Finally, the <strong style={{ color: '#3b82f6' }}>Read Path</strong> governs how these records are retrieved and translated into natural interactions.
              </p>
              <p style={{ 
                fontSize: '12px', 
                color: 'rgba(255,255,255,0.6)', 
                lineHeight: 1.6, 
                maxWidth: '800px', 
                marginTop: '12px' 
              }}>
                The entire network is anchored by a <strong style={{ color: '#fff' }}>Dual-Layer</strong> model: Layer 1 maintains the canonical truth within secure storage, while Layer 2 applies dynamic filters. This ensures Subjects recall information with human-like nuance, rather than simply reciting database entries.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: '100%', width: '100%', pointerEvents: 'auto' }}>
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodeClick={onNodeClick} 
          connectionMode="loose"
          fitView 
          fitViewOptions={{ padding: 0.01, minZoom: 0.1, maxZoom: 2.0 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
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
