import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * CONFIGURATION & CONSTANTS
 * Moved outside component to prevent re-declaration on every render.
 */
const FAKE_NAMES = [
  'Alden', 'Bree', 'Caelan', 'Dara', 'Elias', 'Faye', 'Gael', 'Hollis', 'Isla', 'Jace',
  'Kael', 'Lira', 'Milo', 'Nia', 'Orion', 'Piper', 'Quinn', 'Rowan', 'Silas', 'Talia',
  'Uri', 'Vera', 'Wren', 'Xael', 'Yara', 'Zane', 'Aria', 'Bodhi', 'Cora', 'Dane',
  'Elio', 'Freya', 'Gideon', 'Hazel', 'Idris', 'Juno', 'Kian', 'Luna', 'Maeve', 'Nolan',
  'Opal', 'Penn', 'Quila', 'Rhys', 'Soren', 'Thea', 'Ulla', 'Vigo', 'Willa', 'Xeno'
];
const MOODS = ['Calm', 'Anxious', 'Excited', 'Apathetic', 'Curious', 'Frustrated', 'Joyful', 'Melancholic'];
const ATTITUDES = ['Cooperative', 'Hostile', 'Neutral', 'Suspicious', 'Welcoming', 'Dismissive', 'Eager', 'Guarded'];
const PERSONALITIES = ['Analytical', 'Creative', 'Pragmatic', 'Idealistic', 'Impulsive', 'Cautious', 'Charismatic', 'Introverted'];

const GROUP_COLORS = [
  { base: [255, 77, 0],    dim: [38, 12, 0] },     // orange/accent
  { base: [0, 180, 220],   dim: [0, 27, 33] },     // cyan
  { base: [180, 60, 255],  dim: [27, 9, 38] },     // purple
  { base: [0, 200, 120],   dim: [0, 30, 18] },     // emerald
  { base: [255, 180, 0],   dim: [38, 27, 0] },     // gold
];

const BASE_ROTATION_SPEED = Math.PI / 4000;
const ZOOM_DISTANCE = 300;

/**
 * UTILITIES
 */
function generateSocialGraph(nodeCount = 150) {
  const nodes = [];
  const links = [];
  const numCores = 8;
  const hubs = {};

  for (let i = 0; i < nodeCount; i++) {
    const group = Math.floor(Math.random() * numCores);
    const r = Math.random();
    let val = 0.5 + Math.random() * 1.5;
    if (r < 0.05) val += 4 + Math.random() * 3;
    else if (r < 0.25) val += 1.5 + Math.random() * 2;
    
    nodes.push({
      id: i,
      name: FAKE_NAMES[i % FAKE_NAMES.length],
      mood: MOODS[Math.floor(Math.random() * MOODS.length)],
      attitude: ATTITUDES[Math.floor(Math.random() * ATTITUDES.length)],
      personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
      group: group,
      val: val
    });

    if (!hubs[group]) hubs[group] = [];
    if (val > 3) hubs[group].push(i);
  }

  const existingLinks = new Set();
  const addLink = (source, target) => {
    if (source === target) return;
    const key = `${Math.min(source, target)}-${Math.max(source, target)}`;
    if (existingLinks.has(key)) return;
    existingLinks.add(key);
    links.push({ source, target });
  };

  for (let i = 0; i < nodeCount; i++) {
    const node = nodes[i];
    const groupHubs = hubs[node.group] || [];
    const connections = 1 + (node.val > 3 ? 1 : 0); 
    for (let c = 0; c < connections; c++) {
      let target;
      if (groupHubs.length > 0 && Math.random() < 0.7) {
        target = groupHubs[Math.floor(Math.random() * groupHubs.length)];
      } else {
        const groupNodes = nodes.filter(n => n.group === node.group);
        target = groupNodes.length > 0 ? groupNodes[Math.floor(Math.random() * groupNodes.length)].id : i;
      }
      addLink(i, target);
    }
  }

  const interClusterLinks = numCores * 15;
  for (let i = 0; i < interClusterLinks; i++) {
    const core1 = Math.floor(Math.random() * numCores);
    let core2 = Math.floor(Math.random() * numCores);
    while (core1 === core2) core2 = Math.floor(Math.random() * numCores);
    
    const group1 = nodes.filter(n => n.group === core1 && n.val < 3);
    const group2 = nodes.filter(n => n.group === core2 && n.val < 3);
    if (group1.length > 0 && group2.length > 0) {
      addLink(
        group1[Math.floor(Math.random() * group1.length)].id,
        group2[Math.floor(Math.random() * group2.length)].id
      );
    }
  }

  return { nodes, links };
}

/**
 * MAIN COMPONENT
 */
export default function MoiraiForceGraph({ width, height }) {
  const graphRef = useRef();
  const rotationAngleRef = useRef(0);
  const speedMultiplierRef = useRef(1); // 1 for normal, 0.5 for hover
  const [activeNode, setActiveNode] = React.useState(null);

  // Memoize graph data to prevent regeneration on parent re-renders
  const graphData = useMemo(() => generateSocialGraph(150), []);

  /**
   * INITIALIZATION & FORCE SETUP
   */
  useEffect(() => {
    if (!graphRef.current) return;
    
    // Slight delay to ensure graph is mounted and stable
    const timer = setTimeout(() => {
      const graph = graphRef.current;
      if (graph) {
        graph.d3Force('charge').strength(-25); 
        graph.d3Force('link').distance(15); 
        
        const controls = graph.controls();
        if (controls) {
          controls.enableZoom = false;
          controls.enablePan = false;
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * ANIMATION LOOP (SOLAR SYSTEM ORBIT)
   */
  useEffect(() => {
    let animationFrameId;

    const orbit = () => {
      if (graphRef.current) {
        graphRef.current.cameraPosition({
          x: ZOOM_DISTANCE * Math.sin(rotationAngleRef.current),
          z: ZOOM_DISTANCE * Math.cos(rotationAngleRef.current)
        });
        rotationAngleRef.current += (BASE_ROTATION_SPEED * speedMultiplierRef.current);
      }
      animationFrameId = requestAnimationFrame(orbit);
    };

    orbit();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  /**
   * INTERACTION HANDLERS
   */
  const handleNodeHover = useCallback((node) => {
    setActiveNode(node);
    speedMultiplierRef.current = node ? 0.5 : 1;
  }, []);

  const handleNodeDrag = useCallback((node) => {
    setActiveNode(node);
    speedMultiplierRef.current = 0.5;
  }, []);

  const handleNodeDragEnd = useCallback(() => {
    setActiveNode(null);
    speedMultiplierRef.current = 1;
  }, []);

  /**
   * DYNAMIC STYLING CALLBACKS
   * Memoized for performance.
   */
  const neighbors = useMemo(() => {
    if (!activeNode || !graphData) return new Set();
    const neighborSet = new Set();
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sourceId === activeNode.id) neighborSet.add(targetId);
      if (targetId === activeNode.id) neighborSet.add(sourceId);
    });
    // Limit to 3 neighbors for the highlight effect as requested
    return new Set(Array.from(neighborSet).slice(0, 3));
  }, [activeNode, graphData]);

  const nodeColor = useCallback((node) => {
    if (node === activeNode) return '#ffffff';
    
    const isNeighbor = neighbors.has(node.id);
    const isDimmed = activeNode && node !== activeNode && !isNeighbor;
    
    const groupIdx = node.group % GROUP_COLORS.length;
    const [r, g, b] = GROUP_COLORS[groupIdx].base;
    
    if (isNeighbor) {
      // 50% brightness for neighbors
      return `rgb(${Math.floor(r * 0.5 + 127)},${Math.floor(g * 0.5 + 127)},${Math.floor(b * 0.5 + 127)})`;
    }
    
    if (isDimmed) {
      // 20% less dark than before (was 0.15, now ~0.35)
      return `rgb(${Math.floor(r * 0.35)},${Math.floor(g * 0.35)},${Math.floor(b * 0.35)})`; 
    }
    return `rgb(${r},${g},${b})`;
  }, [activeNode, neighbors]);

  const nodeVal = useCallback((node) => node.val * 0.5, []);

  const linkColor = useCallback((link) => {
    if (activeNode) {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      const isDirect = sourceId === activeNode.id || targetId === activeNode.id;
      const isNeighborLink = neighbors.has(sourceId) || neighbors.has(targetId);

      if (isDirect) return 'rgba(255, 255, 255, 0.6)';
      if (isNeighborLink) return 'rgba(255, 255, 255, 0.2)';
      
      return 'rgba(60, 0, 0, 0.15)'; // Less dark than before (was 0.05)
    }
    return 'rgba(150, 20, 20, 0.4)';
  }, [activeNode, neighbors]);

  const linkWidth = useCallback((link) => {
    if (activeNode) {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      const isDirect = sourceId === activeNode.id || targetId === activeNode.id;
      return isDirect ? 0.8 : 0.2;
    }
    return 0.6;
  }, [activeNode]);

  /**
   * POST-PROCESSING (BLOOM)
   */
  useEffect(() => {
    if (graphRef.current) {
      const bloomPass = new UnrealBloomPass();
      bloomPass.strength = 0.98;
      bloomPass.radius = 0.6;
      bloomPass.threshold = 0.1;
      graphRef.current.postProcessingComposer().addPass(bloomPass);
    }
  }, []);

  return (
    <ForceGraph3D
      ref={graphRef}
      width={width}
      height={height}
      graphData={graphData}
      backgroundColor="rgba(0,0,0,0)"
      showNavInfo={false}
      onNodeHover={handleNodeHover}
      onNodeDrag={handleNodeDrag}
      onNodeDragEnd={handleNodeDragEnd}
      enableNodeDrag={true}
      enableNavigationControls={false}
      nodeLabel={(node) => `
        <div style="background: rgba(10, 15, 25, 0.9); border: 1px solid rgba(255,100,50,0.3); padding: 12px; border-radius: 4px; font-family: monospace; color: #ddd; font-size: 15px; line-height: 1.4;">
          <strong style="color: #fff; font-size: 18px; display: block; border-bottom: 1px solid #444; padding-bottom: 6px; margin-bottom: 6px;">${node.name}</strong>
          <div style="color: #aaa;">Mood: <span style="color: #fff">${node.mood}</span></div>
          <div style="color: #aaa;">Attitude: <span style="color: #fff">${node.attitude}</span></div>
          <div style="color: #aaa;">Personality: <span style="color: #fff">${node.personality}</span></div>
        </div>
      `}
      nodeColor={nodeColor}
      nodeVal={nodeVal}
      nodeResolution={16}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkOpacity={1}
      linkCurvature={0.25}
      enableZoom={false}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.5} 
      warmupTicks={50}
      cooldownTime={5000}
    />
  );
}
