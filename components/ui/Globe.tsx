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
  { from: [-33.9249, 18.4241], to: [40.4168, -3.7038], id: 'cpt-mad' },
  { from: [1.3521, 103.8198], to: [35.6762, 139.6503], id: 'sgp-tokyo' },
];

// Persistent base hub markers on the planet (pinpoint starburst beacons, size 0.018 - 0.022)
const BASE_MARKERS: Marker[] = [
  { location: [4.711, -74.0721], size: 0.022, color: [1.0, 0.82, 0.38] }, // Bogotá (warm golden amber)
  { location: [37.7749, -122.4194], size: 0.020, color: [0.20, 0.95, 1.0] }, // San Francisco (electric cyan)
  { location: [40.7128, -74.006], size: 0.021, color: [0.88, 0.98, 1.0] }, // New York (crisp white-cyan)
  { location: [40.4168, -3.7038], size: 0.019, color: [1.0, 0.78, 0.35] }, // Madrid (golden amber)
  { location: [35.6762, 139.6503], size: 0.020, color: [0.20, 0.92, 1.0] }, // Tokyo (electric cyan)
  { location: [51.5074, -0.1278], size: 0.019, color: [0.82, 0.96, 1.0] }, // London (white-cyan)
  { location: [1.3521, 103.8198], size: 0.018, color: [1.0, 0.82, 0.35] }, // Singapore (amber)
  { location: [-23.5505, -46.6333], size: 0.019, color: [0.20, 0.90, 1.0] }, // São Paulo (cyan)
  { location: [-33.9249, 18.4241], size: 0.018, color: [1.0, 0.80, 0.35] }, // Cape Town (amber)
  { location: [-33.8688, 151.2093], size: 0.018, color: [0.20, 0.92, 1.0] }, // Sydney (cyan)
];

// Faint static structural orbits (fine, luminous celestial network baseline)
const BASE_ARCS: Arc[] = [
  { from: [4.711, -74.0721], to: [37.7749, -122.4194], color: [0.10, 0.72, 0.92] },
  { from: [40.7128, -74.006], to: [40.4168, -3.7038], color: [0.15, 0.82, 1.0] },
  { from: [40.4168, -3.7038], to: [-33.9249, 18.4241], color: [0.85, 0.68, 0.28] }, // Subtle gold thread to Africa
  { from: [51.5074, -0.1278], to: [1.3521, 103.8198], color: [0.12, 0.78, 0.95] },
  { from: [37.7749, -122.4194], to: [35.6762, 139.6503], color: [0.10, 0.75, 0.92] },
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
        diffuse: 1.18,
        mapSamples: 16000,
        mapBrightness: 4.25,
        baseColor: [0.06, 0.09, 0.16],
        markerColor: [0.20, 0.90, 1.0],
        glowColor: [0.08, 0.42, 0.76],
        opacity: 0.84,
        markers: BASE_MARKERS,
        arcs: BASE_ARCS,
        arcColor: [0.15, 0.85, 1.0],
        arcWidth: 0.16, // Ultra-fine, crisp lines (reduced by >60% from 0.44)
        arcHeight: 0.23,
        markerElevation: 0.02, // Kept close to surface so hubs sit on the globe
      };

      globe = createGlobe(canvasRef.current, options);

      // 60FPS WebGL Render Loop with Tapered Comet Streak Simulation
      const render = () => {
        if (!prefersReducedMotion) {
          currentPhi += 0.0016;
        }

        // Smooth lerp for subtle mouse interaction
        smoothNudge += (mouseDeltaRef.current - smoothNudge) * 0.05;

        // Animate Traveling Paths & Luminous Tapered Streaks (Estelas)
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
                tx.speed = 0.0050 + Math.random() * 0.0035;
                tx.state = 'drawing';
              }
            } else if (tx.state === 'drawing') {
              tx.progress += tx.speed;
              if (tx.progress >= 1.0) {
                tx.progress = 1.0;
                tx.state = 'holding';
                tx.holdTimer = 25 + Math.floor(Math.random() * 30); // Brief hold at destination
              }

              // Compute head position along great circle
              const currentHead = slerp(channel.from, channel.to, tx.progress);

              // 1. Base traced fine luminous line
              dynamicArcs.push({
                from: channel.from,
                to: currentHead,
                color: [0.12, 0.78, 0.96],
              });

              // 2. Luminous Tapered Streak (estela brillante): leading 14% of the path
              const streakProgress = Math.max(0, tx.progress - 0.14);
              const streakStart = slerp(channel.from, channel.to, streakProgress);
              dynamicArcs.push({
                from: streakStart,
                to: currentHead,
                color: [0.55, 0.96, 1.0],
              });

              // 3. Incandescent High-Energy Core at the front tip: leading 4% of the path
              const tipProgress = Math.max(0, tx.progress - 0.04);
              const tipStart = slerp(channel.from, channel.to, tipProgress);
              dynamicArcs.push({
                from: tipStart,
                to: currentHead,
                color: [0.98, 1.0, 1.0],
              });

              // 4. Pinpoint specular micro-spark (needle-sharp starburst, NOT a fat ball: size 0.012)
              dynamicMarkers.push({
                location: currentHead,
                size: 0.012,
                color: [1.0, 1.0, 1.0],
              });
            } else if (tx.state === 'holding') {
              tx.holdTimer--;
              // Full arc is drawn with bright radiance
              dynamicArcs.push({
                from: channel.from,
                to: channel.to,
                color: [0.16, 0.85, 1.0],
              });

              // Arrival beacon flare at destination station
              dynamicMarkers.push({
                location: channel.to,
                size: 0.024,
                color: [0.95, 1.0, 1.0],
              });

              if (tx.holdTimer <= 0) {
                tx.state = 'fading';
              }
            } else if (tx.state === 'fading') {
              // Tail catches up to head for a smooth traveling segment fade
              tx.tailProgress += tx.speed * 1.4;
              if (tx.tailProgress >= 1.0) {
                tx.state = 'idle';
                tx.pauseTimer = 60 + Math.floor(Math.random() * 100); // Organic pause (1s to 2.5s)
              } else {
                const currentTail = slerp(channel.from, channel.to, tx.tailProgress);
                dynamicArcs.push({
                  from: currentTail,
                  to: channel.to,
                  color: [0.08, 0.65, 0.85],
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
            'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.12) 46%, rgba(2, 132, 199, 0.05) 65%, transparent 72%)',
          filter: 'blur(32px)',
          transform: 'scale(1.05)',
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
