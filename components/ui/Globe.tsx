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
      // Map normalized mouse X (-0.5 to 0.5) to subtle radian nudge (-0.2 to 0.2)
      const targetNudge = mousePosition.x * 0.3;
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
        theta: 0.18,
        dark: 1,
        diffuse: 1.15,
        mapSamples: 12000,
        mapBrightness: 4.2,
        baseColor: [0.10, 0.14, 0.22], // Slate / deep-space subtle base
        markerColor: [0.06, 0.75, 0.88], // KanbanDuo signature Cyan
        glowColor: [0.04, 0.22, 0.32], // Soft atmospheric Cyan glow
        opacity: 0.82,
        markers: [
          { location: [4.711, -74.0721], size: 0.055 }, // Bogotá (Colombia)
          { location: [37.7749, -122.4194], size: 0.04 }, // San Francisco
          { location: [40.4168, -3.7038], size: 0.035 }, // Madrid
          { location: [35.6762, 139.6503], size: 0.04 }, // Tokyo
          { location: [-23.5505, -46.6333], size: 0.035 }, // São Paulo
        ],
        arcs: [
          { from: [4.711, -74.0721], to: [37.7749, -122.4194] }, // Bogotá -> SF
          { from: [4.711, -74.0721], to: [40.4168, -3.7038] }, // Bogotá -> Madrid
        ],
        arcColor: [0.06, 0.75, 0.88],
        arcWidth: 0.5,
        arcHeight: 0.2,
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
      <canvas
        ref={canvasRef}
        className="w-full h-full aspect-square pointer-events-none"
        style={{
          contain: 'layout paint size',
        }}
      />
    </div>
  );
};
