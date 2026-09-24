'use client';

import React from 'react';
import { CommandCenterModuleConfig } from './commandCenterConfig';

interface PlanetPosition {
  id: string;
  x: number; // Coordenada x relativa al centro (0 = centro)
  y: number; // Coordenada y relativa al centro (0 = centro)
  originX?: number; // Centro del polo emisor
  originY?: number;
  color: string;
}

interface CommandCenterConnectionsProps {
  planetPositions: PlanetPosition[];
  hoveredModuleId: string | null;
  containerWidth: number;
  containerHeight: number;
}

export const CommandCenterConnections: React.FC<CommandCenterConnectionsProps> = ({
  planetPositions,
  hoveredModuleId,
  containerWidth,
  containerHeight,
}) => {
  const cx = containerWidth / 2;
  const cy = containerHeight / 2;

  if (containerWidth <= 0 || containerHeight <= 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {planetPositions.map((pos) => {
          const origX = cx + (pos.originX || 0);
          const origY = cy + (pos.originY || 0);
          return (
            <linearGradient
              key={`grad-${pos.id}`}
              id={`beam-${pos.id}`}
              x1={origX}
              y1={origY}
              x2={cx + pos.x}
              y2={cy + pos.y}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="60%" stopColor={pos.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={pos.color} stopOpacity="0.6" />
            </linearGradient>
          );
        })}
      </defs>

      {planetPositions.map((pos) => {
        const origX = cx + (pos.originX || 0);
        const origY = cy + (pos.originY || 0);
        const targetX = cx + pos.x;
        const targetY = cy + pos.y;
        const isHovered = hoveredModuleId === pos.id;

        // Punto de control intermedio para curva suave tecnológica
        const midX = (origX + targetX) / 2;
        const midY = (origY + targetY) / 2;
        // Ligera curvatura tangencial para que no sea una línea rígida
        const curveOffset = Math.sin((pos.x + pos.y) * 0.01) * 16;
        const ctrlX = midX - (targetY - origY) * 0.05 + curveOffset;
        const ctrlY = midY + (targetX - origX) * 0.05;

        const pathD = `M ${origX} ${origY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`;

        return (
          <g key={pos.id} className="transition-all duration-300">
            {/* Trayectoria base tenue */}
            <path
              d={pathD}
              fill="none"
              stroke={`url(#beam-${pos.id})`}
              strokeWidth={isHovered ? 2 : 1}
              strokeDasharray={isHovered ? 'none' : '3 6'}
              opacity={isHovered ? 0.85 : 0.25}
            />

            {/* Pulso de energía viajero cuando está en hover */}
            {isHovered && (
              <path
                d={pathD}
                fill="none"
                stroke={pos.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="16 120"
                className="animate-pulse"
                opacity="0.9"
              />
            )}

            {/* Nodo luminoso en el punto de contacto del planeta */}
            <circle
              cx={targetX}
              cy={targetY}
              r={isHovered ? 4 : 2.5}
              fill={pos.color}
              opacity={isHovered ? 0.9 : 0.4}
              className="transition-all duration-300"
            />
          </g>
        );
      })}
    </svg>
  );
};
