'use client';

import React, { useRef, useImperativeHandle, forwardRef } from 'react';

export interface PlanetPosition {
  id: string;
  x: number; // Coordenada x relativa al centro (0 = centro)
  y: number; // Coordenada y relativa al centro (0 = centro)
  originX?: number; // Centro del polo emisor
  originY?: number;
  color: string;
}

export interface CommandCenterConnectionsHandle {
  updatePositions: (
    positions: PlanetPosition[],
    containerWidth: number,
    containerHeight: number
  ) => void;
}

interface CommandCenterConnectionsProps {
  planetPositions: PlanetPosition[];
  hoveredModuleId: string | null;
  containerWidth: number;
  containerHeight: number;
}

function computeBeamD(
  origX: number,
  origY: number,
  targetX: number,
  targetY: number,
  posX: number,
  posY: number
) {
  const midX = (origX + targetX) / 2;
  const midY = (origY + targetY) / 2;
  const curveOffset = Math.sin((posX + posY) * 0.01) * 16;
  const ctrlX = midX - (targetY - origY) * 0.05 + curveOffset;
  const ctrlY = midY + (targetX - origX) * 0.05;

  const dx = targetX - ctrlX;
  const dy = targetY - ctrlY;
  const dist = Math.hypot(dx, dy) || 1;
  const planetRimOffset = 38;
  const endX = targetX - (dx / dist) * planetRimOffset;
  const endY = targetY - (dy / dist) * planetRimOffset;

  return {
    pathD: `M ${origX} ${origY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`,
    endX,
    endY,
  };
}

export const CommandCenterConnections = forwardRef<
  CommandCenterConnectionsHandle,
  CommandCenterConnectionsProps
>(({ planetPositions, hoveredModuleId, containerWidth, containerHeight }, ref) => {
  const beamPathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const beamPulseRefs = useRef<Record<string, SVGPathElement | null>>({});
  const beamCircleRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const gradRefs = useRef<Record<string, SVGLinearGradientElement | null>>({});

  useImperativeHandle(
    ref,
    () => ({
      updatePositions: (positions, cw, ch) => {
        const cx = cw / 2;
        const cy = ch / 2;
        for (const pos of positions) {
          const origX = cx + (pos.originX || 0);
          const origY = cy + (pos.originY || 0);
          const targetX = cx + pos.x;
          const targetY = cy + pos.y;

          const { pathD, endX, endY } = computeBeamD(
            origX,
            origY,
            targetX,
            targetY,
            pos.x,
            pos.y
          );

          const pathEl = beamPathRefs.current[pos.id];
          if (pathEl) pathEl.setAttribute('d', pathD);

          const pulseEl = beamPulseRefs.current[pos.id];
          if (pulseEl) pulseEl.setAttribute('d', pathD);

          const circleEl = beamCircleRefs.current[pos.id];
          if (circleEl) {
            circleEl.setAttribute('cx', `${endX}`);
            circleEl.setAttribute('cy', `${endY}`);
          }

          const gradEl = gradRefs.current[pos.id];
          if (gradEl) {
            gradEl.setAttribute('x2', `${targetX}`);
            gradEl.setAttribute('y2', `${targetY}`);
          }
        }
      },
    }),
    []
  );

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
              ref={(el) => {
                gradRefs.current[pos.id] = el;
              }}
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

        const { pathD, endX, endY } = computeBeamD(
          origX,
          origY,
          targetX,
          targetY,
          pos.x,
          pos.y
        );

        return (
          <g key={pos.id} className="transition-all duration-300">
            {/* Trayectoria base tenue */}
            <path
              ref={(el) => {
                beamPathRefs.current[pos.id] = el;
              }}
              d={pathD}
              fill="none"
              stroke={`url(#beam-${pos.id})`}
              strokeWidth={isHovered ? 1.75 : 0.85}
              strokeDasharray={isHovered ? 'none' : '3 7'}
              opacity={isHovered ? 0.85 : 0.12}
            />

            {/* Pulso de energía viajero cuando está en hover */}
            {isHovered && (
              <path
                ref={(el) => {
                  beamPulseRefs.current[pos.id] = el;
                }}
                d={pathD}
                fill="none"
                stroke={pos.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="16 120"
                className="animate-pulse"
                opacity="0.9"
              />
            )}

            {/* Nodo luminoso en el punto perimetral de contacto exterior del planeta */}
            <circle
              ref={(el) => {
                beamCircleRefs.current[pos.id] = el;
              }}
              cx={endX}
              cy={endY}
              r={isHovered ? 3.5 : 2}
              fill={pos.color}
              opacity={isHovered ? 0.9 : 0.25}
              className="transition-all duration-300"
            />
          </g>
        );
      })}
    </svg>
  );
});

CommandCenterConnections.displayName = 'CommandCenterConnections';
