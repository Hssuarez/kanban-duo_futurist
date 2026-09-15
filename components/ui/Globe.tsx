'use client';

import React, { useEffect, useRef } from 'react';
import createGlobe, { COBEOptions, Arc } from 'cobe';

interface GlobeProps {
  className?: string;
  mousePosition?: { x: number; y: number };
}

// Helper: Spherical Great-Circle Interpolation (Slerp) between two [lat, lon] coordinates
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function slerp([lat1, lon1]: [number, number], [lat2, lon2]: [number, number], t: number): [number, number] {
  const phi1 = toRad(lat1);
  const lam1 = toRad(lon1);
  const phi2 = toRad(lat2);
  const lam2 = toRad(lon2);

  const x1 = Math.cos(phi1) * Math.cos(lam1);
  const y1 = Math.cos(phi1) * Math.sin(lam1);
  const z1 = Math.sin(phi1);

  const x2 = Math.cos(phi2) * Math.cos(lam2);
  const y2 = Math.cos(phi2) * Math.sin(lam2);
  const z2 = Math.sin(phi2);

  let dot = x1 * x2 + y1 * y2 + z1 * z2;
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);

  if (omega < 1e-5) return [lat1, lon1];

  const sinOmega = Math.sin(omega);
  const a = Math.sin((1 - t) * omega) / sinOmega;
  const b = Math.sin(t * omega) / sinOmega;

  const x = a * x1 + b * x2;
  const y = a * y1 + b * y2;
  const z = a * z1 + b * z2;

  const lat = toDeg(Math.asin(Math.max(-1, Math.min(1, z))));
  const lon = toDeg(Math.atan2(y, x));

  return [lat, lon];
}

// Active transmission routes across global continents (dedicated channels, separate from static baseline)
const CHANNELS: { from: [number, number]; to: [number, number]; id: string }[] = [
  { from: [4.711, -74.0721], to: [37.7749, -122.4194], id: 'bog-sf' }, // Bogotá -> SF
  { from: [40.7128, -74.006], to: [40.4168, -3.7038], id: 'ny-mad' }, // NY -> Madrid
  { from: [51.5074, -0.1278], to: [1.3521, 103.8198], id: 'lon-sgp' }, // London -> Singapore
  { from: [1.3521, 103.8198], to: [35.6762, 139.6503], id: 'sgp-tokyo' }, // Singapore -> Tokyo
  { from: [4.711, -74.0721], to: [51.5074, -0.1278], id: 'bog-lon' }, // Bogotá -> London
  { from: [40.4168, -3.7038], to: [-33.9249, 18.4241], id: 'mad-cpt' }, // Madrid -> Cape Town
];

// Faint static baseline orbital network (subtle, razor-fine background mesh that does not collide with active channels)
const BASE_ARCS: Arc[] = [
  { from: [37.7749, -122.4194], to: [35.6762, 139.6503], color: [0.08, 0.42, 0.60] }, // SF <-> Tokyo
  { from: [-23.5505, -46.6333], to: [40.4168, -3.7038], color: [0.08, 0.42, 0.60] }, // São Paulo <-> Madrid
  { from: [51.5074, -0.1278], to: [-33.9249, 18.4241], color: [0.40, 0.30, 0.12] }, // London <-> Cape Town (subtle gold)
];

interface ActiveTransmission {
  channelIndex: number;
  progress: number; // 0 to 1
  speed: number;
  state: 'drawing' | 'holding' | 'fading' | 'idle';
  holdTimer: number;
  fadeTimer: number;
  pauseTimer: number;
}

export const Globe: React.FC<GlobeProps> = ({ className = '', mousePosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseDeltaRef = useRef<number>(0);

  // Smoothly track mouse subtle nudge
  useEffect(() => {
    if (mousePosition) {
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

    // Asynchronous transmission slots (max 1-2 active routes, cleanly alternating)
    const transmissions: ActiveTransmission[] = [
      {
        channelIndex: 0,
        progress: 0,
        speed: 0.009,
        state: 'drawing',
        holdTimer: 0,
        fadeTimer: 30,
        pauseTimer: 15,
      },
      {
        channelIndex: 1,
        progress: 0,
        speed: 0.008,
        state: 'idle',
        holdTimer: 0,
        fadeTimer: 30,
        pauseTimer: 75, // Staggered start so routes alternate organically
      },
    ];

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
        diffuse: 1.18,
        mapSamples: 16000,
        mapBrightness: 4.25,
        baseColor: [0.06, 0.09, 0.16],
        markerColor: [0.20, 0.90, 1.0],
        glowColor: [0.08, 0.42, 0.76],
        opacity: 0.84,
        markers: [], // Eliminates flat circular sticker markers completely (no "puntos redondeados")
        arcs: BASE_ARCS,
        arcColor: [0.15, 0.85, 1.0],
        arcWidth: 0.14, // Ultra-fine, razor-thin luminous filaments
        arcHeight: 0.22,
        markerElevation: 0,
      };

      globe = createGlobe(canvasRef.current, options);

      // 60FPS WebGL Render Loop with Clean, Single-Arc Luminous Tracing (No Double Lines, No Markers)
      const render = () => {
        if (!prefersReducedMotion) {
          currentPhi += 0.0016;
        }

        // Smooth lerp for subtle mouse interaction
        smoothNudge += (mouseDeltaRef.current - smoothNudge) * 0.05;

        // Dynamic Arc array initialized with background mesh
        const dynamicArcs: Arc[] = [...BASE_ARCS];

        if (!prefersReducedMotion) {
          for (let i = 0; i < transmissions.length; i++) {
            const tx = transmissions[i];
            const channel = CHANNELS[tx.channelIndex];

            if (tx.state === 'idle') {
              tx.pauseTimer--;
              if (tx.pauseTimer <= 0) {
                // Pick a new channel different from the other active transmission
                const otherIdx = transmissions[1 - i]?.channelIndex;
                let nextChannel = Math.floor(Math.random() * CHANNELS.length);
                if (nextChannel === otherIdx) {
                  nextChannel = (nextChannel + 1) % CHANNELS.length;
                }
                tx.channelIndex = nextChannel;
                tx.progress = 0;
                tx.speed = 0.008 + Math.random() * 0.005; // Swift, elegant tracing speed
                tx.state = 'drawing';
              }
            } else if (tx.state === 'drawing') {
              tx.progress += tx.speed;
              if (tx.progress >= 1.0) {
                tx.progress = 1.0;
                tx.state = 'holding';
                tx.holdTimer = 35 + Math.floor(Math.random() * 25); // ~0.6s to 1s hold
              }

              // Compute head position along great circle
              const currentHead = slerp(channel.from, channel.to, Math.min(1.0, tx.progress));

              // Hyper-brilliant laser streak tracing across the world (Single clean arc, NO duplicate loops)
              const pulse = 0.90 + Math.sin(tx.progress * Math.PI * 3) * 0.10;
              dynamicArcs.push({
                from: channel.from,
                to: currentHead,
                color: [0.75 * pulse, 0.98 * pulse, 1.0], // Radiant incandescent white-cyan beam
              });
            } else if (tx.state === 'holding') {
              tx.holdTimer--;
              // Full arc is drawn with bright electric radiance across the globe
              dynamicArcs.push({
                from: channel.from,
                to: channel.to,
                color: [0.45, 0.95, 1.0], // Radiant electric cyan
              });

              if (tx.holdTimer <= 0) {
                tx.state = 'fading';
                tx.fadeTimer = 30; // 30 frames smooth fade
              }
            } else if (tx.state === 'fading') {
              tx.fadeTimer--;
              if (tx.fadeTimer <= 0) {
                tx.state = 'idle';
                tx.pauseTimer = 50 + Math.floor(Math.random() * 80); // Organic pause
              } else {
                const alpha = Math.max(0, tx.fadeTimer / 30);
                dynamicArcs.push({
                  from: channel.from,
                  to: channel.to,
                  color: [0.45 * alpha, 0.95 * alpha, 1.0 * alpha], // Smooth dissipation into space
                });
              }
            }
          }
        }

        if (globe) {
          globe.update({
            phi: currentPhi + smoothNudge,
            arcs: dynamicArcs,
            markers: [], // ZERO flat circular markers - purely razor-fine luminous lines
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
      {/* Planetary Atmospheric Limb Halo */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.20) 0%, rgba(14, 165, 233, 0.10) 48%, rgba(2, 132, 199, 0.04) 65%, transparent 72%)',
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
