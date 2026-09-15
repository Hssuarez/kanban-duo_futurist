'use client';

import React, { useEffect, useRef } from 'react';
import createGlobe, { COBEOptions, Marker, Arc } from 'cobe';

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

// Available communication channels across global tech hubs
const CHANNELS: { from: [number, number]; to: [number, number]; id: string }[] = [
  { from: [4.711, -74.0721], to: [37.7749, -122.4194], id: 'bog-sf' },
  { from: [40.7128, -74.006], to: [40.4168, -3.7038], id: 'ny-mad' },
  { from: [37.7749, -122.4194], to: [35.6762, 139.6503], id: 'sf-tokyo' },
  { from: [51.5074, -0.1278], to: [1.3521, 103.8198], id: 'lon-sgp' },
  { from: [-23.5505, -46.6333], to: [40.4168, -3.7038], id: 'sp-mad' },
  { from: [4.711, -74.0721], to: [51.5074, -0.1278], id: 'bog-lon' },
];

// Persistent base hub markers on the planet
const BASE_MARKERS: Marker[] = [
  { location: [4.711, -74.0721], size: 0.042 }, // Bogotá
  { location: [37.7749, -122.4194], size: 0.038 }, // San Francisco
  { location: [40.7128, -74.006], size: 0.039 }, // New York
  { location: [40.4168, -3.7038], size: 0.034 }, // Madrid
  { location: [35.6762, 139.6503], size: 0.037 }, // Tokyo
  { location: [51.5074, -0.1278], size: 0.035 }, // London
  { location: [1.3521, 103.8198], size: 0.034 }, // Singapore
  { location: [-23.5505, -46.6333], size: 0.035 }, // São Paulo
];

// Faint static structural orbits (celestial network baseline)
const BASE_ARCS: Arc[] = [
  { from: [4.711, -74.0721], to: [37.7749, -122.4194] },
  { from: [40.7128, -74.006], to: [40.4168, -3.7038] },
];

interface ActiveTransmission {
  channelIndex: number;
  progress: number; // 0 to 1
  tailProgress: number; // 0 to 1
  speed: number;
  state: 'drawing' | 'holding' | 'fading' | 'idle';
  holdTimer: number;
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

    // Two asynchronous transmission slots (max 1-2 active at any time, with organic pauses)
    const transmissions: ActiveTransmission[] = [
      {
        channelIndex: 0,
        progress: 0,
        tailProgress: 0,
        speed: 0.0055,
        state: 'drawing',
        holdTimer: 0,
        pauseTimer: 20,
      },
      {
        channelIndex: 1,
        progress: 0,
        tailProgress: 0,
        speed: 0.0048,
        state: 'idle',
        holdTimer: 0,
        pauseTimer: 140, // Staggered start so routes alternate organically
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
        diffuse: 1.16,
        mapSamples: 16000,
        mapBrightness: 4.15,
        baseColor: [0.06, 0.09, 0.16],
        markerColor: [0.05, 0.70, 0.85],
        glowColor: [0.06, 0.36, 0.62],
        opacity: 0.82,
        markers: BASE_MARKERS,
        arcs: BASE_ARCS,
        arcColor: [0.05, 0.68, 0.84],
        arcWidth: 0.44,
        arcHeight: 0.22,
      };

      globe = createGlobe(canvasRef.current, options);

      // 60FPS WebGL Render Loop with Traveling Path Simulation
      const render = () => {
        if (!prefersReducedMotion) {
          currentPhi += 0.0016;
        }

        // Smooth lerp for subtle mouse interaction
        smoothNudge += (mouseDeltaRef.current - smoothNudge) * 0.05;

        // Animate Traveling Paths & Traveling Data Packets
        const dynamicArcs: Arc[] = [...BASE_ARCS];
        const dynamicMarkers: Marker[] = [...BASE_MARKERS];

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
                tx.tailProgress = 0;
                tx.speed = 0.0045 + Math.random() * 0.003; // Unpredictable speeds
                tx.state = 'drawing';
              }
            } else if (tx.state === 'drawing') {
              tx.progress += tx.speed;
              if (tx.progress >= 1.0) {
                tx.progress = 1.0;
                tx.state = 'holding';
                tx.holdTimer = 30 + Math.floor(Math.random() * 35); // Brief hold at destination
              }

              // Compute head position along great circle
              const currentHead = slerp(channel.from, channel.to, tx.progress);

              // Traveling Arc drawing progressively
              dynamicArcs.push({
                from: channel.from,
                to: currentHead,
                color: [0.06, 0.82, 0.98],
              });

              // Traveling Data Packet Node riding at the front of the wave
              dynamicMarkers.push({
                location: currentHead,
                size: 0.052,
                color: [0.10, 0.95, 1.0], // Radiant cyan data packet
              });
            } else if (tx.state === 'holding') {
              tx.holdTimer--;
              // Full arc is drawn
              dynamicArcs.push({
                from: channel.from,
                to: channel.to,
                color: [0.06, 0.82, 0.98],
              });
              // Data packet arrived at destination
              dynamicMarkers.push({
                location: channel.to,
                size: 0.056,
                color: [0.12, 1.0, 0.95],
              });

              if (tx.holdTimer <= 0) {
                tx.state = 'fading';
              }
            } else if (tx.state === 'fading') {
              // Tail catches up to head for a smooth traveling segment fade
              tx.tailProgress += tx.speed * 1.35;
              if (tx.tailProgress >= 1.0) {
                tx.state = 'idle';
                tx.pauseTimer = 70 + Math.floor(Math.random() * 110); // Organic pause (1.2s to 3s)
              } else {
                const currentTail = slerp(channel.from, channel.to, tx.tailProgress);
                dynamicArcs.push({
                  from: currentTail,
                  to: channel.to,
                  color: [0.05, 0.65, 0.85],
                });
              }
            }
          }
        }

        if (globe) {
          globe.update({
            phi: currentPhi + smoothNudge,
            arcs: dynamicArcs,
            markers: dynamicMarkers,
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
