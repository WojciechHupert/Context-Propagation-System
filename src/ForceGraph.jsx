import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

// NPC-inspired node names for the social network
const NPC_NAMES = [
  'Auggie', 'Archivist', 'Mechanic', 'Gardener', 'Merchant', 'Wanderer',
  'Sentinel', 'Scholar', 'Courier', 'Weaver', 'Oracle', 'Drifter',
  'Keeper', 'Warden', 'Listener', 'Cipher', 'Narrator', 'Witness',
  'Pioneer', 'Chronicler', 'Collector', 'Nomad', 'Builder', 'Seeker',
  'Observer', 'Catalyst', 'Anchor', 'Echo', 'Pulse', 'Nexus'
];

// Generate a social network graph with multiple dense clusters
function generateSocialGraph(nodeCount = 1000) {
  const nodes = [];
  const links = [];
  
  const numCores = 8;
  const hubs = {}; // Store hubs per group

  // Create nodes with power-law values to naturally form dense centers
  for (let i = 0; i < nodeCount; i++) {
    const group = Math.floor(Math.random() * numCores);
    // 5% chance to be a large hub, 20% medium, 75% small
    const r = Math.random();
    let val = 0.5 + Math.random() * 1.5;
    if (r < 0.05) val += 4 + Math.random() * 3; // Hubs
    else if (r < 0.25) val += 1.5 + Math.random() * 2; // Sub-hubs
    
    nodes.push({
      id: i,
      name: NPC_NAMES[i % NPC_NAMES.length],
      group: group,
      val: val,
      _active: false,
      _activeTime: 0,
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
    links.push({
      source,
      target,
      _flash: 0,
      _flashColor: null,
      _talking: false,
      _talkTime: 0,
    });
  };

  // Create clusters (preferential attachment to hubs)
  for (let i = 0; i < nodeCount; i++) {
    const node = nodes[i];
    const groupHubs = hubs[node.group] || [];
    
    // Connect to nodes in the same group, prioritizing hubs
    const connections = 1 + (node.val > 3 ? 2 : 0); 
    for (let c = 0; c < connections; c++) {
      let target;
      if (groupHubs.length > 0 && Math.random() < 0.7) {
        target = groupHubs[Math.floor(Math.random() * groupHubs.length)];
      } else {
        const groupNodes = nodes.filter(n => n.group === node.group);
        if (groupNodes.length > 0) {
          target = groupNodes[Math.floor(Math.random() * groupNodes.length)].id;
        } else {
          target = i;
        }
      }
      addLink(i, target);
    }
  }

  // Interconnect the clusters together
  const interClusterLinks = numCores * 6;
  for (let i = 0; i < interClusterLinks; i++) {
    const core1 = Math.floor(Math.random() * numCores);
    let core2 = Math.floor(Math.random() * numCores);
    while (core1 === core2) core2 = Math.floor(Math.random() * numCores);
    
    // Connect peripheral nodes between clusters
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

// Color palette per group — muted, scientific tones
const GROUP_COLORS = [
  { base: [255, 77, 0],    dim: [120, 40, 10] },   // orange/accent
  { base: [0, 180, 220],   dim: [10, 70, 90] },     // cyan
  { base: [180, 60, 255],  dim: [70, 25, 100] },    // purple
  { base: [0, 200, 120],   dim: [10, 80, 50] },     // emerald
  { base: [255, 180, 0],   dim: [100, 70, 10] },    // gold
];

const FLASH_COLORS = [
  [255, 120, 40],  // warm flash
  [100, 200, 255], // cool flash
  [255, 200, 80],  // golden flash
  [150, 255, 150], // green flash
];

export default function MoiraiForceGraph({ width, height, isActive }) {
  const graphRef = useRef();
  const animFrameRef = useRef();
  const graphDataRef = useRef(null);
  const timeRef = useRef(0);

  const [graphData, setGraphData] = React.useState(() => generateSocialGraph(1000));

  useEffect(() => {
    graphDataRef.current = graphData;
  }, [graphData]);

  // Simulate conversations & flash effects
  useEffect(() => {
    // We run the simulations constantly, even when inactive, 
    // to keep the background interesting

    // Simulate talking between nodes
    const talkInterval = setInterval(() => {
      if (!graphDataRef.current) return;
      const { links } = graphDataRef.current;

      // Pick several random links to "talk" given the larger network
      const talkCount = 5 + Math.floor(Math.random() * 10);
      for (let i = 0; i < talkCount; i++) {
        const link = links[Math.floor(Math.random() * links.length)];
        if (link) {
          link._talking = true;
          link._talkTime = Date.now();
        }
      }
    }, 800);

    // Flash entire branches occasionally
    const flashInterval = setInterval(() => {
      if (!graphDataRef.current) return;
      const { links, nodes } = graphDataRef.current;

      // Pick a random node and flash all its connections
      const sourceNode = nodes[Math.floor(Math.random() * nodes.length)];
      const flashColor = FLASH_COLORS[Math.floor(Math.random() * FLASH_COLORS.length)];

      links.forEach(link => {
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;

        if (srcId === sourceNode.id || tgtId === sourceNode.id) {
          link._flash = 1.0;
          link._flashColor = flashColor;
        }
      });

      // Mark the node active too
      sourceNode._active = true;
      sourceNode._activeTime = Date.now();
    }, 3000);

    return () => {
      clearInterval(talkInterval);
      clearInterval(flashInterval);
    };
  }, []);

  // Node migration (traveling between clusters)
  useEffect(() => {
    const migrationInterval = setInterval(() => {
      setGraphData(({ nodes, links }) => {
        // Pick a small random node to migrate
        const candidates = nodes.filter(n => n.val < 2);
        if (candidates.length === 0) return { nodes, links };
        
        const traveler = candidates[Math.floor(Math.random() * candidates.length)];
        
        // Find a new group
        const numCores = 8;
        let newGroup = Math.floor(Math.random() * numCores);
        while(newGroup === traveler.group) newGroup = Math.floor(Math.random() * numCores);
        
        // Change its group
        traveler.group = newGroup;
        
        // Remove old links
        const newLinks = links.filter(l => l.source !== traveler.id && l.target !== traveler.id);
        
        // Add new link to the new group's hub
        const newGroupNodes = nodes.filter(n => n.group === newGroup && n.val > 3);
        if (newGroupNodes.length > 0) {
          const target = newGroupNodes[Math.floor(Math.random() * newGroupNodes.length)].id;
          newLinks.push({
            source: traveler.id,
            target: target,
            _flash: 0, _talking: false, _talkTime: 0
          });
        }
        
        // Return shallow copy to trigger force update
        return { nodes: [...nodes], links: newLinks };
      });
    }, 4000); // A node travels every 4 seconds

    return () => clearInterval(migrationInterval);
  }, []);

  // Continuous slow rotation
  useEffect(() => {
    // Poll for controls and set autoRotate once
    // OrbitControls will naturally pause autoRotate during user interaction
    // and resume it afterwards.
    const timer = setInterval(() => {
      if (graphRef.current) {
        const controls = graphRef.current.controls();
        if (controls && controls.autoRotate !== undefined) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.15; // Slow, majestic spin
          clearInterval(timer);
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Setup camera distance after mount and handle zoom
  useEffect(() => {
    if (!graphRef.current) return;
    const timer = setTimeout(() => {
      if (graphRef.current) {
        // Zoomed in (700) before CTA, zoomed out (1200) after CTA
        const targetZ = isActive ? 1200 : 700;
        graphRef.current.cameraPosition({ z: targetZ }, null, 2500);
        
        // Organic forces adjustments for tighter clusters
        graphRef.current.d3Force('charge').strength(-25); // Denser
        graphRef.current.d3Force('link').distance(10); // Closer
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isActive]);

  // Custom node rendering — spheres with glow
  const nodeThreeObject = useCallback((node) => {
    const group = new THREE.Group();
    const colors = GROUP_COLORS[node.group % GROUP_COLORS.length];
    const [r, g, b] = colors.base;
    const size = node.val; // Cores are larger, regular nodes are smaller

    // Core sphere (reduced geometry resolution for performance)
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(`rgb(${r},${g},${b})`),
      emissive: new THREE.Color(`rgb(${Math.floor(r*0.4)},${Math.floor(g*0.4)},${Math.floor(b*0.4)})`),
      transparent: true,
      opacity: size > 4 ? 0.95 : 0.8,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Glow ring only for hubs to save performance and highlight structure
    if (size > 4) {
      const ringGeom = new THREE.RingGeometry(size * 1.3, size * 1.8, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(`rgb(${r},${g},${b})`),
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      group.add(ring);
    }

    return group;
  }, []);

  // Link color with flash/talk effects
  const linkColor = useCallback((link) => {
    const now = Date.now();

    // Flash effect (branch refresh)
    if (link._flash > 0) {
      link._flash -= 0.02;
      if (link._flash < 0) link._flash = 0;
      const fc = link._flashColor || [255, 200, 100];
      const intensity = link._flash;
      return `rgba(${fc[0]}, ${fc[1]}, ${fc[2]}, ${0.3 + intensity * 0.7})`;
    }

    // Talk effect (communication)
    if (link._talking) {
      const elapsed = now - link._talkTime;
      if (elapsed > 2000) {
        link._talking = false;
      } else {
        const pulse = Math.sin((elapsed / 2000) * Math.PI);
        const brightness = Math.floor(150 + pulse * 105);
        return `rgba(${brightness}, ${Math.floor(brightness * 0.6)}, ${Math.floor(brightness * 0.2)}, ${0.4 + pulse * 0.5})`;
      }
    }

    // Default dim
    return 'rgba(255, 77, 0, 0.25)';
  }, []);

  const linkWidth = useCallback((link) => {
    if (link._flash > 0) return 1.5 + link._flash * 3;
    if (link._talking) {
      const elapsed = Date.now() - link._talkTime;
      const pulse = Math.sin((elapsed / 2000) * Math.PI);
      return 1.2 + pulse * 2.5;
    }
    return 0.6;
  }, []);

  const linkDirectionalParticles = useCallback((link) => {
    if (link._talking) return 6; // Heavy information flow when talking
    if (link._flash > 0.3) return 3;
    return 1; // Constant background flow of information
  }, []);

  const linkDirectionalParticleSpeed = useCallback((link) => {
    if (link._talking) return 0.015; // Faster during active communication
    return 0.003; // Slow background flow
  }, []);

  const linkDirectionalParticleWidth = useCallback((link) => {
    if (link._talking) return 2.5;
    return 0.8;
  }, []);

  // Removed the !visible check here because we want it to mount immediately

  return (
    <ForceGraph3D
      ref={graphRef}
      width={width}
      height={height}
      graphData={graphData}
      backgroundColor="rgba(0,0,0,0)"
      showNavInfo={false}
      enableNodeDrag={false}
      enableNavigationControls={true}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkOpacity={0.8}
      linkDirectionalParticles={linkDirectionalParticles}
      linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
      linkDirectionalParticleWidth={linkDirectionalParticleWidth}
      linkDirectionalParticleColor={() => 'rgba(255, 140, 40, 0.9)'}
      d3AlphaDecay={0.005} // Very low decay causes continuous jiggle (living organism)
      d3VelocityDecay={0.3}
      warmupTicks={50}
      cooldownTime={5000}
    />
  );
}
