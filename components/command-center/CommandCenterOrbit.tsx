'use client';

import React from 'react';
import { BinaryOrbitParams, CommandCenterPole, POLE_ORBITAL_TRACKS } from './commandCenterConfig';

interface CommandCenterOrbitProps {
  binaryParams: BinaryOrbitParams;
  activePole: CommandCenterPole;
  activeProjectColor?: string;
}

export const CommandCenterOrbit: React.FC<CommandCenterOrbitProps> = ({
  binaryParams,
  activePole,
  activeProjectColor = '#06b6d4',
}) => {
  const { layoutMode, workspaceCenter, habitsCenter, workspaceRadiusX, workspaceRadiusY, habitsRadiusX, habitsRadiusY } =
    binaryParams;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente para polo Workspace (Cyan / Proyecto) */}
        <linearGradient id="orbit-grad-workspace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={activeProjectColor} stopOpacity="0.45" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.35" />
        </linearGradient>

        {/* Gradiente para polo Habit Core (Esmeralda / Violeta) */}
        <linearGradient id="orbit-grad-habits" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
        </linearGradient>

        {/* Gradiente para el puente cósmico */}
        <linearGradient id="bridge-grad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={activeProjectColor} stopOpacity="0.3" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
        </linearGradient>

        {/* Filtro de resplandor */}
        <filter id="orbit-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. MODO PANORÁMICO: Renderiza ambos polos en simultáneo */}
      {layoutMode === 'panoramic' ? (
        <g>
          {/* Puente Gravitacional (Línea cósmica ondulada entre los dos polos) */}
          <path
            d={`M calc(50% + ${workspaceCenter.x}px) 50% Q 50% calc(50% - 25px) calc(50% + ${habitsCenter.x}px) 50%`}
            fill="none"
            stroke="url(#bridge-grad)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="animate-pulse opacity-60"
          />
          <path
            d={`M calc(50% + ${workspaceCenter.x}px) 50% Q 50% calc(50% + 25px) calc(50% + ${habitsCenter.x}px) 50%`}
            fill="none"
            stroke="url(#bridge-grad)"
            strokeWidth="1"
            strokeDasharray="2 8"
            className="opacity-40"
          />

          {/* Órbitas del Polo WORKSPACE (Izquierda) */}
          <g transform={`translate(0, 0)`}>
            {POLE_ORBITAL_TRACKS.map((track) => {
              const rx = (workspaceRadiusX * track.radiusX) / 200;
              const ry = (workspaceRadiusY * track.radiusY) / 135;
              return (
                <g key={`ws-${track.index}`}>
                  <ellipse
                    cx={`calc(50% + ${workspaceCenter.x}px)`}
                    cy="50%"
                    rx={rx}
                    ry={ry}
                    fill="none"
                    stroke="url(#orbit-grad-workspace)"
                    strokeWidth="1.2"
                    opacity={track.opacity * 0.8}
                    filter="url(#orbit-glow)"
                  />
                  <ellipse
                    cx={`calc(50% + ${workspaceCenter.x}px)`}
                    cy="50%"
                    rx={rx}
                    ry={ry}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray={track.strokeDash}
                    opacity={track.opacity}
                  />
                </g>
              );
            })}
          </g>

          {/* Órbitas del Polo HABIT CORE (Derecha) */}
          <g transform={`translate(0, 0)`}>
            {POLE_ORBITAL_TRACKS.map((track) => {
              const rx = (habitsRadiusX * track.radiusX) / 200;
              const ry = (habitsRadiusY * track.radiusY) / 135;
              return (
                <g key={`hb-${track.index}`}>
                  <ellipse
                    cx={`calc(50% + ${habitsCenter.x}px)`}
                    cy="50%"
                    rx={rx}
                    ry={ry}
                    fill="none"
                    stroke="url(#orbit-grad-habits)"
                    strokeWidth="1.2"
                    opacity={track.opacity * 0.8}
                    filter="url(#orbit-glow)"
                  />
                  <ellipse
                    cx={`calc(50% + ${habitsCenter.x}px)`}
                    cy="50%"
                    rx={rx}
                    ry={ry}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="1"
                    strokeDasharray={track.strokeDash}
                    opacity={track.opacity}
                  />
                </g>
              );
            })}
          </g>
        </g>
      ) : (
        /* 2. MODO FOCUS / MÓVIL: Renderiza las órbitas del polo activo centrado al 100% */
        <g>
          {POLE_ORBITAL_TRACKS.map((track) => {
            const isWs = activePole === 'workspace';
            const baseRx = isWs ? workspaceRadiusX : habitsRadiusX;
            const baseRy = isWs ? workspaceRadiusY : habitsRadiusY;
            const rx = (baseRx * track.radiusX) / 200;
            const ry = (baseRy * track.radiusY) / 135;
            const gradId = isWs ? 'url(#orbit-grad-workspace)' : 'url(#orbit-grad-habits)';
            const strokeColor = isWs ? '#38bdf8' : '#34d399';

            return (
              <g key={`focus-${track.index}`}>
                <ellipse
                  cx="50%"
                  cy="50%"
                  rx={rx}
                  ry={ry}
                  fill="none"
                  stroke={gradId}
                  strokeWidth="1.2"
                  opacity={track.opacity * 0.85}
                  filter="url(#orbit-glow)"
                />
                <ellipse
                  cx="50%"
                  cy="50%"
                  rx={rx}
                  ry={ry}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="1"
                  strokeDasharray={track.strokeDash}
                  opacity={track.opacity}
                />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};
