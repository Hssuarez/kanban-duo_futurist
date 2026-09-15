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

// Active transmission routes across global continents (dedicated channels, separate from static baseline)
const CHANNELS: { from: [number, number]; to: [number, number]; id: string }[] = [
  { from: [4.711, -74.0721], to: [37.7749, -122.4194], id: 'bog-sf' }, // Bogotá -> SF
  { from: [40.7128, -74.006], to: [40.4168, -3.7038], id: 'ny-mad' }, // NY -> Madrid
  { from: [51.5074, -0.1278], to: [1.3521, 103.8198], id: 'lon-sgp' }, // London -> Singapore
  { from: [1.3521, 103.8198], to: [35.6762, 139.6503], id: 'sgp-tokyo' }, // Singapore -> Tokyo
  { from: [4.711, -74.0721], to: [51.5074, -0.1278], id: 'bog-lon' }, // Bogotá -> London
  { from: [40.7128, -74.006], to: [4.711, -74.0721], id: 'ny-bog' }, // NY -> Bogotá
];

// Persistent base hub markers: tiny, highly brilliant pinpoints of light (sparkling starbursts, size 0.008 - 0.009)
const BASE_MARKERS: Marker[] = [
  { location: [4.711, -74.0721], size: 0.009, color: [1.0, 0.88, 0.42] }, // Bogotá (radiant amber)
  { location: [37.7749, -122.4194], size: 0.009, color: [0.85, 1.0, 1.0] }, // San Francisco (brilliant white-cyan)
  { location: [40.7128, -74.006], size: 0.009, color: [1.0, 1.0, 1.0] }, // New York (pure white)
  { location: [40.4168, -3.7038], size: 0.008, color: [1.0, 0.85, 0.40] }, // Madrid (radiant amber)
  { location: [35.6762, 139.6503], size: 0.009, color: [0.85, 1.0, 1.0] }, // Tokyo (brilliant white-cyan)
  { location: [51.5074, -0.1278], size: 0.009, color: [1.0, 1.0, 1.0] }, // London (pure white)
  { location: [1.3521, 103.8198], size: 0.008, color: [1.0, 0.88, 0.42] }, // Singapore (amber)
  { location: [-23.5505, -46.6333], size: 0.009, color: [0.80, 1.0, 1.0] }, // São Paulo (cyan)
  { location: [-33.9249, 18.4241], size: 0.008, color: [1.0, 0.85, 0.40] }, // Cape Town (amber)
];

// Static baseline orbital network (bright, razor-fine luminous filaments that do not collide with active channels)
const BASE_ARCS: Arc[] = [
  { from: [37.7749, -122.4194], to: [35.6762, 139.6503], color: [0.25, 0.90, 1.0] }, // SF <-> Tokyo (bright electric cyan)
  { from: [-23.5505, -46.6333], to: [40.4168, -3.7038], color: [0.30, 0.92, 1.0] }, // São Paulo <-> Madrid (bright electric cyan)
  { from: [51.5074, -0.1278], to: [-33.9249, 18.4241], color: [1.0, 0.85, 0.42] }, // London <-> Cape Town (radiant gold)
  { from: [40.4168, -3.7038], to: [1.3521, 103.8198], color: [0.28, 0.88, 1.0] }, // Madrid <-> Singapore (bright cyan)
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
        diffuse: 1.20,
        mapSamples: 16000,
        mapBrightness: 4.35,
        baseColor: [0.06, 0.09, 0.16],
        markerColor: [0.30, 0.95, 1.0],
        glowColor: [0.10, 0.48, 0.82],
        opacity: 0.86,
        markers: BASE_MARKERS,
        arcs: BASE_ARCS,
        arcColor: [0.30, 0.92, 1.0],
        arcWidth: 0.18, // Crisp, highly luminous filaments
        arcHeight: 0.22,
        markerElevation: 0.015,
      };

      globe = createGlobe(canvasRef.current, options);

      // 60FPS WebGL Render Loop with Clean Single-Arc Luminous Tracing & Pinpoint Star Sparks
      const render = () => {
        if (!prefersReducedMotion) {
          currentPhi += 0.0016;
        }

        // Smooth lerp for subtle mouse interaction
        smoothNudge += (mouseDeltaRef.current - smoothNudge) * 0.05;

        // Dynamic Arc and Marker arrays initialized with background mesh
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
              const pulse = 0.92 + Math.sin(tx.progress * Math.PI * 3) * 0.08;
              dynamicArcs.push({
                from: channel.from,
                to: currentHead,
                color: [0.85 * pulse, 1.0, 1.0], // High-brilliance white-cyan beam
              });

              // Tiny, highly brilliant pinpoint spark at the leading tip (diminuta pero muy brillante)
              dynamicMarkers.push({
                location: currentHead,
                size: 0.009, // Tiny 3px pinpoint, sharp specular star
                color: [1.0, 1.0, 1.0], // Pure incandescent white
              });
            } else if (tx.state === 'holding') {
              tx.holdTimer--;
              // Full arc is drawn with bright electric radiance across the globe
              dynamicArcs.push({
                from: channel.from,
                to: channel.to,
                color: [0.60, 0.98, 1.0], // Radiant electric cyan
              });

              // Arrival beacon at destination station (tiny, highly brilliant starburst spark)
              dynamicMarkers.push({
                location: channel.to,
                size: 0.012,
                color: [1.0, 1.0, 1.0],
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
                  color: [0.60 * alpha, 0.98 * alpha, 1.0 * alpha], // Smooth dissipation into space
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
            'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.12) 48%, rgba(2, 132, 199, 0.04) 65%, transparent 72%)',
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
