'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  BinaryOrbitParams,
  CommandCenterPole,
  POLE_ORBITAL_TRACKS,
  ORBIT_DATA_PACKETS,
  WORKSPACE_MODULE_CONFIGS,
  HABIT_MODULE_CONFIGS,
} from './commandCenterConfig';

interface CommandCenterOrbitProps {
  binaryParams: BinaryOrbitParams;
  activePole: CommandCenterPole;
  activeProjectColor?: string;
  hoveredModuleId?: string | null;
  layer?: 'back' | 'front' | 'all';
}

export const CommandCenterOrbit: React.FC<CommandCenterOrbitProps> = ({
  binaryParams,
  activePole,
  activeProjectColor = '#06b6d4',
  hoveredModuleId = null,
  layer = 'all',
}) => {
  const {
    layoutMode,
    workspaceCenter,
    habitsCenter,
    workspaceRadiusX,
    workspaceRadiusY,
    habitsRadiusX,
    habitsRadiusY,
    isMobile,
  } = binaryParams;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());

  // Módulos pertenecientes al track para iluminar la órbita activa en hover
  const hoveredModule = hoveredModuleId
    ? [...WORKSPACE_MODULE_CONFIGS, ...HABIT_MODULE_CONFIGS].find((m) => m.id === hoveredModuleId)
    : null;

  // Bucle de renderizado de Paquetes de Datos a 60 FPS (Canvas 2D de alta resolución)
  const drawPackets = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (w <= 0 || h <= 0) return;

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      ctx.restore();
      return;
    }

    const cx = w / 2;
    const cy = h / 2;
    const now = performance.now();
    const elapsedSec = (now - startTimeRef.current) / 1000;

    // Filtrar paquetes según el modo (Panorámico vs Focus móvil)
    const activePackets = ORBIT_DATA_PACKETS.filter((p) => {
      if (layoutMode === 'panoramic') return true;
      if (p.isBridge) return false; // En móvil sin panorámica no hay puente
      return p.pole === activePole;
    });

    for (const pkt of activePackets) {
      if (pkt.isBridge) {
        // Paquetes en el puente gravitacional (Workspace <-> Habit Core)
        const isUpper = (pkt.direction ?? 1) > 0;
        // Separación por capa: superior en back, inferior en front
        if (layer === 'back' && !isUpper) continue;
        if (layer === 'front' && isUpper) continue;

        const p0x = cx + workspaceCenter.x;
        const p0y = cy;
        const p1x = cx + habitsCenter.x;
        const p1y = cy;
        const ctrlX = cx;
        const ctrlY = cy + (isUpper ? -26 : 22);

        let prog = (pkt.initialOffset + (pkt.direction ?? 1) * elapsedSec * pkt.speed) % 1;
        if (prog < 0) prog += 1;

        // Ecuación Bézier cuadrática
        const bx = (1 - prog) ** 2 * p0x + 2 * (1 - prog) * prog * ctrlX + prog ** 2 * p1x;
        const by = (1 - prog) ** 2 * p0y + 2 * (1 - prog) * prog * ctrlY + prog ** 2 * p1y;

        // Desvanecimiento suave en los extremos
        const alpha = Math.sin(prog * Math.PI) * 0.9;
        if (alpha <= 0.02) continue;

        ctx.save();
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = alpha;

        // Centro brillante
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, pkt.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Halo coloreado
        ctx.fillStyle = pkt.color;
        ctx.globalAlpha = alpha * 0.75;
        ctx.beginPath();
        ctx.arc(bx, by, pkt.size * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else {
        // Paquetes orbitales alrededor de su respectivo polo
        const isWs = pkt.pole === 'workspace';
        const center =
          layoutMode === 'panoramic'
            ? isWs
              ? workspaceCenter
              : habitsCenter
            : { x: 0, y: 0 };

        const baseRx = isWs ? workspaceRadiusX : habitsRadiusX;
        const baseRy = isWs ? workspaceRadiusY : habitsRadiusY;
        const trackDef = POLE_ORBITAL_TRACKS[pkt.trackIndex ?? 0] || POLE_ORBITAL_TRACKS[0];

        const rx = (baseRx * trackDef.radiusX) / 200;
        const ry = (baseRy * trackDef.radiusY) / 135;

        // Ángulo actual
        const currentAngle = (pkt.initialOffset + elapsedSec * pkt.speed) % (Math.PI * 2);
        const sinA = Math.sin(currentAngle);
        const cosA = Math.cos(currentAngle);

        // Separación por capa: Y <= 0 (arriba/atrás), Y > 0 (abajo/delante)
        if (layer === 'back' && sinA > 0) continue;
        if (layer === 'front' && sinA <= 0) continue;

        const px = cx + center.x + rx * cosA;
        const py = cy + center.y + ry * sinA;

        const isModuleHovered = hoveredModuleId && pkt.moduleId === hoveredModuleId;
        const baseAlpha = isModuleHovered ? 1.0 : 0.45 + 0.4 * Math.sin(currentAngle * 2 + pkt.initialOffset);

        ctx.save();
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = isModuleHovered ? 12 : 7;
        ctx.globalAlpha = baseAlpha;

        // Núcleo blanco
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, isModuleHovered ? pkt.size * 1.15 : pkt.size * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Halo temático
        ctx.fillStyle = pkt.color;
        ctx.globalAlpha = baseAlpha * 0.75;
        ctx.beginPath();
        ctx.arc(px, py, (isModuleHovered ? pkt.size * 2.4 : pkt.size * 1.9), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(drawPackets);
  }, [
    layoutMode,
    workspaceCenter,
    habitsCenter,
    workspaceRadiusX,
    workspaceRadiusY,
    habitsRadiusX,
    habitsRadiusY,
    activePole,
    hoveredModuleId,
    layer,
  ]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawPackets);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawPackets]);

  // Generador de arcos SVG según capa ('back': arco superior Y<=0, 'front': arco inferior Y>0, 'all': elipse completa)
  const renderTrackArc = (
    key: string,
    centerXStr: string,
    rx: number,
    ry: number,
    strokeGrad: string,
    strokeColor: string,
    strokeDash: string,
    opacity: number,
    isHighlighted: boolean
  ) => {
    const strokeW = isHighlighted ? 1.75 : 1.05;
    const finalOpacity = isHighlighted ? Math.min(1, opacity * 2.2) : opacity;

    if (layer === 'all') {
      return (
        <g key={key}>
          <ellipse
            cx={centerXStr}
            cy="50%"
            rx={rx}
            ry={ry}
            fill="none"
            stroke={strokeGrad}
            strokeWidth={strokeW}
            opacity={finalOpacity * 0.9}
            filter="url(#orbit-glow)"
          />
          <ellipse
            cx={centerXStr}
            cy="50%"
            rx={rx}
            ry={ry}
            fill="none"
            stroke={strokeColor}
            strokeWidth={isHighlighted ? 1.5 : 0.9}
            strokeDasharray={strokeDash === 'none' ? undefined : strokeDash}
            opacity={finalOpacity}
          />
        </g>
      );
    }

    // Para 'back' o 'front' dibujamos arcos SVG exactos utilizando coordenadas relativas a 'cx'
    // 'back': desde (cx - rx, 50%) hasta (cx + rx, 50%) pasando por el arco superior
    // 'front': desde (cx + rx, 50%) hasta (cx - rx, 50%) pasando por el arco inferior
    const sweepFlag = layer === 'back' ? 1 : 1;
    const pathD =
      layer === 'back'
        ? `M calc(${centerXStr} - ${rx}px) 50% A ${rx} ${ry} 0 0 1 calc(${centerXStr} + ${rx}px) 50%`
        : `M calc(${centerXStr} + ${rx}px) 50% A ${rx} ${ry} 0 0 1 calc(${centerXStr} - ${rx}px) 50%`;

    return (
      <g key={key}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeGrad}
          strokeWidth={strokeW}
          opacity={finalOpacity * 0.9}
          filter="url(#orbit-glow)"
        />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isHighlighted ? 1.5 : 0.9}
          strokeDasharray={strokeDash === 'none' ? undefined : strokeDash}
          opacity={finalOpacity}
        />
      </g>
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      {/* 1. Capa Vectorial SVG con las pistas orbitales estructuradas */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <defs>
          {/* Gradiente Polo Workspace (Cyan / Proyecto) */}
          <linearGradient id="orbit-grad-workspace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={activeProjectColor} stopOpacity="0.5" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
          </linearGradient>

          {/* Gradiente Polo Habit Core (Esmeralda / Menta) */}
          <linearGradient id="orbit-grad-habits" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
          </linearGradient>

          {/* Gradiente para el puente cósmico */}
          <linearGradient id="bridge-grad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={activeProjectColor} stopOpacity="0.35" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
          </linearGradient>

          {/* Resplandor de órbita fina */}
          <filter id="orbit-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {layoutMode === 'panoramic' ? (
          <g>
            {/* Puente Gravitacional (Líneas cósmicas onduladas que unen los dos polos) */}
            {(layer === 'back' || layer === 'all') && (
              <path
                d={`M calc(50% + ${workspaceCenter.x}px) 50% Q 50% calc(50% - 26px) calc(50% + ${habitsCenter.x}px) 50%`}
                fill="none"
                stroke="url(#bridge-grad)"
                strokeWidth="1.3"
                strokeDasharray="4 6"
                className="opacity-55"
              />
            )}
            {(layer === 'front' || layer === 'all') && (
              <path
                d={`M calc(50% + ${workspaceCenter.x}px) 50% Q 50% calc(50% + 22px) calc(50% + ${habitsCenter.x}px) 50%`}
                fill="none"
                stroke="url(#bridge-grad)"
                strokeWidth="1"
                strokeDasharray="2 8"
                className="opacity-45"
              />
            )}

            {/* Órbitas del Polo WORKSPACE (Izquierda) */}
            <g>
              {POLE_ORBITAL_TRACKS.map((track) => {
                const rx = (workspaceRadiusX * track.radiusX) / 200;
                const ry = (workspaceRadiusY * track.radiusY) / 135;
                const isHighlighted =
                  Boolean(hoveredModule && hoveredModule.pole === 'workspace' && hoveredModule.orbitTrackIndex === track.index);

                return renderTrackArc(
                  `ws-${track.index}`,
                  `50% + ${workspaceCenter.x}px`,
                  rx,
                  ry,
                  'url(#orbit-grad-workspace)',
                  '#38bdf8',
                  track.strokeDash,
                  track.opacity,
                  isHighlighted
                );
              })}
            </g>

            {/* Órbitas del Polo HABIT CORE (Derecha) */}
            <g>
              {POLE_ORBITAL_TRACKS.map((track) => {
                const rx = (habitsRadiusX * track.radiusX) / 200;
                const ry = (habitsRadiusY * track.radiusY) / 135;
                const isHighlighted =
                  Boolean(hoveredModule && hoveredModule.pole === 'habits' && hoveredModule.orbitTrackIndex === track.index);

                return renderTrackArc(
                  `hb-${track.index}`,
                  `50% + ${habitsCenter.x}px`,
                  rx,
                  ry,
                  'url(#orbit-grad-habits)',
                  '#34d399',
                  track.strokeDash,
                  track.opacity,
                  isHighlighted
                );
              })}
            </g>
          </g>
        ) : (
          /* MODO FOCUS / MÓVIL */
          <g>
            {POLE_ORBITAL_TRACKS.map((track) => {
              const isWs = activePole === 'workspace';
              const baseRx = isWs ? workspaceRadiusX : habitsRadiusX;
              const baseRy = isWs ? workspaceRadiusY : habitsRadiusY;
              const rx = (baseRx * track.radiusX) / 200;
              const ry = (baseRy * track.radiusY) / 135;
              const gradId = isWs ? 'url(#orbit-grad-workspace)' : 'url(#orbit-grad-habits)';
              const strokeColor = isWs ? '#38bdf8' : '#34d399';
              const isHighlighted =
                Boolean(hoveredModule && hoveredModule.pole === activePole && hoveredModule.orbitTrackIndex === track.index);

              return renderTrackArc(
                `focus-${track.index}`,
                '50%',
                rx,
                ry,
                gradId,
                strokeColor,
                track.strokeDash,
                track.opacity,
                isHighlighted
              );
            })}
          </g>
        )}
      </svg>

      {/* 2. Micro-Canvas 2D para Paquetes de Datos a 60 FPS con suavidad sub-píxel */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
      />
    </div>
  );
};
