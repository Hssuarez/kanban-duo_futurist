'use client';

import React, { useEffect, useRef } from 'react';

interface InteractiveConstellationBackgroundProps {
  className?: string;
  isDimmed?: boolean;
}

interface ConstellationNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  currentAlpha: number;
  interactiveBoost: number; // Smooth lerp for radial mouse influence
  pulsePhase: number;
  pulseSpeed: number;
  colorType: 'cyan' | 'white' | 'slate';
  // Staggered random ambient flare (1-2 seconds per node)
  ambientFlare: number;
  flareTarget: number;
  flareTimer: number;
}

export const InteractiveConstellationBackground: React.FC<InteractiveConstellationBackgroundProps> = ({
  className = '',
  isDimmed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let nodes: ConstellationNode[] = [];

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initNodes = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Balanced density based on viewport size (moderate, clean, never noisy)
      let nodeCount = 72;
      if (width < 640) {
        nodeCount = 26;
      } else if (width < 1024) {
        nodeCount = 46;
      }

      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const randType = Math.random();
        const colorType: 'cyan' | 'white' | 'slate' =
          randType < 0.38 ? 'cyan' : randType < 0.72 ? 'white' : 'slate';

        // Increased baseline visibility by ~35% - 45% as requested
        // Clearly perceptible at rest without becoming blinding
        const baseAlpha =
          colorType === 'cyan'
            ? 0.35 + Math.random() * 0.22 // 0.35 - 0.57
            : colorType === 'white'
            ? 0.28 + Math.random() * 0.20 // 0.28 - 0.48
            : 0.18 + Math.random() * 0.14; // 0.18 - 0.32

        // Distinct sizing for anchor and secondary stars
        const radius =
          colorType === 'cyan'
            ? 1.4 + Math.random() * 0.9 // 1.4 - 2.3px
            : colorType === 'white'
            ? 1.2 + Math.random() * 0.8 // 1.2 - 2.0px
            : 0.9 + Math.random() * 0.7; // 0.9 - 1.6px

        // Very slow, ambient organic drift
        const speedMultiplier = prefersReducedMotion ? 0 : 0.05 + Math.random() * 0.06;
        const angle = Math.random() * Math.PI * 2;

        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speedMultiplier,
          vy: Math.sin(angle) * speedMultiplier,
          radius,
          baseAlpha,
          currentAlpha: baseAlpha,
          interactiveBoost: 0,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.012,
          colorType,
          ambientFlare: 0,
          flareTarget: 0,
          flareTimer: Math.floor(Math.random() * 200),
        });
      }
    };

    initNodes();

    // Mouse tracking on window (Zero React re-renders, 60fps)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const handleResize = () => {
      initNodes();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Constants for constellation dynamics
    const maxConnectionDist = width < 640 ? 80 : 115;
    const radialInfluenceRadius = width < 640 ? 110 : 160;

    // 60FPS Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mousePosRef.current;

      // 1. Update node positions, ambient flares & radial mouse influence
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          // Wrap edges smoothly
          if (node.x < -10) node.x = width + 10;
          if (node.x > width + 10) node.x = -10;
          if (node.y < -10) node.y = height + 10;
          if (node.y > height + 10) node.y = -10;

          // Staggered random ambient flare (only 1-2 stars in the entire sky at a time)
          if (node.flareTimer > 0) {
            node.flareTimer--;
          } else if (Math.random() < 0.0006) {
            // Trigger 1-2 second gentle flare
            node.flareTarget = 0.24 + Math.random() * 0.16;
            node.flareTimer = 180 + Math.floor(Math.random() * 300);
          }

          if (node.ambientFlare >= node.flareTarget - 0.02) {
            node.flareTarget = 0; // fade back down
          }

          node.ambientFlare +=
            (node.flareTarget - node.ambientFlare) *
            (node.flareTarget > node.ambientFlare ? 0.025 : 0.012);
        }

        // Calculate radial influence from cursor
        let targetBoost = 0;
        if (mouse) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radialInfluenceRadius) {
            const rawInfluence = 1 - dist / radialInfluenceRadius;
            // Smooth ease-out polynomial
            targetBoost = rawInfluence * rawInfluence * (3 - 2 * rawInfluence);
          }
        }

        // Organic lerp: fast smooth fade-in (0.12), gentle delayed fade-out (0.04)
        const lerpFactor = targetBoost > node.interactiveBoost ? 0.12 : 0.04;
        node.interactiveBoost += (targetBoost - node.interactiveBoost) * lerpFactor;

        // Effective alpha and scale
        const totalAlpha =
          node.baseAlpha +
          node.ambientFlare +
          node.interactiveBoost * 0.45;

        node.currentAlpha = Math.min(totalAlpha, 0.95);
        const scale = 1 + node.interactiveBoost * 0.75;

        // Draw soft aura around closest nodes
        if (node.interactiveBoost > 0.35) {
          const auraRadius = node.radius * scale * 3.4;
          const auraGrad = ctx.createRadialGradient(
            node.x,
            node.y,
            0,
            node.x,
            node.y,
            auraRadius
          );
          auraGrad.addColorStop(
            0,
            node.colorType === 'cyan'
              ? 'rgba(6, 182, 212, 0.28)'
              : 'rgba(255, 255, 255, 0.20)'
          );
          auraGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.beginPath();
          ctx.arc(node.x, node.y, auraRadius, 0, Math.PI * 2);
          ctx.fillStyle = auraGrad;
          ctx.fill();
        }

        // Draw node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * scale, 0, Math.PI * 2);

        if (node.colorType === 'cyan') {
          ctx.fillStyle = `rgba(6, 182, 212, ${node.currentAlpha})`;
        } else if (node.colorType === 'white') {
          ctx.fillStyle = `rgba(240, 244, 248, ${node.currentAlpha})`;
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${node.currentAlpha * 0.85})`;
        }
        ctx.fill();
      }

      // 2. Draw connections between nearby nodes with organic lerp and smooth fade-out
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDist) {
            // Subtle baseline connection at rest (0.04 - 0.12)
            const baseLineAlpha = (1 - dist / maxConnectionDist) * 0.10;

            // Connection smoothly intensifies via the nodes' lerped interactiveBoost
            const connectionBoost = Math.max(a.interactiveBoost, b.interactiveBoost);
            const lineAlpha = baseLineAlpha + connectionBoost * 0.32;

            if (lineAlpha > 0.02) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);

              if (a.colorType === 'cyan' || b.colorType === 'cyan') {
                ctx.strokeStyle = `rgba(6, 182, 212, ${Math.min(lineAlpha, 0.52)})`;
              } else {
                ctx.strokeStyle = `rgba(148, 163, 184, ${Math.min(lineAlpha, 0.38)})`;
              }

              ctx.lineWidth = 0.65;
              ctx.stroke();
            }
          }
        }
      }

      // 3. Faint dynamic connections from cursor to closest nodes
      if (mouse && !prefersReducedMotion) {
        let connectionCount = 0;
        for (let i = 0; i < nodes.length && connectionCount < 3; i++) {
          const node = nodes[i];
          const dist = Math.hypot(node.x - mouse.x, node.y - mouse.y);
          const cursorConnectionLimit = 110;

          if (dist < cursorConnectionLimit) {
            // Use node's smoothed interactiveBoost for smooth line fade
            const alpha = (1 - dist / cursorConnectionLimit) * 0.22 * node.interactiveBoost;
            if (alpha > 0.01) {
              ctx.beginPath();
              ctx.moveTo(mouse.x, mouse.y);
              ctx.lineTo(node.x, node.y);
              ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
              connectionCount++;
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none select-none transition-opacity duration-700 ${
        isDimmed ? 'opacity-35' : 'opacity-90'
      } ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
    </div>
  );
};
