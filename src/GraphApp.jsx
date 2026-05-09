import React, { useState, useEffect, useRef } from 'react';
import MoiraiForceGraph from './ForceGraph';

export default function GraphApp() {
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    // Listen for the initialize event from main.js
    const handler = () => {
      setIsActive(true);
    };
    window.addEventListener('moirai-initialize', handler);

    // Measure container
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    measure();
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('moirai-initialize', handler);
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Re-measure when visibility changes
  useEffect(() => {
    if (isActive && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: isActive ? 1 : 0.5, // visible initially
        transition: 'opacity 2s ease-in-out',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      <MoiraiForceGraph
        width={dimensions.width}
        height={dimensions.height}
        isActive={isActive}
      />
    </div>
  );
}
