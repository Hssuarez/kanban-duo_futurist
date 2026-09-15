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
  pulsePhase: number;
  pulseSpeed: number;
  colorType: 'cyan' | 'white' | 'slate';
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

      // Determine density based on viewport size (moderate, never crowded)
      let nodeCount = 70;
      if (width < 640) {
        nodeCount = 24;
      } else if (width < 1024) {
        nodeCount = 44;
      }

      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const randType = Math.random();
        const colorType: 'cyan' | 'white' | 'slate' =
          randType < 0.35 ? 'cyan' : randType < 0.7 ? 'white' : 'slate';

        const baseAlpha =
          colorType === 'cyan'
            ? 0.22 + Math.random() * 0.18
            : colorType === 'white'
            ? 0.18 + Math.random() * 0.18
            : 0.10 + Math.random() * 0.12;

        // Very slow, ambient organic drift
        const speedMultiplier = prefersReducedMotion ? 0 : 0.06 + Math.random() * 0.07;
        const angle = Math.random() * Math.PI * 2;

        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speedMultiplier,
          vy: Math.sin(angle) * speedMultiplier,
          radius: 1.0 + Math.random() * 1.1,
          baseAlpha,
          currentAlpha: baseAlpha,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.01 + Math.random() * 0.015,
          colorType,
        });
      }
    };

    initNodes();

    // Mouse tracking on window (Zero React re-renders)
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
    const maxConnectionDist = width < 640 ? 75 : 110;
    const radialInfluenceRadius = width < 640 ? 100 : 155;

    // 60FPS Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mousePosRef.current;

      // 1. Update node positions & ambient pulse
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

          // Ambient subtle twinkle
          node.pulsePhase += node.pulseSpeed;
        }

        const twinkle = Math.sin(node.pulsePhase) * 0.06;
        let targetAlpha = node.baseAlpha + twinkle;
        let scale = 1;

        // Radial influence from mouse
        if (mouse) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radialInfluenceRadius) {
            const influence = 1 - dist / radialInfluenceRadius;
            // Smooth ease-out curve for influence
            const smoothInfluence = influence * influence * (3 - 2 * influence);
            targetAlpha += smoothInfluence * 0.52;
            scale += smoothInfluence * 0.8;

            // Draw faint aura around nodes closest to cursor
            if (smoothInfluence > 0.4) {
              const auraRadius = (node.radius * scale) * 3.5;
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
                  ? 'rgba(6, 182, 212, 0.25)'
                  : 'rgba(255, 255, 255, 0.18)'
              );
              auraGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

              ctx.beginPath();
              ctx.arc(node.x, node.y, auraRadius, 0, Math.PI * 2);
              ctx.fillStyle = auraGrad;
              ctx.fill();
            }
          }
        }

        node.currentAlpha = targetAlpha;

        // Draw star node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * scale, 0, Math.PI * 2);

        if (node.colorType === 'cyan') {
          ctx.fillStyle = `rgba(6, 182, 212, ${Math.min(node.currentAlpha, 0.95)})`;
        } else if (node.colorType === 'white') {
          ctx.fillStyle = `rgba(240, 244, 248, ${Math.min(node.currentAlpha, 0.9)})`;
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${Math.min(node.currentAlpha, 0.7)})`;
        }
        ctx.fill();
      }

      // 2. Draw connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDist) {
            let lineAlpha = (1 - dist / maxConnectionDist) * 0.10;

            // Check if connection is within mouse radial influence
            if (mouse) {
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              const distToMouse = Math.hypot(midX - mouse.x, midY - mouse.y);

              if (distToMouse < radialInfluenceRadius) {
                const mouseInfluence = 1 - distToMouse / radialInfluenceRadius;
                lineAlpha += mouseInfluence * 0.30;
              }
            }

            if (lineAlpha > 0.02) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);

              // Use Cyan tint if either node is cyan, otherwise subtle slate
              if (a.colorType === 'cyan' || b.colorType === 'cyan') {
                ctx.strokeStyle = `rgba(6, 182, 212, ${Math.min(lineAlpha, 0.50)})`;
              } else {
                ctx.strokeStyle = `rgba(148, 163, 184, ${Math.min(lineAlpha, 0.35)})`;
              }

              ctx.lineWidth = 0.6;
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
          const cursorConnectionLimit = 105;

          if (dist < cursorConnectionLimit) {
            const alpha = (1 - dist / cursorConnectionLimit) * 0.20;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
            connectionCount++;
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
        isDimmed ? 'opacity-30' : 'opacity-80'
      } ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
    </div>
  );
};
