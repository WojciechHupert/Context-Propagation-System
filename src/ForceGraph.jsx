import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

const FAKE_NAMES = [
  'Alden', 'Bree', 'Caelan', 'Dara', 'Elias', 'Faye', 'Gael', 'Hollis', 'Isla', 'Jace',
  'Kael', 'Lira', 'Milo', 'Nia', 'Orion', 'Piper', 'Quinn', 'Rowan', 'Silas', 'Talia',
  'Uri', 'Vera', 'Wren', 'Xael', 'Yara', 'Zane', 'Aria', 'Bodhi', 'Cora', 'Dane',
  'Elio', 'Freya', 'Gideon', 'Hazel', 'Idris', 'Juno', 'Kian', 'Luna', 'Maeve', 'Nolan',
  'Opal', 'Penn', 'Quila', 'Rhys', 'Soren', 'Thea', 'Ulla', 'Vigo', 'Willa', 'Xeno'
];

const GROUP_COLORS = [
  [255, 106, 43],
  [54, 201, 242],
  [168, 74, 232],
  [42, 214, 142],
  [255, 204, 42]
];

const BASE_ROTATION_SPEED = Math.PI / 5600;
const ZOOM_DISTANCE = 344;
const POINTER_REPEL_RADIUS = 56;
const POINTER_REPEL_STRENGTH = 0.011;
const CONVERSATION_GAP_MIN = 1400;
const CONVERSATION_GAP_MAX = 2550;
const MAX_CONCURRENT_CONVERSATIONS = 3;
const PREHEAT_MS = 220;
const AFTERGLOW_MS = 1600;

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, maxInclusive) {
  return min + Math.floor(Math.random() * (maxInclusive - min + 1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createNode(id, group) {
  return {
    id,
    name: FAKE_NAMES[id % FAKE_NAMES.length],
    group,
    val: 0.7 + Math.random() * 2.8
  };
}

function generateSocialGraph(nodeCount = 120) {
  const nodes = [];
  const links = [];
  const numGroups = 5;
  const existingLinks = new Set();

  const addLink = (source, target) => {
    if (source === target) return;
    const key = `${Math.min(source, target)}-${Math.max(source, target)}`;
    if (existingLinks.has(key)) return;
    existingLinks.add(key);
    links.push({ id: `impulse-${key}`, source, target });
  };

  const groupAnchors = [
    { x: -72, y: 30 },
    { x: 56, y: 54 },
    { x: 82, y: -38 },
    { x: -18, y: -68 },
    { x: -88, y: -16 }
  ];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push(createNode(i, Math.floor(Math.random() * numGroups)));
  }

  nodes.forEach((node) => {
    const anchor = groupAnchors[node.group];
    node.x = anchor.x + randRange(-28, 28);
    node.y = anchor.y + randRange(-26, 26);
    node.z = randRange(-14, 14);
    node.vx = randRange(-0.06, 0.06);
    node.vy = randRange(-0.06, 0.06);
  });

  for (let i = 0; i < nodeCount; i++) {
    const sameGroup = nodes.filter((node) => node.group === nodes[i].group && node.id !== i);
    const targetCount = 2 + Math.floor(Math.random() * 3);

    for (let c = 0; c < targetCount; c++) {
      const target = sameGroup[Math.floor(Math.random() * sameGroup.length)];
      if (target) addLink(i, target.id);
    }
  }

  for (let group = 0; group < numGroups; group++) {
    const groupNodes = nodes.filter((node) => node.group === group);
    const hubs = [...groupNodes]
      .sort((a, b) => b.val - a.val)
      .slice(0, Math.max(2, Math.floor(groupNodes.length / 8)));

    groupNodes.forEach((node) => {
      hubs.forEach((hub) => {
        if (node.id !== hub.id && Math.random() < 0.46) addLink(node.id, hub.id);
      });
    });
  }

  for (let i = 0; i < numGroups; i++) {
    const currentGroupNodes = nodes.filter((node) => node.group === i);
    const nextGroupNodes = nodes.filter((node) => node.group === (i + 1) % numGroups);
    const bridges = 2 + Math.floor(Math.random() * 2);

    for (let b = 0; b < bridges; b++) {
      const source = currentGroupNodes[Math.floor(Math.random() * currentGroupNodes.length)];
      const target = nextGroupNodes[Math.floor(Math.random() * nextGroupNodes.length)];
      if (source && target) addLink(source.id, target.id);
    }
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const neighborsByNode = new Map(nodes.map((node) => [node.id, []]));
  const linksById = new Map();
  const groupNodeIds = new Map();

  nodes.forEach((node) => {
    if (!groupNodeIds.has(node.group)) groupNodeIds.set(node.group, []);
    groupNodeIds.get(node.group).push(node.id);
  });

  links.forEach((link) => {
    const sourceNode = nodeById.get(link.source);
    const targetNode = nodeById.get(link.target);
    const isBridge = sourceNode.group !== targetNode.group;
    const enrichedLink = {
      ...link,
      sourceId: link.source,
      targetId: link.target,
      isBridge
    };

    linksById.set(link.id, enrichedLink);
    neighborsByNode.get(link.source).push({
      nodeId: link.target,
      linkId: link.id,
      isBridge
    });
    neighborsByNode.get(link.target).push({
      nodeId: link.source,
      linkId: link.id,
      isBridge
    });
  });

  return {
    nodes,
    links,
    meta: {
      nodeById,
      linksById,
      neighborsByNode,
      groupNodeIds
    }
  };
}

function pushNodeEffect(store, nodeId, patch) {
  const existing = store.get(nodeId) || {
    energy: 0,
    dialogueEnergy: 0,
    propagationEnergy: 0,
    receiveEnergy: 0
  };

  existing.energy = Math.max(existing.energy, patch.energy || 0);
  existing.dialogueEnergy = Math.max(existing.dialogueEnergy, patch.dialogueEnergy || 0);
  existing.propagationEnergy = Math.max(existing.propagationEnergy, patch.propagationEnergy || 0);
  existing.receiveEnergy = Math.max(existing.receiveEnergy, patch.receiveEnergy || 0);
  store.set(nodeId, existing);
}

function pushLinkEffect(store, linkId, patch) {
  const existing = store.get(linkId) || {
    energy: 0,
    active: 0,
    particleCount: 0,
    particleWidth: 0,
    particleSpeed: 0,
    colorAlpha: 0.2,
    intensity: 0
  };

  existing.energy = Math.max(existing.energy, patch.energy || 0);
  existing.active = Math.max(existing.active, patch.active || 0);
  existing.particleCount = Math.max(existing.particleCount, patch.particleCount || 0);
  existing.particleWidth = Math.max(existing.particleWidth, patch.particleWidth || 0);
  existing.particleSpeed = Math.max(existing.particleSpeed, patch.particleSpeed || 0);
  existing.colorAlpha = Math.max(existing.colorAlpha, patch.colorAlpha || 0);
  existing.intensity = Math.max(existing.intensity, patch.intensity || 0);
  if (patch.colorBias) existing.colorBias = patch.colorBias;
  store.set(linkId, existing);
}

function mixToWhite(rgb, amount) {
  const mix = clamp(amount, 0, 1);
  return rgb.map((channel) => Math.round(channel + (255 - channel) * mix));
}

export default function MoiraiForceGraph({ width, height }) {
  const wrapperRef = useRef(null);
  const graphRef = useRef();
  const rotationAngleRef = useRef(0);
  const speedMultiplierRef = useRef(1);
  const mouseNdcRef = useRef(new THREE.Vector2(2, 2));
  const pointerWorldRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const intersectionRef = useRef(new THREE.Vector3());
  const conversationsRef = useRef([]);
  const schedulerRef = useRef({ nextConversationAt: 0 });
  const nodeEffectsRef = useRef(new Map());
  const linkEffectsRef = useRef(new Map());
  const clusterLastActiveRef = useRef(new Map());

  const graphData = useMemo(() => generateSocialGraph(120), []);

  const chooseNodeFromGroup = useCallback((group) => {
    const ids = graphData.meta.groupNodeIds.get(group) || [];
    if (!ids.length) return null;
    return ids[Math.floor(Math.random() * ids.length)];
  }, [graphData]);

  const buildDialogueHops = useCallback((startNodeId, startAt) => {
    const hops = [];
    const visited = new Set([startNodeId]);
    let cursor = startAt;
    let currentNodeId = startNodeId;
    const currentNode = graphData.meta.nodeById.get(startNodeId);
    const chainLength = randInt(2, 5);

    for (let step = 0; step < chainLength; step++) {
      const previousNodeId = currentNodeId;
      const candidates = (graphData.meta.neighborsByNode.get(currentNodeId) || [])
        .filter((neighbor) => !neighbor.isBridge)
        .sort(() => Math.random() - 0.5);
      const nextNeighbor = candidates.find((neighbor) => !visited.has(neighbor.nodeId)) || candidates[0];

      if (!nextNeighbor) break;

      const duration = randRange(620, 860);
      const gap = randRange(130, 220);
      const targetNode = graphData.meta.nodeById.get(nextNeighbor.nodeId);

      hops.push({
        id: `dialogue-${previousNodeId}-${nextNeighbor.nodeId}-${cursor}`,
        sourceId: previousNodeId,
        targetId: nextNeighbor.nodeId,
        linkId: nextNeighbor.linkId,
        startAt: cursor,
        endAt: cursor + duration,
        lane: 'dialogue',
        colorGroup: currentNode.group,
        particleCount: 1,
        particleWidth: randRange(0.56, 0.82),
        particleSpeed: randRange(0.0034, 0.0052),
        particleAlpha: randRange(0.68, 0.84)
      });

      visited.add(nextNeighbor.nodeId);
      currentNodeId = nextNeighbor.nodeId;
      cursor += duration + gap;

      if (step >= 1 && Math.random() < 0.28) {
        const replyDuration = randRange(560, 760);
        const replyStart = cursor - randRange(60, 110);
        hops.push({
          id: `reply-${nextNeighbor.nodeId}-${previousNodeId}-${replyStart}`,
          sourceId: nextNeighbor.nodeId,
          targetId: previousNodeId,
          linkId: nextNeighbor.linkId,
          startAt: replyStart,
          endAt: replyStart + replyDuration,
          lane: 'dialogue',
          colorGroup: targetNode.group,
          particleCount: 1,
          particleWidth: randRange(0.52, 0.76),
          particleSpeed: randRange(0.0032, 0.0048),
          particleAlpha: randRange(0.62, 0.8)
        });
      }
    }

    return hops;
  }, [graphData]);

  const buildPropagationHops = useCallback((seedNodeId, startAt) => {
    const propagationHops = [];
    const bridgeCandidates = (graphData.meta.neighborsByNode.get(seedNodeId) || [])
      .filter((neighbor) => neighbor.isBridge)
      .sort(() => Math.random() - 0.5)
      .slice(0, randInt(1, 2));

    let cursor = startAt;

    bridgeCandidates.forEach((bridgeNeighbor, bridgeIndex) => {
      const targetNode = graphData.meta.nodeById.get(bridgeNeighbor.nodeId);
      const bridgeStart = cursor + bridgeIndex * randRange(120, 210);
      const bridgeEnd = bridgeStart + randRange(760, 980);

      propagationHops.push({
        id: `bridge-${seedNodeId}-${bridgeNeighbor.nodeId}-${bridgeStart}`,
        sourceId: seedNodeId,
        targetId: bridgeNeighbor.nodeId,
        linkId: bridgeNeighbor.linkId,
        startAt: bridgeStart,
        endAt: bridgeEnd,
        lane: 'propagation',
        colorGroup: graphData.meta.nodeById.get(seedNodeId).group,
        particleCount: 2,
        particleWidth: randRange(0.72, 0.98),
        particleSpeed: randRange(0.0038, 0.0058),
        particleAlpha: randRange(0.78, 0.92)
      });

      const localNeighbors = (graphData.meta.neighborsByNode.get(bridgeNeighbor.nodeId) || [])
        .filter((neighbor) => !neighbor.isBridge && neighbor.nodeId !== seedNodeId)
        .sort(() => Math.random() - 0.5)
        .slice(0, randInt(2, 3));

      localNeighbors.forEach((localNeighbor, localIndex) => {
        const localStart = bridgeEnd - randRange(60, 140) + localIndex * randRange(130, 220);
        propagationHops.push({
          id: `fan-${bridgeNeighbor.nodeId}-${localNeighbor.nodeId}-${localStart}`,
          sourceId: bridgeNeighbor.nodeId,
          targetId: localNeighbor.nodeId,
          linkId: localNeighbor.linkId,
          startAt: localStart,
          endAt: localStart + randRange(680, 930),
          lane: 'propagation',
          colorGroup: targetNode.group,
          particleCount: randInt(1, 2),
          particleWidth: randRange(0.62, 0.88),
          particleSpeed: randRange(0.0035, 0.0054),
          particleAlpha: randRange(0.74, 0.9)
        });
      });

      cursor = bridgeEnd + randRange(140, 220);
    });

    return propagationHops;
  }, [graphData]);

  const startConversation = useCallback((now) => {
    const clusterEntries = Array.from(graphData.meta.groupNodeIds.keys()).map((group) => ({
      group,
      lastActive: clusterLastActiveRef.current.get(group) || 0
    }));
    clusterEntries.sort((a, b) => a.lastActive - b.lastActive);

    const selectedCluster = clusterEntries.slice(0, 3)[Math.floor(Math.random() * Math.min(3, clusterEntries.length))];
    const startNodeId = chooseNodeFromGroup(selectedCluster.group);
    if (startNodeId == null) return;

    const dialogueStart = now + randRange(120, 260);
    const dialogueHops = buildDialogueHops(startNodeId, dialogueStart);
    if (!dialogueHops.length) return;

    let allHops = [...dialogueHops];
    const lastDialogueHop = dialogueHops[dialogueHops.length - 1];

    if (Math.random() < 0.38) {
      const seedNodeId = lastDialogueHop.targetId;
      const propagationStart = lastDialogueHop.endAt + randRange(180, 320);
      allHops = allHops.concat(buildPropagationHops(seedNodeId, propagationStart));
    }

    const groupsTouched = new Set(
      allHops.flatMap((hop) => [
        graphData.meta.nodeById.get(hop.sourceId).group,
        graphData.meta.nodeById.get(hop.targetId).group
      ])
    );

    groupsTouched.forEach((group) => {
      clusterLastActiveRef.current.set(group, now);
    });

    const conversationEndsAt =
      Math.max(...allHops.map((hop) => hop.endAt)) + AFTERGLOW_MS;

    conversationsRef.current.push({
      id: `conversation-${now}`,
      startNodeId,
      endsAt: conversationEndsAt,
      hops: allHops
    });
  }, [buildDialogueHops, buildPropagationHops, chooseNodeFromGroup, graphData]);

  useEffect(() => {
    if (!graphRef.current) return;

    schedulerRef.current.nextConversationAt = performance.now() + 280;

    const timer = window.setTimeout(() => {
      const graph = graphRef.current;
      if (!graph) return;

      graph.d3Force('charge').strength(-68);
      graph.d3Force('link').distance((link) => (link.isBridge ? 78 : 42));
      graph.d3Force('center').strength(0.22);

      const renderer = graph.renderer?.();
      if (renderer) renderer.setClearColor(0xffffff, 1);

      const controls = graph.controls();
      if (controls) {
        controls.enableZoom = false;
        controls.enablePan = false;
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let animationFrameId;

    const orbit = () => {
      if (graphRef.current) {
        graphRef.current.cameraPosition({
          x: ZOOM_DISTANCE * Math.sin(rotationAngleRef.current),
          z: ZOOM_DISTANCE * Math.cos(rotationAngleRef.current)
        });
        rotationAngleRef.current += BASE_ROTATION_SPEED * speedMultiplierRef.current;
      }

      animationFrameId = requestAnimationFrame(orbit);
    };

    orbit();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleNodeHover = useCallback((node) => {
    speedMultiplierRef.current = node ? 0.62 : 1;
  }, []);

  const nodeColor = useCallback((node) => {
    const base = GROUP_COLORS[node.group % GROUP_COLORS.length];
    const effect = nodeEffectsRef.current.get(node.id);
    const boost = effect
      ? clamp(effect.dialogueEnergy * 0.22 + effect.propagationEnergy * 0.34 + effect.receiveEnergy * 0.2, 0, 0.58)
      : 0;
    const [r, g, b] = mixToWhite(base, boost);
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const nodeVal = useCallback((node) => {
    const effect = nodeEffectsRef.current.get(node.id);
    const emphasis = effect ? effect.energy * 0.62 + effect.receiveEnergy * 0.26 : 0;
    return Math.max(1.1, node.val * 0.34 + emphasis);
  }, []);

  const linkColor = useCallback((link) => {
    const source = typeof link.source === 'object' ? link.source : graphData.meta.nodeById.get(link.source);
    const base = GROUP_COLORS[source.group % GROUP_COLORS.length];
    const effect = linkEffectsRef.current.get(link.id);
    const alpha = effect ? clamp(0.18 + effect.energy * 0.48, 0.18, 0.68) : 0.22;
    const tint = effect ? clamp(effect.intensity * 0.3, 0, 0.3) : 0;
    const [r, g, b] = mixToWhite(base, tint);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, [graphData]);

  const linkWidth = useCallback((link) => {
    const effect = linkEffectsRef.current.get(link.id);
    return 0.42 + (effect ? effect.energy * 1.05 : 0);
  }, []);

  const linkDirectionalParticles = useCallback((link) => {
    return linkEffectsRef.current.get(link.id)?.particleCount ?? 0;
  }, []);

  const linkDirectionalParticleWidth = useCallback((link) => {
    return linkEffectsRef.current.get(link.id)?.particleWidth ?? 0;
  }, []);

  const linkDirectionalParticleColor = useCallback((link) => {
    const source = typeof link.source === 'object' ? link.source : graphData.meta.nodeById.get(link.source);
    const base = GROUP_COLORS[source.group % GROUP_COLORS.length];
    const effect = linkEffectsRef.current.get(link.id);
    const alpha = effect?.colorAlpha ?? 0.76;
    const [r, g, b] = mixToWhite(base, effect?.intensity ? effect.intensity * 0.22 : 0.08);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, [graphData]);

  const linkDirectionalParticleSpeed = useCallback((link) => {
    return linkEffectsRef.current.get(link.id)?.particleSpeed ?? 0;
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handlePointerMove = (event) => {
      const rect = wrapper.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNdcRef.current.set(x, y);
    };

    const handlePointerLeave = () => {
      mouseNdcRef.current.set(2, 2);
      pointerWorldRef.current = null;
    };

    wrapper.addEventListener('pointermove', handlePointerMove);
    wrapper.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      wrapper.removeEventListener('pointermove', handlePointerMove);
      wrapper.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef}>
      <ForceGraph3D
        ref={graphRef}
        width={width}
        height={height}
        graphData={graphData}
        rendererConfig={{ alpha: false, antialias: true }}
        backgroundColor="#ffffff"
        showNavInfo={false}
        onNodeHover={handleNodeHover}
        enableNodeDrag={false}
        enableNavigationControls={false}
        nodeLabel={null}
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        nodeResolution={8}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={1}
        linkCurvature={0.06}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleWidth={linkDirectionalParticleWidth}
        linkDirectionalParticleColor={linkDirectionalParticleColor}
        linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
        enableZoom={false}
        d3AlphaDecay={0.038}
        d3VelocityDecay={0.58}
        warmupTicks={110}
        cooldownTime={5000}
        onEngineTick={() => {
          const graph = graphRef.current;
          if (!graph) return;

          const now = performance.now();
          const conversations = conversationsRef.current;
          const scheduler = schedulerRef.current;

          if (
            conversations.length < MAX_CONCURRENT_CONVERSATIONS &&
            now >= scheduler.nextConversationAt
          ) {
            startConversation(now);
            scheduler.nextConversationAt =
              now + randRange(CONVERSATION_GAP_MIN, CONVERSATION_GAP_MAX);
          }

          conversationsRef.current = conversations.filter((conversation) => conversation.endsAt > now);

          const nextNodeEffects = new Map();
          const nextLinkEffects = new Map();

          conversationsRef.current.forEach((conversation) => {
            conversation.hops.forEach((hop) => {
              const laneBoost = hop.lane === 'propagation' ? 1.18 : 1;
              const activePhase = clamp((now - hop.startAt) / Math.max(1, hop.endAt - hop.startAt), 0, 1);
              const preheatProgress = clamp((now - (hop.startAt - PREHEAT_MS)) / PREHEAT_MS, 0, 1);
              const afterglowProgress = clamp((hop.endAt + AFTERGLOW_MS - now) / AFTERGLOW_MS, 0, 1);
              const isPreheating = now >= hop.startAt - PREHEAT_MS && now < hop.startAt;
              const isActive = now >= hop.startAt && now <= hop.endAt;
              const isCooling = now > hop.endAt && now <= hop.endAt + AFTERGLOW_MS;

              if (!isPreheating && !isActive && !isCooling) return;

              const sourceEnergy = isPreheating
                ? preheatProgress * 0.56 * laneBoost
                : isActive
                  ? (0.72 + (1 - activePhase) * 0.22) * laneBoost
                  : afterglowProgress * 0.44;
              const targetEnergy = isPreheating
                ? preheatProgress * 0.12
                : isActive
                  ? Math.sin(activePhase * Math.PI) * 0.94 * laneBoost
                  : afterglowProgress * 0.46;
              const linkEnergy = isPreheating
                ? preheatProgress * 0.22
                : isActive
                  ? (0.48 + Math.sin(activePhase * Math.PI) * 0.72) * laneBoost
                  : afterglowProgress * 0.34;

              pushNodeEffect(nextNodeEffects, hop.sourceId, {
                energy: sourceEnergy,
                dialogueEnergy: hop.lane === 'dialogue' ? sourceEnergy : 0,
                propagationEnergy: hop.lane === 'propagation' ? sourceEnergy : 0,
                receiveEnergy: 0
              });

              pushNodeEffect(nextNodeEffects, hop.targetId, {
                energy: targetEnergy,
                dialogueEnergy: hop.lane === 'dialogue' ? targetEnergy * 0.62 : 0,
                propagationEnergy: hop.lane === 'propagation' ? targetEnergy * 0.8 : 0,
                receiveEnergy: targetEnergy
              });

              pushLinkEffect(nextLinkEffects, hop.linkId, {
                energy: linkEnergy,
                active: isActive ? 1 : 0,
                particleCount: isActive ? hop.particleCount : 0,
                particleWidth: isActive ? hop.particleWidth : 0,
                particleSpeed: isActive ? hop.particleSpeed : 0,
                colorAlpha: hop.particleAlpha,
                intensity: hop.lane === 'propagation' ? linkEnergy * 1.1 : linkEnergy * 0.78
              });
            });
          });

          nodeEffectsRef.current = nextNodeEffects;
          linkEffectsRef.current = nextLinkEffects;

          const camera = graph.camera();
          if (!camera) return;

          raycasterRef.current.setFromCamera(mouseNdcRef.current, camera);
          const hit = raycasterRef.current.ray.intersectPlane(
            planeRef.current,
            intersectionRef.current
          );

          if (!hit) {
            pointerWorldRef.current = null;
            return;
          }

          pointerWorldRef.current = {
            x: intersectionRef.current.x,
            y: intersectionRef.current.y,
            z: intersectionRef.current.z
          };

          graphData.nodes.forEach((node) => {
            const dx = node.x - pointerWorldRef.current.x;
            const dy = node.y - pointerWorldRef.current.y;
            const distance = Math.hypot(dx, dy);

            if (!distance || distance > POINTER_REPEL_RADIUS) return;

            const nodeEffect = nodeEffectsRef.current.get(node.id);
            const suppression = nodeEffect ? 1 - clamp(nodeEffect.energy * 0.42, 0, 0.42) : 1;
            const influence =
              (1 - distance / POINTER_REPEL_RADIUS) *
              POINTER_REPEL_STRENGTH *
              suppression;

            node.vx = (node.vx || 0) + (dx / distance) * influence;
            node.vy = (node.vy || 0) + (dy / distance) * influence;
          });
        }}
      />
    </div>
  );
}
