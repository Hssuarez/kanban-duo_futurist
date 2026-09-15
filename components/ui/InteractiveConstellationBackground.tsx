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

interface DeepStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
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
    let deepStars: DeepStar[] = [];
    let ripplePhase = 0;

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

      // 1. Deep Cosmic Micro-Stars (Background stardust field for galactic depth)
      const deepStarCount = width < 640 ? 45 : width < 1024 ? 75 : 110;
      deepStars = [];
      for (let i = 0; i < deepStarCount; i++) {
        deepStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.5 + Math.random() * 0.6, // 0.5 - 1.1px
          baseAlpha: 0.12 + Math.random() * 0.22, // 0.12 - 0.34
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.01 + Math.random() * 0.02,
        });
      }

      // 2. Interactive Constellation Nodes (Anchors & Beacons)
      let nodeCount = 76;
      if (width < 640) {
        nodeCount = 28;
      } else if (width < 1024) {
        nodeCount = 50;
      }

      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const randType = Math.random();
        const colorType: 'cyan' | 'white' | 'slate' =
          randType < 0.42 ? 'cyan' : randType < 0.76 ? 'white' : 'slate';

        // Calibrated baseline visibility at rest (crisp and visible without glare)
        const baseAlpha =
          colorType === 'cyan'
            ? 0.36 + Math.random() * 0.22 // 0.36 - 0.58
            : colorType === 'white'
            ? 0.30 + Math.random() * 0.20 // 0.30 - 0.50
            : 0.20 + Math.random() * 0.14; // 0.20 - 0.34

        // Sizing for hierarchy: cyan beacons stand out proudly
        const radius =
          colorType === 'cyan'
            ? 1.6 + Math.random() * 0.9 // 1.6 - 2.5px
            : colorType === 'white'
            ? 1.3 + Math.random() * 0.8 // 1.3 - 2.1px
            : 1.0 + Math.random() * 0.7; // 1.0 - 1.7px

        // Gentle ambient drift
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
    const maxConnectionDist = width < 640 ? 85 : 125;
    const radialInfluenceRadius = width < 640 ? 115 : 170;

    // 60FPS Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Ripple animation phase for radar pulses
      ripplePhase += 0.022;

      // 0. Ambient Cosmic Nebula Dust (Subtle cyan cloud on left & center)
      if (width > 600) {
        const nebulaGrad = ctx.createRadialGradient(
          width * 0.22,
          height * 0.38,
          0,
          width * 0.22,
          height * 0.38,
          width * 0.42
        );
        nebulaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
        nebulaGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.025)');
        nebulaGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 1. Render Deep Cosmic Micro-Stars (Background stardust layer)
      for (let i = 0; i < deepStars.length; i++) {
        const star = deepStars[i];
        if (!prefersReducedMotion) {
          star.twinklePhase += star.twinkleSpeed;
        }
        const twinkle = Math.sin(star.twinklePhase) * 0.08;
        const starAlpha = Math.max(0.04, Math.min(0.45, star.baseAlpha + twinkle));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${starAlpha})`;
        ctx.fill();
      }

      const mouse = mousePosRef.current;
      let primaryActiveNode = null;
      let highestBoost = 0;

      // 2. Update node positions, ambient flares & radial mouse influence
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          // Wrap edges smoothly
          if (node.x < -15) node.x = width + 15;
          if (node.x > width + 15) node.x = -15;
          if (node.y < -15) node.y = height + 15;
          if (node.y > height + 15) node.y = -15;

          // Staggered random ambient flare (1-2 stars gently flare across the sky)
          if (node.flareTimer > 0) {
            node.flareTimer--;
          } else if (Math.random() < 0.0006) {
            node.flareTarget = 0.28 + Math.random() * 0.18;
            node.flareTimer = 180 + Math.floor(Math.random() * 300);
          }

          if (node.ambientFlare >= node.flareTarget - 0.02) {
            node.flareTarget = 0;
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
            targetBoost = rawInfluence * rawInfluence * (3 - 2 * rawInfluence);
          }
        }

        // Organic lerp factor: fast smooth fade-in (0.12), delayed lingering fade-out (0.04)
        const lerpFactor = targetBoost > node.interactiveBoost ? 0.12 : 0.04;
        node.interactiveBoost += (targetBoost - node.interactiveBoost) * lerpFactor;

        if (node.interactiveBoost > highestBoost) {
          highestBoost = node.interactiveBoost;
          primaryActiveNode = node;
        }

        // Effective alpha and scale
        const totalAlpha =
          node.baseAlpha +
          node.ambientFlare +
          node.interactiveBoost * 0.45;

        node.currentAlpha = Math.min(totalAlpha, 0.98);
        const scale = 1 + node.interactiveBoost * 0.75;

        // Draw soft aura around highlighted nodes
        if (node.interactiveBoost > 0.3 || node.ambientFlare > 0.12) {
          const auraRadius = node.radius * scale * 3.8;
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
              ? 'rgba(6, 182, 212, 0.32)'
              : 'rgba(255, 255, 255, 0.22)'
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

      // 3. Draw connections between nearby nodes (Geometric constellation network)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDist) {
            // Visible baseline connection at rest (0.05 - 0.13)
            const baseLineAlpha = (1 - dist / maxConnectionDist) * 0.12;

            // Connection smoothly intensifies via nodes' lerped interactiveBoost
            const connectionBoost = Math.max(a.interactiveBoost, b.interactiveBoost);
            const lineAlpha = baseLineAlpha + connectionBoost * 0.38;

            if (lineAlpha > 0.02) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);

              if (a.colorType === 'cyan' || b.colorType === 'cyan') {
                ctx.strokeStyle = `rgba(6, 182, 212, ${Math.min(lineAlpha, 0.58)})`;
              } else {
                ctx.strokeStyle = `rgba(148, 163, 184, ${Math.min(lineAlpha, 0.42)})`;
              }

              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }
      }

      // 4. RADAR PULSE / RIPPLE RINGS (Signature effect matching the reference image)
      // When cursor nears a star, concentric radar wave rings expand gently from the active beacon
      if (primaryActiveNode && highestBoost > 0.25 && !prefersReducedMotion) {
        const ringNode = primaryActiveNode;
        const maxRadius = 38;

        // Draw 2 concentric expanding radar ripple rings
        for (let r = 0; r < 2; r++) {
          const progress = (ripplePhase * 0.55 + r * 0.5) % 1;
          const ringRadius = ringNode.radius + progress * maxRadius;
          const ringAlpha = (1 - progress) * 0.42 * highestBoost;

          if (ringAlpha > 0.01) {
            ctx.beginPath();
            ctx.arc(ringNode.x, ringNode.y, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(6, 182, 212, ${ringAlpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      // 5. Dynamic connection beam from cursor to closest star
      if (mouse && !prefersReducedMotion && primaryActiveNode && highestBoost > 0.35) {
        const distToActive = Math.hypot(primaryActiveNode.x - mouse.x, primaryActiveNode.y - mouse.y);
        if (distToActive < 120) {
          const beamAlpha = (1 - distToActive / 120) * 0.25 * highestBoost;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(primaryActiveNode.x, primaryActiveNode.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${beamAlpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
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
        isDimmed ? 'opacity-40' : 'opacity-95'
      } ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
    </div>
  );
};
