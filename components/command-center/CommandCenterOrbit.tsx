'use client';

import React from 'react';
import { ORBITAL_TRACKS } from './commandCenterConfig';

interface CommandCenterOrbitProps {
  scale?: number;
}

export const CommandCenterOrbit: React.FC<CommandCenterOrbitProps> = ({ scale = 1 }) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente radial para difuminar los bordes de las órbitas */}
        <linearGradient id="orbit-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.35" />
        </linearGradient>

        <linearGradient id="orbit-grad-subtle" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
        </linearGradient>

        {/* Filtro de resplandor para nodos orbitales */}
        <filter id="orbit-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(0, 0)">
        {ORBITAL_TRACKS.map((track) => {
          const rx = track.radiusX * scale;
          const ry = track.radiusY * scale;

          return (
            <g key={track.index} className="opacity-90">
              {/* Anillo de brillo difuso de fondo */}
              <ellipse
                cx="50%"
                cy="50%"
                rx={rx}
                ry={ry}
                fill="none"
                stroke="url(#orbit-grad-cyan)"
                strokeWidth="1.5"
                opacity={track.opacity * 0.7}
                filter="url(#orbit-glow)"
              />

              {/* Pista orbital punteada de precisión tecnológica */}
              <ellipse
                cx="50%"
                cy="50%"
                rx={rx}
                ry={ry}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray={track.strokeDash}
                opacity={track.opacity}
              />

              {/* Anillo exterior ultra-fino para sensación de radar HUD */}
              <ellipse
                cx="50%"
                cy="50%"
                rx={rx + 8 * scale}
                ry={ry + 6 * scale}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="0.5"
                strokeDasharray="2 18"
                opacity={track.opacity * 0.5}
              />
            </g>
          );
        })}

        {/* Marcadores de cuadrante astronómico (ejes cardinales HUD muy sutiles) */}
        <line
          x1="50%"
          y1="calc(50% - 280px)"
          x2="50%"
          y2="calc(50% - 240px)"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.3"
        />
        <line
          x1="50%"
          y1="calc(50% + 240px)"
          x2="50%"
          y2="calc(50% + 280px)"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.3"
        />
        <line
          x1="calc(50% - 470px)"
          y1="50%"
          x2="calc(50% - 430px)"
          y2="50%"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.3"
        />
        <line
          x1="calc(50% + 430px)"
          y1="50%"
          x2="calc(50% + 470px)"
          y2="50%"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.3"
        />
      </g>
    </svg>
  );
};
