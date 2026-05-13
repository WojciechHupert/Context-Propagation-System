import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  MarkerType,
  NodeResizer,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  reconnectEdge,
  applyEdgeChanges,
  applyNodeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import './system.css';

const STORAGE_KEY = 'moirai-system-diagram-v2';

const nodeInfo = {
  node_01: {
    title: 'Node 01: Interaction Surface',
    body: 'This is where the engine starts listening. Dialogue and interaction signals arrive here before they are shaped into something the system can reason about.',
    list: ['Captures live interactions', 'Prepares raw dialogue for processing', 'Separates direct talk from social context']
  },
  node_02: {
    title: 'Node 02: Neural Engine',
    body: 'The reasoning core of the diagram. It turns conversation into structured meaning: what happened, what matters, and what should happen next.',
    list: ['Extracts facts and exchanges', 'Synthesizes likely intent', 'Supports fallback inference paths']
  },
  logic_gates: {
    title: 'The Logic Gates',
    body: 'This is the judgment layer. Before information becomes durable or social, it is checked for safety, relevance, and whether it deserves to travel further.',
    list: ['Checks privacy and eligibility', 'Tests relevance and emotional weight', 'Avoids redundant awareness']
  },
  persist_turn: {
    title: 'Commitment & Serialization',
    body: "Once the system is confident, it commits the moment. This is where selected meaning becomes durable memory inside the district's long-term continuity.",
    list: ['Cleans the final record', 'Writes memory atomically', 'Links social propagation history']
  },
  node_04: {
    title: 'Node 04: System Truth',
    body: "This is the engine's trusted memory anchor. It keeps the district coherent by holding onto the durable truth every other path can rely on.",
    list: ['Maintains one reliable timeline', 'Stores durable memory safely', 'Feeds both simulation logic and live recall']
  },
  node_03: {
    title: 'Node 03: Continuity Core',
    body: "This is the district's heartbeat. It decides when the world should think again, continue a thread, or trigger autonomous social behavior.",
    list: ['Runs on a steady simulation pulse', 'Triggers autonomous follow-up safely', 'Keeps recursion governed and bounded']
  },
  action_lifecycle: {
    title: 'Action Lifecycle State Machine',
    body: 'This track turns intention into behavior. It holds candidate actions, evaluates when they should happen, and resolves whether they are used, delayed, or lost.',
    list: ['Instantiates actionable intent', 'Evaluates timing and depth rules', 'Tracks pending, triggered, used, and expired states']
  },
  recall_buckets: {
    title: 'Recall Buckets',
    body: 'The engine does not recall everything equally. It gathers from distinct memory buckets so a character response feels selective, grounded, and alive.',
    list: ['Recent interaction context', 'Stable identity-level facts', 'Social hearsay and propagated knowledge']
  },
  recall_filter: {
    title: 'Recall Filter & Synthesis',
    body: 'Here memory becomes point of view. The engine chooses what this character would remember right now and shapes it into a coherent response context.',
    list: ['Scores for relevance', 'Applies tone and relationship bias', 'Builds the final response context']
  },
  subject_output: {
    title: 'Subject Dialogue',
    body: 'This is the lived surface of the system: a response that feels owned by the character, shaped by memory, mood, and social history instead of raw retrieval.',
    list: ['Character-biased expression', 'Context-aware delivery', 'Performance shaped by continuity']
  },
  node_05: {
    title: 'Node 05: Sanctum Dashboard',
    body: 'Sanctum makes the invisible legible. It turns inference, pulses, and safeguards into something the team can inspect and steer with confidence.',
    list: ['Shows live neural activity', 'Surfaces pulse telemetry clearly', 'Exposes safety controls for supervision']
  }
};

const THEME = {
  teal: '#00e5ff',
  purple: '#bf7af0',
  blue: '#3b82f6',
  danger: '#ff3333',
  bg: '#05070a'
};

const DEFAULT_EDGE_STYLE = {
  type: 'smoothstep',
  color: '#00e5ff',
  width: 3,
  animated: true,
  dash: 'solid',
  glow: true,
  marker: 'arrow'
};

const AREA_IDS = new Set(['area_write', 'area_authority', 'area_read']);

const layout = {
  spineX: 480,
  continuityX: 970,
  rightRailX: 1370,
  nodeWidth: 400,
  sideWidth: 350,
  y: {
    dashboard: 310,
    interaction: 360,
    engine: 620,
    gates: 900,
    persist: 1190,
    truth: 1540,
    continuity: 1540,
    lifecycle: 1540,
    buckets: 2080,
    filter: 2080,
    output: 2080
  }
};

const buildNodeData = (id, label, color, extras = {}) => ({
  id,
  label,
  color,
  infoTitle: nodeInfo[id]?.title || label,
  infoBody: nodeInfo[id]?.body || '',
  infoList: nodeInfo[id]?.list || [],
  bgColor: extras.bgColor,
  pulseDelay: extras.pulseDelay || '',
  effect: extras.effect || (extras.pulseDelay ? 'pulse' : 'none'),
  ...extras
});

const makeEdge = (config) => {
  const dashMap = {
    solid: undefined,
    dashed: '10 6',
    dotted: '3 8'
  };

  return {
    ...config,
    type: config.type || 'smoothstep',
    animated: Boolean(config.animated),
    className: config.glow ? 'flow-pulse-edge' : undefined,
    style: {
      stroke: config.color,
      strokeWidth: config.width,
      strokeDasharray: dashMap[config.dash] || undefined
    },
    markerEnd:
      config.marker === 'none'
        ? undefined
        : {
            type: MarkerType.ArrowClosed,
            color: config.color,
            width: 10,
            height: 10
          },
    labelStyle: {
      fill: '#fff',
      fontWeight: 900,
      fontSize: '13px',
      fontFamily: 'var(--font-mono)'
    },
    labelBgStyle: {
      fill: THEME.bg,
      stroke: 'rgba(255,255,255,0.1)',
      strokeWidth: 1
    },
    labelBgPadding: [8, 12],
    labelBgBorderRadius: 2,
    data: {
      color: config.color,
      width: config.width,
      dash: config.dash,
      glow: config.glow,
      marker: config.marker
    }
  };
};

const DEFAULT_NODES = [
  { id: 'node_05', type: 'modern', position: { x: 1153.13, y: 792.483 }, data: buildNodeData('node_05', '05: Sanctum Dashboard', '#00ffcc', { pulseDelay: '1.15s' }), width: 350, zIndex: 100 },
  { id: 'node_01', type: 'modern', position: { x: layout.spineX, y: layout.y.interaction }, data: buildNodeData('node_01', '01: Interaction Surface', THEME.teal, { pulseDelay: '0s' }), width: layout.nodeWidth, zIndex: 100 },
  { id: 'node_02', type: 'modern', position: { x: 481.218, y: 566.391 }, data: buildNodeData('node_02', '02: Neural Engine', THEME.purple, { pulseDelay: '0.2s' }), width: layout.nodeWidth, zIndex: 100 },
  { id: 'logic_gates', type: 'modern', position: { x: 482.437, y: 803.747 }, data: buildNodeData('logic_gates', 'Logic Gates (Governor)', THEME.purple, { pulseDelay: '0.42s' }), width: layout.nodeWidth, zIndex: 100 },
  { id: 'persist_turn', type: 'modern', position: { x: 481.218, y: 1036.48 }, data: buildNodeData('persist_turn', 'Commit & Serialization', THEME.teal, { pulseDelay: '0.62s' }), width: layout.nodeWidth, zIndex: 100 },
  { id: 'node_04', type: 'modern', position: { x: layout.spineX, y: layout.y.truth }, data: buildNodeData('node_04', '04: System Truth', '#ffffff', { pulseDelay: '0.86s' }), width: layout.nodeWidth, zIndex: 100 },
  { id: 'node_03', type: 'modern', position: { x: 1253.89, y: 1547.31 }, data: buildNodeData('node_03', '03: Continuity Core', THEME.purple), width: layout.nodeWidth, zIndex: 100 },
  { id: 'action_lifecycle', type: 'modern', position: { x: 858.276, y: 1717.67 }, data: buildNodeData('action_lifecycle', 'Action Lifecycle State Machine', THEME.purple), width: 390, zIndex: 100 },
  { id: 'recall_buckets', type: 'modern', position: { x: layout.spineX, y: layout.y.buckets }, data: buildNodeData('recall_buckets', 'Recall Buckets', THEME.blue), width: layout.nodeWidth, zIndex: 100 },
  { id: 'recall_filter', type: 'modern', position: { x: 1247.79, y: 2080 }, data: buildNodeData('recall_filter', 'Recall Filter & Synthesis', THEME.blue), width: layout.nodeWidth, zIndex: 100 },
  { id: 'subject_output', type: 'modern', position: { x: 882.644, y: 2259.1 }, data: buildNodeData('subject_output', 'Subject Dialogue Output', THEME.blue), width: 350, zIndex: 100 },
  { id: 'area_write', type: 'area', position: { x: 360, y: 290 }, data: buildNodeData('area_write', 'Layer 1: Canonical System Memory', THEME.teal, { bgColor: 'rgba(0,229,255,0.03)', effect: 'none' }), width: 650, height: 1040, zIndex: 5 },
  { id: 'area_authority', type: 'area', position: { x: 362.437, y: 1458.74 }, data: buildNodeData('area_authority', 'Authority & Continuity Core', '#ffffff', { bgColor: 'rgba(255,255,255,0.025)', effect: 'none' }), width: 1460, height: 460, zIndex: 5 },
  { id: 'area_read', type: 'area', position: { x: 363.655, y: 1988.99 }, data: buildNodeData('area_read', 'Layer 2: Volatile Character Recall', THEME.blue, { bgColor: 'rgba(59,130,246,0.03)', effect: 'none' }), width: 1460, height: 460, zIndex: 5 }
];

const DEFAULT_EDGES = [
  makeEdge({ id: 'w1', source: 'node_01', target: 'node_02', sourceHandle: 'b', targetHandle: 't', label: 'Payload Delivery', color: THEME.teal, width: 3, animated: true, type: 'smoothstep', dash: 'solid', glow: true, marker: 'arrow' }),
  makeEdge({ id: 'w2', source: 'node_02', target: 'logic_gates', sourceHandle: 'b', targetHandle: 't', label: 'Intent Synthesis', color: THEME.purple, width: 2, animated: true, type: 'smoothstep', dash: 'solid', glow: true, marker: 'arrow' }),
  makeEdge({ id: 'w3', source: 'logic_gates', target: 'persist_turn', sourceHandle: 'b', targetHandle: 't', label: 'Eligible Facts', color: THEME.purple, width: 2, animated: true, type: 'smoothstep', dash: 'solid', glow: true, marker: 'arrow' }),
  makeEdge({ id: 'xy-edge__persist_turnb-node_04l', source: 'persist_turn', target: 'node_04', sourceHandle: 'b', targetHandle: 'l', label: 'Durable Commitment', color: THEME.teal, width: 4, animated: true, type: 'smoothstep', dash: 'solid', glow: true, marker: 'arrow' }),
  makeEdge({ id: 'r1', source: 'node_04', target: 'recall_buckets', sourceHandle: 'b', targetHandle: 't', label: 'Context Hydration', color: THEME.blue, width: 3, animated: false, type: 'smoothstep', dash: 'solid', glow: false, marker: 'arrow' }),
  makeEdge({ id: 'r2', source: 'recall_buckets', target: 'recall_filter', sourceHandle: 'r', targetHandle: 'l', label: 'Selective Recall', color: THEME.blue, width: 2, animated: false, type: 'smoothstep', dash: 'solid', glow: false, marker: 'arrow' }),
  makeEdge({ id: 'xy-edge__recall_filterb-subject_outputrt', source: 'recall_filter', target: 'subject_output', sourceHandle: 'b', targetHandle: 'rt', label: 'Performance Synthesis', color: THEME.blue, width: 4, animated: true, type: 'smoothstep', dash: 'solid', glow: false, marker: 'arrow' }),
  makeEdge({ id: 'l1', source: 'node_04', target: 'node_03', sourceHandle: 'r', targetHandle: 'l', label: 'State Polling', color: THEME.purple, width: 3, animated: true, type: 'smoothstep', dash: 'solid', glow: false, marker: 'arrow' }),
  makeEdge({ id: 'xy-edge__node_03b-action_lifecyclert', source: 'node_03', target: 'action_lifecycle', sourceHandle: 'b', targetHandle: 'rt', label: 'Evaluation', color: THEME.purple, width: 2, animated: false, type: 'smoothstep', dash: 'solid', glow: false, marker: 'arrow' }),
  makeEdge({ id: 'xy-edge__node_02r-node_05t', source: 'node_02', target: 'node_05', sourceHandle: 'r', targetHandle: 't', label: 'Neural Stream', color: '#00ffcc', width: 3, animated: true, type: 'smoothstep', dash: 'solid', glow: true, marker: 'arrow' }),
  makeEdge({ id: 'xy-edge__node_04ts-node_05bt', source: 'node_04', target: 'node_05', sourceHandle: 'ts', targetHandle: 'bt', label: 'Heartbeat Pulse', color: '#00ffcc', width: 2, animated: true, type: 'smoothstep', dash: 'dashed', glow: true, marker: 'arrow' })
];

const cloneDiagram = (diagram) => JSON.parse(JSON.stringify(diagram));

const loadSavedDiagram = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const AreaNode = ({ data }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      border: `2px solid ${data.color || 'rgba(255,255,255,0.6)'}`,
      borderRadius: '12px',
      background: data.bgColor || 'rgba(255,255,255,0.08)',
      position: 'relative',
      boxSizing: 'border-box',
      boxShadow: `0 0 50px ${data.color}22`,
      zIndex: 1
    }}
  >
    <NodeResizer isVisible={false} minWidth={280} minHeight={180} lineStyle={{ borderColor: data.color || '#fff' }} handleStyle={{ width: 10, height: 10, borderRadius: 2, background: data.color || '#fff' }} />
    <div
      style={{
        position: 'absolute',
        top: '-18px',
        left: '20px',
        fontSize: '18px',
        fontFamily: 'var(--font-mono)',
        color: data.color || '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        fontWeight: '800',
        background: THEME.bg,
        padding: '5px 16px',
        border: `1px solid ${data.color || '#fff'}`,
        zIndex: 20
      }}
    >
      {data.label}
    </div>
  </div>
);

const ModernNode = ({ data, selected }) => (
  <div
    className={`custom-node-modern ${selected ? 'active' : ''} ${data.effect === 'pulse' ? 'pulse-node' : ''}`}
    style={{
      width: '100%',
      minHeight: '110px',
      height: '100%',
      background: data.fill || (selected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'),
      border: `2px solid ${selected ? (data.color || THEME.teal) : 'rgba(255,255,255,0.2)'}`,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: selected || data.effect === 'glow' ? `0 0 40px ${(data.color || THEME.teal)}55` : 'none',
      transition: 'all 0.2s ease-in-out',
      zIndex: 10,
      ['--node-accent']: data.color || THEME.teal,
      ['--pulse-delay']: data.pulseDelay || '0s'
    }}
  >
    <NodeResizer isVisible={false} minWidth={220} minHeight={90} lineStyle={{ borderColor: data.color || '#fff' }} handleStyle={{ width: 10, height: 10, borderRadius: 2, background: data.color || '#fff' }} />
    <div className="node-scanlines" style={{ opacity: data.scans ? 0.15 : 0 }}></div>
    <div className="node-header" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <span className="node-id-tag" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>{data.id?.toUpperCase()}</span>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: data.color || THEME.teal, boxShadow: `0 0 15px ${data.color || THEME.teal}` }}></div>
    </div>
    <div style={{ padding: '12px 16px', flex: 1, display: 'flex', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: '700', letterSpacing: '0.02em', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
        {data.label}
      </span>
    </div>
    <Handle type="target" position={Position.Top} id="t" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
    <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
    <Handle type="source" position={Position.Top} id="ts" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
    <Handle type="target" position={Position.Bottom} id="bt" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
    <Handle type="target" position={Position.Left} id="l" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
    <Handle type="source" position={Position.Right} id="r" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
    <Handle type="source" position={Position.Left} id="ls" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
    <Handle type="target" position={Position.Right} id="rt" style={{ background: '#fff', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }} />
  </div>
);

const nodeTypes = { modern: ModernNode, area: AreaNode };

const Field = ({ label, children }) => (
  <label className="diagram-field">
    <span>{label}</span>
    {children}
  </label>
);

const EditorPanel = ({
  selectedNode,
  selectedEdge,
  edgeDraft,
  setEdgeDraft,
  onNodeChange,
  onEdgeChange,
  onDeleteSelected,
  onUndo,
  onSave,
  onLoad,
  onReset,
  saveStatus
}) => (
  <div className="diagram-editor-panel">
    <div className="diagram-editor-actions">
      <button onClick={onUndo}>Undo</button>
      <button onClick={onSave}>Save</button>
      <button onClick={onLoad}>Load</button>
      <button onClick={onReset}>Reset</button>
      <button onClick={onDeleteSelected} className="danger">Delete</button>
    </div>
    <div className="diagram-save-status">{saveStatus}</div>

    <div className="diagram-editor-section">
      <div className="diagram-editor-title">New Connector Defaults</div>
      <Field label="Type">
        <select value={edgeDraft.type} onChange={(e) => setEdgeDraft((draft) => ({ ...draft, type: e.target.value }))}>
          <option value="smoothstep">Smooth Step</option>
          <option value="step">Step</option>
          <option value="straight">Straight</option>
          <option value="bezier">Bezier</option>
        </select>
      </Field>
      <Field label="Style">
        <select value={edgeDraft.dash} onChange={(e) => setEdgeDraft((draft) => ({ ...draft, dash: e.target.value }))}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </Field>
      <Field label="Colour">
        <input type="color" value={edgeDraft.color} onChange={(e) => setEdgeDraft((draft) => ({ ...draft, color: e.target.value }))} />
      </Field>
      <Field label={`Width ${edgeDraft.width}`}>
        <input type="range" min="1" max="8" value={edgeDraft.width} onChange={(e) => setEdgeDraft((draft) => ({ ...draft, width: Number(e.target.value) }))} />
      </Field>
      <Field label="Arrowhead">
        <select value={edgeDraft.marker} onChange={(e) => setEdgeDraft((draft) => ({ ...draft, marker: e.target.value }))}>
          <option value="arrow">Arrow</option>
          <option value="none">None</option>
        </select>
      </Field>
      <label className="diagram-check"><input type="checkbox" checked={edgeDraft.animated} onChange={(e) => setEdgeDraft((draft) => ({ ...draft, animated: e.target.checked }))} /> Animated</label>
      <label className="diagram-check"><input type="checkbox" checked={edgeDraft.glow} onChange={(e) => setEdgeDraft((draft) => ({ ...draft, glow: e.target.checked }))} /> Glow / impulse</label>
    </div>

    {selectedNode && (
      <div className="diagram-editor-section">
        <div className="diagram-editor-title">Selected Node</div>
        <Field label="Label">
          <input value={selectedNode.data.label || ''} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, label: e.target.value } })} />
        </Field>
        <Field label="Title">
          <input value={selectedNode.data.infoTitle || ''} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, infoTitle: e.target.value } })} />
        </Field>
        <Field label="Inspector Summary">
          <textarea rows="4" value={selectedNode.data.infoBody || ''} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, infoBody: e.target.value } })} />
        </Field>
        <Field label="Inspector Points">
          <textarea rows="4" value={(selectedNode.data.infoList || []).join('\n')} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, infoList: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) } })} />
        </Field>
        <Field label="Accent Colour">
          <input type="color" value={selectedNode.data.color || '#ffffff'} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, color: e.target.value } })} />
        </Field>
        <Field label={`Width ${Math.round(selectedNode.width || 0)}`}>
          <input type="range" min="220" max="900" value={Math.round(selectedNode.width || 300)} onChange={(e) => onNodeChange(selectedNode.id, { width: Number(e.target.value) })} />
        </Field>
        <Field label={`Height ${Math.round(selectedNode.height || 110)}`}>
          <input type="range" min={AREA_IDS.has(selectedNode.id) ? '180' : '90'} max={AREA_IDS.has(selectedNode.id) ? '1400' : '360'} value={Math.round(selectedNode.height || 110)} onChange={(e) => onNodeChange(selectedNode.id, { height: Number(e.target.value) })} />
        </Field>
        {AREA_IDS.has(selectedNode.id) ? (
          <Field label="Frame Fill">
            <input value={selectedNode.data.bgColor || ''} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, bgColor: e.target.value } })} />
          </Field>
        ) : (
          <>
            <Field label="Node Fill">
              <input value={selectedNode.data.fill || 'rgba(255,255,255,0.08)'} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, fill: e.target.value } })} />
            </Field>
            <Field label="Effect">
              <select value={selectedNode.data.effect || 'none'} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, effect: e.target.value } })}>
                <option value="none">None</option>
                <option value="glow">Glow</option>
                <option value="pulse">Pulse</option>
              </select>
            </Field>
            <label className="diagram-check"><input type="checkbox" checked={selectedNode.data.scans !== false} onChange={(e) => onNodeChange(selectedNode.id, { data: { ...selectedNode.data, scans: e.target.checked } })} /> Scanlines</label>
          </>
        )}
      </div>
    )}

    {selectedEdge && (
      <div className="diagram-editor-section">
        <div className="diagram-editor-title">Selected Connector</div>
        <Field label="Label">
          <input value={selectedEdge.label || ''} onChange={(e) => onEdgeChange(selectedEdge.id, { label: e.target.value })} />
        </Field>
        <Field label="Type">
          <select value={selectedEdge.type || 'smoothstep'} onChange={(e) => onEdgeChange(selectedEdge.id, { type: e.target.value })}>
            <option value="smoothstep">Smooth Step</option>
            <option value="step">Step</option>
            <option value="straight">Straight</option>
            <option value="bezier">Bezier</option>
          </select>
        </Field>
        <Field label="Style">
          <select value={selectedEdge.data?.dash || 'solid'} onChange={(e) => onEdgeChange(selectedEdge.id, { dash: e.target.value })}>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </Field>
        <Field label="Colour">
          <input type="color" value={selectedEdge.data?.color || '#ffffff'} onChange={(e) => onEdgeChange(selectedEdge.id, { color: e.target.value })} />
        </Field>
        <Field label={`Width ${selectedEdge.data?.width || 2}`}>
          <input type="range" min="1" max="8" value={selectedEdge.data?.width || 2} onChange={(e) => onEdgeChange(selectedEdge.id, { width: Number(e.target.value) })} />
        </Field>
        <Field label="Arrowhead">
          <select value={selectedEdge.data?.marker || 'arrow'} onChange={(e) => onEdgeChange(selectedEdge.id, { marker: e.target.value })}>
            <option value="arrow">Arrow</option>
            <option value="none">None</option>
          </select>
        </Field>
        <label className="diagram-check"><input type="checkbox" checked={Boolean(selectedEdge.animated)} onChange={(e) => onEdgeChange(selectedEdge.id, { animated: e.target.checked })} /> Animated</label>
        <label className="diagram-check"><input type="checkbox" checked={Boolean(selectedEdge.data?.glow)} onChange={(e) => onEdgeChange(selectedEdge.id, { glow: e.target.checked })} /> Glow / impulse</label>
      </div>
    )}
  </div>
);

const CustomZoomControls = ({ onZoomIn, onZoomOut, onFitView }) => (
  <div className="diagram-zoom-controls">
    <div className="diagram-zoom-label">ZOOM</div>
    <button onClick={onZoomIn}>+</button>
    <button onClick={onZoomOut}>-</button>
    <button className="fit" onClick={onFitView}>FIT</button>
  </div>
);

const SystemDiagram = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const initialDiagram = useMemo(() => loadSavedDiagram() || { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES }, []);
  const [nodes, setNodes] = useState(() => cloneDiagram(initialDiagram.nodes));
  const [edges, setEdges] = useState(() => cloneDiagram(initialDiagram.edges));
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [inspectorPos, setInspectorPos] = useState({ x: 32, y: 32 });
  const [isInspectorDragging, setIsInspectorDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Local editor ready');
  const [edgeDraft, setEdgeDraft] = useState(DEFAULT_EDGE_STYLE);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const historyRef = useRef([JSON.stringify(initialDiagram)]);
  const restoringRef = useRef(false);
  const debounceRef = useRef(null);
  const inspectorDragStart = useRef({ x: 0, y: 0 });

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) || null;

  const pushHistory = useCallback((nextNodes, nextEdges) => {
    if (restoringRef.current) return;
    const snapshot = JSON.stringify({ nodes: nextNodes, edges: nextEdges });
    const current = historyRef.current[historyRef.current.length - 1];
    if (snapshot === current) return;
    historyRef.current = [...historyRef.current.slice(-39), snapshot];
  }, []);

  const scheduleHistory = useCallback((nextNodes, nextEdges) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushHistory(nextNodes, nextEdges), 220);
  }, [pushHistory]);

  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

  useEffect(() => {
    const onMouseMove = (event) => {
      if (isInspectorDragging) {
        setInspectorPos({
          x: event.clientX - inspectorDragStart.current.x,
          y: event.clientY - inspectorDragStart.current.y
        });
      }
    };

    const onMouseUp = () => setIsInspectorDragging(false);

    if (isInspectorDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isInspectorDragging]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };
    const handleKeyUp = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };
    const handleBlur = () => setIsCtrlPressed(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((current) => {
      const next = applyNodeChanges(changes, current);
      scheduleHistory(next, edges);
      return next;
    });
  }, [edges, scheduleHistory]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((current) => {
      const next = applyEdgeChanges(changes, current);
      scheduleHistory(nodes, next);
      return next;
    });
  }, [nodes, scheduleHistory]);

  const onConnect = useCallback((connection) => {
    setEdges((current) => {
      const nextEdge = makeEdge({
        ...edgeDraft,
        id: `edge_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        label: 'New Connector'
      });
      const next = addEdge(nextEdge, current);
      scheduleHistory(nodes, next);
      return next;
    });
    setSaveStatus('Connector created');
  }, [edgeDraft, nodes, scheduleHistory]);

  const onReconnect = useCallback((oldEdge, newConnection) => {
    setEdges((current) => {
      const next = reconnectEdge(oldEdge, newConnection, current);
      scheduleHistory(nodes, next);
      return next;
    });
    setSelectedEdgeId(oldEdge.id);
    setSaveStatus('Connector re-linked');
  }, [nodes, scheduleHistory]);

  const updateNode = useCallback((nodeId, patch) => {
    setNodes((current) => {
      const next = current.map((node) => (node.id === nodeId ? { ...node, ...patch, data: patch.data || node.data } : node));
      pushHistory(next, edges);
      return next;
    });
  }, [edges, pushHistory]);

  const updateEdge = useCallback((edgeId, patch) => {
    setEdges((current) => {
      const next = current.map((edge) => {
        if (edge.id !== edgeId) return edge;
        const nextConfig = {
          ...edge,
          ...edge.data,
          ...patch,
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: patch.label ?? edge.label
        };
        return makeEdge(nextConfig);
      });
      pushHistory(nodes, next);
      return next;
    });
  }, [nodes, pushHistory]);

  const onSave = useCallback(() => {
    const payload = JSON.stringify({ nodes, edges });
    window.localStorage.setItem(STORAGE_KEY, payload);
    pushHistory(nodes, edges);
    setSaveStatus(`Saved locally at ${new Date().toLocaleTimeString()}`);
  }, [edges, nodes, pushHistory]);

  const onLoad = useCallback(() => {
    const saved = loadSavedDiagram();
    if (!saved) {
      setSaveStatus('No saved diagram found');
      return;
    }
    restoringRef.current = true;
    setNodes(saved.nodes);
    setEdges(saved.edges);
    historyRef.current = [JSON.stringify(saved)];
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSaveStatus('Loaded saved diagram');
    requestAnimationFrame(() => {
      restoringRef.current = false;
      fitView({ padding: 0.08, minZoom: 0.3 });
    });
  }, [fitView]);

  const onReset = useCallback(() => {
    const reset = { nodes: cloneDiagram(DEFAULT_NODES), edges: cloneDiagram(DEFAULT_EDGES) };
    restoringRef.current = true;
    setNodes(reset.nodes);
    setEdges(reset.edges);
    historyRef.current = [JSON.stringify(reset)];
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSaveStatus('Reset to default diagram');
    requestAnimationFrame(() => {
      restoringRef.current = false;
      fitView({ padding: 0.08, minZoom: 0.3 });
    });
  }, [fitView]);

  const onUndo = useCallback(() => {
    if (historyRef.current.length < 2) {
      setSaveStatus('Nothing to undo');
      return;
    }
    historyRef.current = historyRef.current.slice(0, -1);
    const previous = JSON.parse(historyRef.current[historyRef.current.length - 1]);
    restoringRef.current = true;
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSaveStatus('Undid last change');
    requestAnimationFrame(() => {
      restoringRef.current = false;
    });
  }, []);

  const onDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      const nextNodes = nodes.filter((node) => node.id !== selectedNodeId);
      const nextEdges = edges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId);
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(null);
      pushHistory(nextNodes, nextEdges);
      setSaveStatus('Node deleted');
      return;
    }
    if (selectedEdgeId) {
      const nextEdges = edges.filter((edge) => edge.id !== selectedEdgeId);
      setEdges(nextEdges);
      setSelectedEdgeId(null);
      pushHistory(nodes, nextEdges);
      setSaveStatus('Connector deleted');
    }
  }, [edges, nodes, pushHistory, selectedEdgeId, selectedNodeId]);

  const getInspectorNode = selectedNode && !AREA_IDS.has(selectedNode.id)
    ? {
        title: selectedNode.data.infoTitle || selectedNode.data.label,
        body: selectedNode.data.infoBody || '',
        list: selectedNode.data.infoList || [],
        color: selectedNode.data.color || THEME.teal,
        id: selectedNode.id
      }
    : null;

  return (
    <div className="diagram-editor-shell">
      <div
        className="system-flow-stage"
        style={{
          position: 'relative',
          marginTop: '24px',
          marginLeft: '-40px',
          marginRight: '-40px',
          height: '1880px',
          width: 'calc(100% + 80px)',
          border: '1px solid rgba(255,255,255,0.2)',
          background: THEME.bg
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onNodeClick={(event, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
          setInspectorPos({
            x: Math.min(window.innerWidth - 420, event.clientX + 28),
            y: Math.max(90, event.clientY - 40)
          });
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={() => setSelectedEdgeId(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.08, minZoom: 0.3 }}
          minZoom={0.1}
          maxZoom={2.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          deleteKeyCode={[]}
          zoomOnScroll={false}
          panOnDrag={false}
          zoomOnPinch
          zoomOnDoubleClick
          edgesReconnectable={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255,255,255,0.03)" gap={30} size={1} />
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
            <CustomZoomControls onZoomIn={() => zoomIn()} onZoomOut={() => zoomOut()} onFitView={() => fitView({ padding: 0.08, minZoom: 0.3 })} />
          </div>
        </ReactFlow>

        {getInspectorNode && (
          <div
            className="inspector-hud"
            style={{
              position: 'fixed',
              top: `${inspectorPos.y}px`,
              left: `${inspectorPos.x}px`,
              width: '360px',
              background: 'rgba(5, 7, 10, 0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRight: `8px solid ${getInspectorNode.color}`,
              boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
              zIndex: 1000,
              cursor: isInspectorDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={(event) => {
              if (event.target.closest('[data-close-inspector="true"]')) return;
              setIsInspectorDragging(true);
              inspectorDragStart.current = {
                x: event.clientX - inspectorPos.x,
                y: event.clientY - inspectorPos.y
              };
            }}
          >
            <div className="hud-header" style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mono text-accent" style={{ fontSize: '0.75rem', fontWeight: 900, color: getInspectorNode.color }}>
                NODE NOTES // {getInspectorNode.id.toUpperCase()}
              </div>
              <button
                data-close-inspector="true"
                onClick={() => setSelectedNodeId(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
              >
                X
              </button>
            </div>
            <div style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '1.9rem', marginBottom: '16px', color: '#fff', fontWeight: 900 }}>{getInspectorNode.title}</h2>
              <p className="muted" style={{ lineHeight: '1.65', fontSize: '1rem', marginBottom: '20px', color: 'rgba(255,255,255,0.88)' }}>{getInspectorNode.body}</p>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '14px', fontWeight: 800 }}>WHAT THIS MEANS</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {getInspectorNode.list.map((item, index) => (
                    <li key={index} style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.95)', marginBottom: '10px', paddingLeft: '18px', position: 'relative', lineHeight: 1.5 }}>
                      <span style={{ position: 'absolute', left: 0, color: getInspectorNode.color, fontWeight: 900 }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

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
