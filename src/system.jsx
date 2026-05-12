import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, Background, Handle, Position,
  MarkerType, useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider
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
    title: "Moirai Core (MOIRAI.CORE)", 
    body: "The central management hub. It coordinates the recursive flow of information, synthesizing Structured Narrative Reports (FACT/EXCHANGE) from active dialogue.", 
    list: ["Role: Central state authority", "Logic: Structured Data Synthesis (FACT/EXCHANGE)", "Cycle: Recursive Autonomous Loop"] 
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
    title: "Mutation & Depth Tracking", 
    body: "The measurement of information decay across narrative social chains. Propagated memories track MutationCount and increment PropagationDepth at each step, strictly enforced by a 10-hop limit.", 
    list: ["Data: MutationCount tracking", "Data: 10-Hop Social Limit (Depth Tracker)", "Effect: Long-range narrative evolution"] 
  },
  system_truth: {
    title: "System Truth (SQLite DB)",
    body: "The authoritative record of the simulation. Anchored by strict UTC synchronization across Unreal Engine, Python, and the WebUI to ensure perfect event ordering.",
    list: ["Authority: Global UTC Synchronization", "Storage: Canonical Record persistence", "Integrity: Global event sequencing"]
  },
  sanctum_dashboard: {
    title: "Sanctum Dashboard",
    body: "The centralized monitoring hub for system observability. It tracks real-time inference telemetry, token usage, and latency for every autonomous thought.",
    list: ["Telemetry: Multimodal Stream", "Observability: Token & Latency tracking", "Role: Real-time system vitals"]
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

const THEME = {
  teal: "#00e5ff",
  purple: "#a855f7",
  blue: "#3b82f6",
  danger: "#ff3333",
  bg: "#05070a"
};

const AreaNode = ({ data }) => (
  <div style={{
    width: '100%',
    height: '100%',
    border: `2px solid ${data.color || 'rgba(255,255,255,0.6)'}`,
    borderRadius: '12px',
    background: data.bgColor || 'rgba(255,255,255,0.08)',
    position: 'relative',
    boxSizing: 'border-box',
    boxShadow: `0 0 50px ${data.color}22`,
  }}>
    <div style={{ position: 'absolute', top: '-18px', left: '20px', fontSize: '18px', fontFamily: 'var(--font-mono)', color: data.color || '#fff', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '800', background: THEME.bg, padding: '5px 16px', border: `1px solid ${data.color || '#fff'}`, zIndex: 20 }}>{data.label}</div>
    {data.description && <div style={{ position: 'absolute', bottom: '18px', left: '20px', right: '20px', fontSize: '20px', fontFamily: 'var(--font-sans)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, borderTop: `1px solid ${data.color || 'rgba(255,255,255,0.2)'}44`, paddingTop: '12px' }}>{data.description}</div>}
  </div>
);

const ModernNode = ({ data, selected }) => {
  return (
    <div className={`custom-node-modern ${selected ? 'active' : ''}`} style={{ 
      width: '100%', 
      height: '100%', 
      background: selected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
      border: `2px solid ${selected ? (data.color || THEME.teal) : 'rgba(255,255,255,0.2)'}`,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: selected ? `0 0 40px ${(data.color || THEME.teal)}66` : 'none',
      transition: 'all 0.2s ease-in-out'
    }}>
      <div className="node-scanlines" style={{ opacity: 0.15 }}></div>
      <div className="node-header" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <span className="node-id-tag" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>{data.id?.toUpperCase()}</span>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: data.color || THEME.teal, boxShadow: `0 0 15px ${data.color || THEME.teal}` }}></div>
      </div>
      <div style={{ padding: '12px 16px', flex: 1, display: 'flex', alignItems: 'center' }}>
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '1.15rem', 
          fontWeight: '700',
          letterSpacing: '0.02em',
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          {data.label}
        </span>
      </div>
      
      <Handle id="t" type="target" position={Position.Top} style={{ background: '#fff', border: '1px solid #000', width: '8px', height: '8px' }} />
      <Handle id="b" type="source" position={Position.Bottom} style={{ background: '#fff', border: '1px solid #000', width: '8px', height: '8px' }} />
      <Handle id="l" type="target" position={Position.Left} style={{ background: '#fff', border: '1px solid #000', width: '8px', height: '8px' }} />
      <Handle id="r" type="source" position={Position.Right} style={{ background: '#fff', border: '1px solid #000', width: '8px', height: '8px' }} />
    </div>
  );
};

const SectionLabel = ({ data }) => (
  <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: data.color || 'rgba(255,255,255,0.9)', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 900, padding: '10px 0', borderBottom: `2px solid ${data.color || 'rgba(255,255,255,0.4)'}`, width: 'fit-content', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{data.label}</div>
);

const nodeTypes = { modern: ModernNode, label: SectionLabel, area: AreaNode };

const initialNodes = [
  {"id":"area_system","type":"area","position":{"x":70,"y":-600},"data":{"id":"layer_system","label":"Layer 1 — Canonical System Memory","color":THEME.teal,"bgColor":"rgba(0,229,255,0.05)","description":"The canonical SQLite database. Accurate, structured, append-only."},"width":930,"height":2000, "draggable": false, "selectable": false},
  {"id":"area_lifecycle","type":"area","position":{"x":1100,"y":-150},"data":{"label":"Action Lifecycle","color":THEME.purple,"bgColor":"rgba(168,85,247,0.05)"},"width":450,"height":900, "draggable": false, "selectable": false},
  {"id":"area_character","type":"area","position":{"x":1600,"y":500},"data":{"id":"layer_character","label":"Layer 2 — Volatile Character Recall","color":THEME.blue,"bgColor":"rgba(59,130,246,0.05)","description":"Generated at retrieval time. Imperfect, selective, and emotional."},"width":800,"height":900, "draggable": false, "selectable": false},
  {"id":"player_talk","type":"modern","position":{"x":600,"y":-550},"data":{"id":"player_talk","label":"Conversation","color":THEME.teal},"width":320,"height":110},
  {"id":"llm_gen","type":"modern","position":{"x":600,"y":-420},"data":{"id":"llm_gen","label":"LLM Generate","color":THEME.teal},"width":320,"height":110},
  {"id":"sanitize","type":"modern","position":{"x":600,"y":-290},"data":{"id":"sanitize","label":"Sanitize","color":THEME.teal},"width":320,"height":110},
  {"id":"persist","type":"modern","position":{"x":600,"y":-160},"data":{"id":"persist","label":"Persist Turn","color":THEME.teal},"width":320,"height":110},
  {"id":"maintenance","type":"modern","position":{"x":600,"y":-30},"data":{"id":"maintenance","label":"Maintenance","color":THEME.teal},"width":320,"height":110},
  {"id":"mem_record","type":"modern","position":{"x":600,"y":100},"data":{"id":"mem_record","label":"MemoryRecord","color":THEME.teal},"width":320,"height":110},
  {"id":"continuity","type":"modern","position":{"x":600,"y":230},"data":{"id":"continuity","label":"Moirai Core","color":THEME.teal},"width":320,"height":110},
  {"id":"gate_eligible","type":"modern","position":{"x":600,"y":360},"data":{"id":"gate_eligible","label":"① Eligibility","color":THEME.purple},"width":320,"height":110},
  {"id":"gate_identity","type":"modern","position":{"x":600,"y":490},"data":{"id":"gate_identity","label":"② Identity","color":THEME.purple},"width":320,"height":110},
  {"id":"gate_relationship","type":"modern","position":{"x":600,"y":620},"data":{"id":"gate_relationship","label":"③ Relationship","color":THEME.purple},"width":320,"height":110},
  {"id":"gate_resonance","type":"modern","position":{"x":600,"y":750},"data":{"id":"gate_resonance","label":"④ Resonance","color":THEME.purple},"width":320,"height":110},
  {"id":"gate_dedup","type":"modern","position":{"x":600,"y":880},"data":{"id":"gate_dedup","label":"⑤ Deduplication","color":THEME.purple},"width":320,"height":110},
  {"id":"clone_write","type":"modern","position":{"x":600,"y":1010},"data":{"id":"clone_write","label":"Atomic Write","color":THEME.blue},"width":320,"height":110},
  {"id":"social_drift","type":"modern","position":{"x":600,"y":1140},"data":{"id":"social_drift","label":"Social Drift","color":THEME.blue},"width":320,"height":110},
  {"id":"repair","type":"modern","position":{"x":120,"y":-290},"data":{"id":"repair","label":"Repair Pass","color":THEME.teal},"width":320,"height":110},
  {"id":"fallback","type":"modern","position":{"x":120,"y":-160},"data":{"id":"fallback","label":"Fallback","color":THEME.teal},"width":320,"height":110},
  {"id":"rej_private","type":"modern","position":{"x":120,"y":360},"data":{"id":"rej_private","label":"Blocked: Private","color":THEME.danger},"width":320,"height":110},
  {"id":"rej_no_resonance","type":"modern","position":{"x":120,"y":750},"data":{"id":"rej_no_resonance","label":"No Resonance","color":THEME.danger},"width":320,"height":110},
  {"id":"rej_dedup","type":"modern","position":{"x":120,"y":880},"data":{"id":"rej_dedup","label":"Already Known","color":THEME.danger},"width":320,"height":110},
  {"id":"action_record","type":"modern","position":{"x":1160,"y":-100},"data":{"id":"action_record","label":"ActionRecord","color":THEME.purple},"width":320,"height":110},
  {"id":"action_eval","type":"modern","position":{"x":1160,"y":30},"data":{"id":"action_eval","label":"Evaluate/Expire","color":THEME.purple},"width":320,"height":110},
  {"id":"act_pending","type":"modern","position":{"x":1160,"y":160},"data":{"id":"act_pending","label":"Pending","color":THEME.purple},"width":320,"height":110},
  {"id":"act_triggered","type":"modern","position":{"x":1160,"y":290},"data":{"id":"act_triggered","label":"Triggered","color":THEME.purple},"width":320,"height":110},
  {"id":"act_used","type":"modern","position":{"x":1160,"y":420},"data":{"id":"act_used","label":"Used","color":THEME.purple},"width":320,"height":110},
  {"id":"act_expired","type":"modern","position":{"x":1160,"y":550},"data":{"id":"act_expired","label":"Expired","color":THEME.purple},"width":320,"height":110},
  {"id":"approach","type":"modern","position":{"x":1650,"y":650},"data":{"id":"approach","label":"Player Approaches","color":THEME.blue},"width":320,"height":110},
  {"id":"retrieval","type":"modern","position":{"x":1650,"y":800},"data":{"id":"retrieval","label":"Bucket Retrieval","color":THEME.blue},"width":320,"height":110},
  {"id":"recall_filter","type":"modern","position":{"x":1650,"y":950},"data":{"id":"recall_filter","label":"Recall Filter","color":THEME.blue},"width":320,"height":110},
  {"id":"prompt_inject","type":"modern","position":{"x":1650,"y":1100},"data":{"id":"prompt_inject","label":"Prompt Assembly","color":THEME.blue},"width":320,"height":110},
  {"id":"npc_output","type":"modern","position":{"x":1650,"y":1250},"data":{"id":"npc_output","label":"Subject Dialogue","color":THEME.blue},"width":320,"height":110},
  {"id":"bk_recent","type":"modern","position":{"x":2050,"y":550},"data":{"id":"bk_recent","label":"Recent","color":THEME.blue},"width":320,"height":110},
  {"id":"bk_stable","type":"modern","position":{"x":2050,"y":700},"data":{"id":"bk_stable","label":"Stable Fact","color":THEME.blue},"width":320,"height":110},
  {"id":"bk_social","type":"modern","position":{"x":2050,"y":850},"data":{"id":"bk_social","label":"Social Hearsay","color":THEME.blue},"width":320,"height":110},
  {"id":"bk_emotional","type":"modern","position":{"x":2050,"y":1000},"data":{"id":"bk_emotional","label":"Emotional Bias","color":THEME.blue},"width":320,"height":110},
  {"id":"system_truth","type":"modern","position":{"x":120,"y":-550},"data":{"id":"system_truth","label":"System Truth (DB)","color":"#fff"},"width":320,"height":110},
  {"id":"sanctum_dashboard","type":"modern","position":{"x":1200,"y":-420},"data":{"id":"sanctum_dashboard","label":"Sanctum Dash","color":"#00ffcc"},"width":320,"height":110, "zIndex": 1000}
];

const initialEdges = [
  { id: 'w1', source: 'player_talk', target: 'llm_gen', sourceHandle: 'b', targetHandle: 't' },
  { id: 'w2', source: 'llm_gen', target: 'sanitize', sourceHandle: 'b', targetHandle: 't' },
  { id: 'w3', source: 'sanitize', target: 'persist', sourceHandle: 'b', targetHandle: 't' },
  { id: 'w4', source: 'persist', target: 'maintenance', sourceHandle: 'b', targetHandle: 't' },
  { id: 'w5', source: 'maintenance', target: 'mem_record', sourceHandle: 'b', targetHandle: 't' },
  { id: 'w5b', source: 'maintenance', target: 'action_record', sourceHandle: 'r', targetHandle: 'l' },
  { id: 'w6', source: 'mem_record', target: 'continuity', sourceHandle: 'b', targetHandle: 't' },
  { id: 'w_act', source: 'action_record', target: 'action_eval', sourceHandle: 'b', targetHandle: 't' },
  { id: 'act1', source: 'action_eval', target: 'act_pending', sourceHandle: 'b', targetHandle: 't' },
  { id: 'act2', source: 'act_pending', target: 'act_triggered', sourceHandle: 'b', targetHandle: 't' },
  { id: 'act3', source: 'act_triggered', target: 'act_used', sourceHandle: 'b', targetHandle: 't' },
  { id: 'act4', source: 'act_used', target: 'act_expired', sourceHandle: 'b', targetHandle: 't' },
  { id: 'r1', source: 'sanitize', target: 'repair', sourceHandle: 'l', targetHandle: 'r' },
  { id: 'r2', source: 'repair', target: 'fallback', sourceHandle: 'b', targetHandle: 't', animated: true },
  { id: 'g0', source: 'continuity', target: 'gate_eligible', sourceHandle: 'b', targetHandle: 't' },
  { id: 'g1', source: 'gate_eligible', target: 'gate_identity', sourceHandle: 'b', targetHandle: 't' },
  { id: 'g2', source: 'gate_identity', target: 'gate_relationship', sourceHandle: 'b', targetHandle: 't' },
  { id: 'g3', source: 'gate_relationship', target: 'gate_resonance', sourceHandle: 'b', targetHandle: 't' },
  { id: 'g4', source: 'gate_resonance', target: 'gate_dedup', sourceHandle: 'b', targetHandle: 't' },
  { id: 'g5', source: 'gate_dedup', target: 'clone_write', sourceHandle: 'b', targetHandle: 't' },
  { id: 'g6', source: 'clone_write', target: 'social_drift', sourceHandle: 'b', targetHandle: 't' },
  { id: 'rej1', source: 'gate_eligible', target: 'rej_private', sourceHandle: 'l', targetHandle: 'r', animated: true },
  { id: 'rej2', source: 'gate_resonance', target: 'rej_no_resonance', sourceHandle: 'l', targetHandle: 'r', animated: true },
  { id: 'rej3', source: 'gate_dedup', target: 'rej_dedup', sourceHandle: 'l', targetHandle: 'r', animated: true },
  { id: 'rd1', source: 'approach', target: 'retrieval', sourceHandle: 'b', targetHandle: 't' },
  { id: 'rd2', source: 'retrieval', target: 'recall_filter', sourceHandle: 'b', targetHandle: 't' },
  { id: 'rd3', source: 'recall_filter', target: 'prompt_inject', sourceHandle: 'b', targetHandle: 't' },
  { id: 'rd4', source: 'prompt_inject', target: 'npc_output', sourceHandle: 'b', targetHandle: 't' },
  { id: 'bk1', source: 'retrieval', target: 'bk_recent', sourceHandle: 'r', targetHandle: 'l' },
  { id: 'bk2', source: 'retrieval', target: 'bk_stable', sourceHandle: 'r', targetHandle: 'l' },
  { id: 'bk3', source: 'retrieval', target: 'bk_social', sourceHandle: 'r', targetHandle: 'l' },
  { id: 'bk4', source: 'retrieval', target: 'bk_emotional', sourceHandle: 'r', targetHandle: 'l' },
  { id: 'cross1', source: 'social_drift', target: 'retrieval', sourceHandle: 'r', targetHandle: 'l', style: { strokeDasharray: '10 5', stroke: THEME.teal, opacity: 0.9, strokeWidth: 4 } },
  { 
    id: 'loop1', 
    source: 'continuity', 
    target: 'llm_gen', 
    type: 'smoothstep', 
    label: 'AUTONOMOUS CYCLE', 
    animated: true, 
    style: { stroke: THEME.teal, strokeWidth: 4, strokeDasharray: '8 4' }, 
    sourceHandle: 'r', 
    targetHandle: 'r', 
    labelStyle: { fill: '#fff', fontWeight: 900, fontSize: '14px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' },
    labelBgStyle: { fill: THEME.bg, stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 },
    labelBgPadding: [8, 12],
    labelBgBorderRadius: 4
  },
  { 
    id: 'tel1', 
    source: 'llm_gen', 
    target: 'sanctum_dashboard', 
    sourceHandle: 'r', 
    targetHandle: 'l', 
    label: 'TELEMETRY STREAM', 
    type: 'straight', 
    style: { stroke: '#00ffcc', opacity: 0.9, strokeWidth: 4 }, 
    labelStyle: { fill: '#fff', fontWeight: 900, fontSize: '14px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' },
    labelBgStyle: { fill: THEME.bg, stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 },
    labelBgPadding: [8, 12],
    labelBgBorderRadius: 4
  },
  { 
    id: 'sync1', 
    source: 'system_truth', 
    target: 'llm_gen', 
    sourceHandle: 'r', 
    targetHandle: 'l', 
    label: 'UTC SYNC', 
    style: { stroke: '#fff', opacity: 0.8, strokeDasharray: '6 6', strokeWidth: 4 }, 
    labelStyle: { fill: '#fff', fontWeight: 900, fontSize: '14px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' },
    labelBgStyle: { fill: THEME.bg, stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 },
    labelBgPadding: [8, 12],
    labelBgBorderRadius: 4
  },
  { id: 'sync2', source: 'system_truth', target: 'continuity', sourceHandle: 'r', targetHandle: 'l', style: { stroke: '#fff', opacity: 0.8, strokeDasharray: '6 6', strokeWidth: 4 } },
].map(e => ({
  ...e,
  type: e.type || 'step',
  markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.8)', width: 12, height: 12 },
  style: { stroke: 'rgba(255,255,255,0.6)', strokeWidth: 3, ...(e.style || {}) }
}));

const CustomZoomControls = ({ onZoomIn, onZoomOut, onFitView }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: 'rgba(5,7,10,0.85)',
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  }}>
    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '4px', fontWeight: 800 }}>ZOOM</div>
    <button onClick={onZoomIn} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    <button onClick={onZoomOut} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
    <button onClick={onFitView} style={{ width: '44px', height: '44px', background: THEME.teal, border: 'none', color: '#000', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FIT</button>
  </div>
);

const SystemDiagram = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hudPos, setHudPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onNodeClick = useCallback((e, node) => {
    const infoId = node.data.id || node.id;
    const info = nodeInfo[infoId];
    if (info) {
      const x = e.clientX - 225;
      const y = e.clientY - 150;
      setHudPos({ x, y });
      setSelectedNode({ ...info, id: infoId, color: node.data.color || THEME.teal });
    }
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onMouseDown = (e) => {
    if (e.target.closest('.hud-header')) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - hudPos.x, y: e.clientY - hudPos.y };
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) {
        setHudPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
      }
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  return (
    <div style={{
      position: 'relative',
      marginTop: '10px',
      marginLeft: '-40px',
      marginRight: '-40px',
      height: '1200px', 
      width: 'calc(100% + 80px)',
      border: '1px solid rgba(255,255,255,0.2)',
      background: THEME.bg
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2.5}
        panOnScroll={false}
        panOnDrag={true}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.03)" gap={30} size={1} />
        
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
          <CustomZoomControls onZoomIn={() => zoomIn()} onZoomOut={() => zoomOut()} onFitView={() => fitView()} />
        </div>
      </ReactFlow>

      {selectedNode && (
        <div 
          className="inspector-hud" 
          onMouseDown={onMouseDown}
          style={{
            position: 'fixed',
            top: `${hudPos.y}px`,
            left: `${hudPos.x}px`,
            width: '450px',
            background: 'rgba(5, 7, 10, 0.98)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRight: `8px solid ${selectedNode.color}`,
            padding: '0',
            zIndex: 10000,
            boxShadow: '0 60px 100px rgba(0,0,0,0.9)',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <div className="hud-header" style={{ 
            padding: '16px 24px', 
            background: 'rgba(255,255,255,0.05)', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'grab'
          }}>
            <div className="mono text-accent" style={{ fontSize: '0.75rem', fontWeight: 900, color: selectedNode.color }}>
              METADATA_INSPECTOR // {selectedNode.id.toUpperCase()}
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '22px', fontWeight: 300 }}
            >✕</button>
          </div>

          <div style={{ padding: '36px' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '20px', color: '#fff', letterSpacing: '-0.02em', fontWeight: 900 }}>{selectedNode.title || selectedNode.label}</h2>
            <p className="muted" style={{ lineHeight: '1.6', fontSize: '1.1rem', marginBottom: '30px', color: 'rgba(255,255,255,0.85)' }}>
              {selectedNode.body}
            </p>
            
            {selectedNode.list && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', fontWeight: 800 }}>PROPERTIES_VAL</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {selectedNode.list.map((item, i) => (
                    <li key={i} style={{ 
                      fontSize: '0.95rem', 
                      color: 'rgba(255,255,255,0.95)', 
                      marginBottom: '12px', 
                      paddingLeft: '20px',
                      position: 'relative',
                      lineHeight: 1.5
                    }}>
                      <span style={{ position: 'absolute', left: 0, color: selectedNode.color, fontWeight: 900 }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Main = () => (
  <ReactFlowProvider>
    <SystemDiagram />
  </ReactFlowProvider>
);

const el = document.getElementById('react-flow-root');
if (el) createRoot(el).render(<Main />);
