'use client';

import React, { useEffect, useRef } from 'react';
import createGlobe, { COBEOptions } from 'cobe';

interface GlobeProps {
  className?: string;
  mousePosition?: { x: number; y: number };
}

export const Globe: React.FC<GlobeProps> = ({ className = '', mousePosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseDeltaRef = useRef<number>(0);

  // Smoothly track mouse subtle nudge
  useEffect(() => {
    if (mousePosition) {
      // Map normalized mouse X (-0.5 to 0.5) to subtle radian nudge (-0.25 to 0.25)
      const targetNudge = mousePosition.x * 0.35;
      mouseDeltaRef.current = targetNudge;
    }
  }, [mousePosition]);

  useEffect(() => {
    let width = 0;
    let currentPhi = 0;
    let smoothNudge = 0;
    let animationFrameId: number;
    let globe: ReturnType<typeof createGlobe> | null = null;

    const getMeasuredWidth = () => {
      if (!canvasRef.current) return 360;
      return (
        canvasRef.current.offsetWidth ||
        canvasRef.current.clientWidth ||
        canvasRef.current.parentElement?.clientWidth ||
        360
      );
    };

    width = getMeasuredWidth();

    const onResize = () => {
      width = getMeasuredWidth();
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
      if (globe && width > 0) {
        globe.update({
          width: width * dpr,
          height: width * dpr,
        });
      }
    };
    window.addEventListener('resize', onResize);

    // Respect accessibility: prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canvasRef.current) {
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
      const initialSize = width > 0 ? width : 360;

      const options: COBEOptions = {
        devicePixelRatio: dpr,
        width: initialSize * dpr,
        height: initialSize * dpr,
        phi: 0,
        theta: 0.20,
        dark: 1,
        diffuse: 1.16,
        mapSamples: 16000,
        mapBrightness: 4.15, // Calibrated down ~12% for breathing room
        baseColor: [0.06, 0.09, 0.16], // Slate / deep-space subtle base
        markerColor: [0.05, 0.70, 0.85], // Calibrated luminous cyan (subtle, elegant)
        glowColor: [0.06, 0.36, 0.62], // Soft atmospheric limb glow (not overpowering)
        opacity: 0.82,
        markers: [
          { location: [4.711, -74.0721], size: 0.045 }, // Bogotá (anchor)
          { location: [37.7749, -122.4194], size: 0.038 }, // San Francisco
          { location: [40.7128, -74.006], size: 0.04 }, // New York
          { location: [40.4168, -3.7038], size: 0.034 }, // Madrid
          { location: [35.6762, 139.6503], size: 0.038 }, // Tokyo
          { location: [-23.5505, -46.6333], size: 0.035 }, // São Paulo
        ],
        // Arcos calibrados: 2 órbitas principales elegantes y 2 sutiles secundarias
        arcs: [
          // Órbita Principal 1: Bogotá -> San Francisco
          { from: [4.711, -74.0721], to: [37.7749, -122.4194] },
          // Órbita Principal 2: New York -> Madrid
          { from: [40.7128, -74.006], to: [40.4168, -3.7038] },
          // Órbita Secundaria: San Francisco -> Tokyo
          { from: [37.7749, -122.4194], to: [35.6762, 139.6503] },
          // Órbita Secundaria: São Paulo -> Madrid
          { from: [-23.5505, -46.6333], to: [40.4168, -3.7038] },
        ],
        arcColor: [0.05, 0.68, 0.84], // Calibrado 25% menos saturado (elegante, no neón)
        arcWidth: 0.44, // Reducido ~30% respecto a 0.65
        arcHeight: 0.22,
      };

      globe = createGlobe(canvasRef.current, options);

      // Animation render loop
      const render = () => {
        if (!prefersReducedMotion) {
          currentPhi += 0.0016;
        }

        // Smooth lerp for subtle mouse interaction
        smoothNudge += (mouseDeltaRef.current - smoothNudge) * 0.05;

        if (globe) {
          globe.update({
            phi: currentPhi + smoothNudge,
          });
        }

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (globe) {
        globe.destroy();
      }
    };
  }, []);

  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Planetary Atmospheric Limb Halo calibrado (suave, sin saturar) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.16) 0%, rgba(14, 165, 233, 0.06) 45%, transparent 70%)',
          filter: 'blur(30px)',
          transform: 'scale(1.04)',
        }}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full aspect-square pointer-events-none relative z-0"
        style={{
          contain: 'layout paint size',
        }}
      />
    </div>
  );
};
