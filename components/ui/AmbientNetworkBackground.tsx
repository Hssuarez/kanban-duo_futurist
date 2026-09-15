'use client';

import React, { useEffect, useRef } from 'react';
import { AppView } from '@/lib/types';

interface AmbientNetworkBackgroundProps {
  className?: string;
  variant?: AppView;
}

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: 'cyan' | 'slate' | 'white';
}

interface SignalPacket {
  nodeAIndex: number;
  nodeBIndex: number;
  progress: number; // 0 to 1
  speed: number;
  state: 'idle' | 'traveling';
  pauseTimer: number;
}

export const AmbientNetworkBackground: React.FC<AmbientNetworkBackgroundProps> = ({
  className = '',
  variant = 'board',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let nodes: NetworkNode[] = [];
    const maxSignals = 2;
    let signals: SignalPacket[] = [];

    let mouseX = -1000;
    let mouseY = -1000;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initNetwork = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Generate peripheral micro-constellations (prioritizing corners and outer margins)
      nodes = [];
      const clusters =
        width < 640
          ? [
              { cx: width * 0.12, cy: height * 0.16, count: 4 },
              { cx: width * 0.88, cy: height * 0.84, count: 4 },
            ]
          : width < 1024
          ? [
              { cx: width * 0.08, cy: height * 0.18, count: 4 },
              { cx: width * 0.92, cy: height * 0.20, count: 4 },
              { cx: width * 0.09, cy: height * 0.80, count: 4 },
              { cx: width * 0.91, cy: height * 0.82, count: 4 },
            ]
          : [
              { cx: width * 0.06, cy: height * 0.16, count: 5 }, // Top-Left corner
              { cx: width * 0.94, cy: height * 0.18, count: 5 }, // Top-Right corner
              { cx: width * 0.05, cy: height * 0.78, count: 5 }, // Bottom-Left margin
              { cx: width * 0.95, cy: height * 0.82, count: 5 }, // Bottom-Right margin
              { cx: width * 0.50, cy: height * 0.03, count: 3 }, // Very top edge negative space
            ];

      for (const cluster of clusters) {
        for (let i = 0; i < cluster.count; i++) {
          const rand = Math.random();
          const color: 'cyan' | 'slate' | 'white' =
            rand < 0.4 ? 'cyan' : rand < 0.75 ? 'slate' : 'white';

          // Low, quiet base opacity
          const baseAlpha =
            color === 'cyan'
              ? 0.18 + Math.random() * 0.12 // 0.18 - 0.30
              : color === 'white'
              ? 0.13 + Math.random() * 0.09 // 0.13 - 0.22
              : 0.08 + Math.random() * 0.07; // 0.08 - 0.15

          const radius =
            color === 'cyan'
              ? 1.3 + Math.random() * 0.6 // 1.3 - 1.9px
              : color === 'white'
              ? 1.1 + Math.random() * 0.5 // 1.1 - 1.6px
              : 0.8 + Math.random() * 0.4; // 0.8 - 1.2px

          const speed = prefersReducedMotion ? 0 : 0.012 + Math.random() * 0.02;
          const angle = Math.random() * Math.PI * 2;
          const distFromCenter = 15 + Math.random() * 60;
          const clusterAngle = Math.random() * Math.PI * 2;

          nodes.push({
            x: Math.max(10, Math.min(width - 10, cluster.cx + Math.cos(clusterAngle) * distFromCenter)),
            y: Math.max(10, Math.min(height - 10, cluster.cy + Math.sin(clusterAngle) * distFromCenter)),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius,
            baseAlpha,
            color,
          });
        }
      }

      // Initialize staggered signal packets (max 2, slow, with long pauses)
      signals = [
        {
          nodeAIndex: 0,
          nodeBIndex: 1,
          progress: 0,
          speed: 0.0055,
          state: 'idle',
          pauseTimer: 60,
        },
        {
          nodeAIndex: 2,
          nodeBIndex: 3,
          progress: 0,
          speed: 0.0048,
          state: 'idle',
          pauseTimer: 240,
        },
      ];
    };

    initNetwork();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    if (width >= 1024 && !prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    const handleResize = () => {
      initNetwork();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const maxDist = width < 640 ? 75 : 90;

    // Helper: Find valid connected node pair
    const pickConnectedPair = (): [number, number] | null => {
      if (nodes.length < 2) return null;
      for (let attempt = 0; attempt < 25; attempt++) {
        const a = Math.floor(Math.random() * nodes.length);
        const b = Math.floor(Math.random() * nodes.length);
        if (a === b) continue;
        const dist = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
        if (dist < maxDist) {
          return [a, b];
        }
      }
      return null;
    };

    // 60FPS Render Loop: Zero global parallax, subtle peripheral resonance
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isMouseInWindow = mouseX >= 0 && mouseY >= 0;
      const distToEdge = isMouseInWindow
        ? Math.min(mouseX, width - mouseX, mouseY, height - mouseY)
        : 9999;
      const isNearPeriphery = distToEdge < 140;

      // 1. Update & Render Nodes (strictly fixed in space, zero parallax offset)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          // Wrap edges softly
          if (node.x < -10) node.x = width + 10;
          if (node.x > width + 10) node.x = -10;
          if (node.y < -10) node.y = height + 10;
          if (node.y > height + 10) node.y = -10;
        }

        const isPeripheralNode =
          node.x < width * 0.22 ||
          node.x > width * 0.78 ||
          node.y < height * 0.22 ||
          node.y > height * 0.78;

        // Peripheral resonance boost when cursor approaches screen edges
        let peripheralBoost = 0;
        if (isNearPeriphery && isPeripheralNode && !prefersReducedMotion) {
          peripheralBoost = (1 - distToEdge / 140) * 0.24;
        }

        // Local cursor proximity boost
        let localMouseBoost = 0;
        if (isMouseInWindow && !prefersReducedMotion) {
          const distMouse = Math.hypot(node.x - mouseX, node.y - mouseY);
          if (distMouse < 110) {
            localMouseBoost = (1 - distMouse / 110) * 0.22;
          }
        }

        const effectiveAlpha = Math.min(0.8, node.baseAlpha + peripheralBoost + localMouseBoost);
        const totalBoost = peripheralBoost + localMouseBoost;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (1 + totalBoost * 0.35), 0, Math.PI * 2);
        if (node.color === 'cyan') {
          ctx.fillStyle = `rgba(6, 182, 212, ${effectiveAlpha})`;
        } else if (node.color === 'white') {
          ctx.fillStyle = `rgba(244, 244, 245, ${effectiveAlpha})`;
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${effectiveAlpha * 0.8})`;
        }
        ctx.fill();
      }

      // 2. Draw Faint Geometric Connections (zero offset)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.06;
            if (lineAlpha > 0.008) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(6, 182, 212, ${lineAlpha})`;
              ctx.lineWidth = 0.55;
              ctx.stroke();
            }
          }
        }
      }

      // 3. Network Activity Signals (1-2 occasional packets traveling along short segments)
      if (!prefersReducedMotion) {
        for (let i = 0; i < signals.length; i++) {
          const sig = signals[i];

          if (sig.state === 'idle') {
            sig.pauseTimer--;
            if (sig.pauseTimer <= 0) {
              const pair = pickConnectedPair();
              if (pair) {
                sig.nodeAIndex = pair[0];
                sig.nodeBIndex = pair[1];
                sig.progress = 0;
                sig.speed = 0.004 + Math.random() * 0.003;
                sig.state = 'traveling';
              } else {
                sig.pauseTimer = 60;
              }
            }
          } else if (sig.state === 'traveling') {
            sig.progress += sig.speed;
            const nodeA = nodes[sig.nodeAIndex];
            const nodeB = nodes[sig.nodeBIndex];

            if (nodeA && nodeB) {
              const currentX = nodeA.x + (nodeB.x - nodeA.x) * sig.progress;
              const currentY = nodeA.y + (nodeB.y - nodeA.y) * sig.progress;

              // Draw faint trail
              const trailLength = 0.25;
              const startProg = Math.max(0, sig.progress - trailLength);
              const trailStartX = nodeA.x + (nodeB.x - nodeA.x) * startProg;
              const trailStartY = nodeA.y + (nodeB.y - nodeA.y) * startProg;

              ctx.beginPath();
              ctx.moveTo(trailStartX, trailStartY);
              ctx.lineTo(currentX, currentY);
              ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
              ctx.lineWidth = 0.75;
              ctx.stroke();

              // Draw traveling packet node
              ctx.beginPath();
              ctx.arc(currentX, currentY, 1.8, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(34, 211, 238, 0.85)';
              ctx.fill();

              // Subtle aura
              ctx.beginPath();
              ctx.arc(currentX, currentY, 4.5, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
              ctx.fill();
            }

            if (sig.progress >= 1.0) {
              sig.state = 'idle';
              // Long organic pause (3.5 to 7 seconds)
              sig.pauseTimer = 210 + Math.floor(Math.random() * 240);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (width >= 1024) {
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
    </div>
  );
};
