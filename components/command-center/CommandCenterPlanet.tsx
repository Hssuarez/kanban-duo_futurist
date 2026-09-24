'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CommandCenterModuleConfig, ModuleStatItem } from './commandCenterConfig';
import {
  Kanban,
  Calendar,
  BarChart3,
  Target,
  Activity,
  Trophy,
  Timer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CommandCenterPlanetProps {
  module: CommandCenterModuleConfig;
  stats: ModuleStatItem[];
  x: number; // Posición orbital X en px relativa al centro
  y: number; // Posición orbital Y en px relativa al centro
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onNavigate: (module: CommandCenterModuleConfig) => void;
  onDragStateChange: (moduleId: string, isDragging: boolean) => void;
}

// Mapa de iconos según módulo
const MODULE_ICONS: Record<string, React.ElementType> = {
  board: Kanban,
  calendar: Calendar,
  dashboard: BarChart3,
  goals: Target,
  habits: Activity,
  challenges: Trophy,
  pomodoro: Timer,
};

export const CommandCenterPlanet: React.FC<CommandCenterPlanetProps> = ({
  module,
  stats,
  x,
  y,
  isHovered,
  onHover,
  onNavigate,
  onDragStateChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado de rotación axial (imperativo en refs para máximo rendimiento 60 FPS)
  const rotationYawRef = useRef<number>(Math.random() * 360);
  const rotationPitchRef = useRef<number>(module.ringTiltDeg);
  const velocityYawRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const IconComponent = MODULE_ICONS[module.id] || Sparkles;

  // Generador estático determinístico de nodos en la superficie de la esfera
  const sphereNodesRef = useRef<Array<{ lat: number; lon: number; size: number }>>([]);
  if (sphereNodesRef.current.length === 0) {
    const nodes: Array<{ lat: number; lon: number; size: number }> = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      // Distribución esférica de Fibonacci
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + 5 ** 0.5) * i;
      nodes.push({
        lat: phi - Math.PI / 2, // -PI/2 a PI/2
        lon: theta % (Math.PI * 2), // 0 a 2*PI
        size: 1 + (i % 3) * 0.7,
      });
    }
    sphereNodesRef.current = nodes;
  }

  // Bucle de renderizado del micro-canvas del planeta (rotación axial propia)
  const renderPlanet = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width * 0.44;
    const cx = width / 2;
    const cy = height / 2;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Actualización de física axial (inercia al soltar o rotación ambiental continua)
    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    if (!isDraggingRef.current && !prefersReducedMotion) {
      if (Math.abs(velocityYawRef.current) > 0.01) {
        // Desaceleración por fricción suave
        rotationYawRef.current += velocityYawRef.current;
        velocityYawRef.current *= 0.94;
      } else {
        // Velocidad de crucero ambiental propia
        const baseSpeed = isHovered
          ? module.axialSpinSpeedDegPerSec * 1.6
          : module.axialSpinSpeedDegPerSec;
        rotationYawRef.current += baseSpeed * dt;
      }
    }

    ctx.clearRect(0, 0, width, height);

    // 1. Esfera base con gradiente radial de profundidad espacial
    const sphereGrad = ctx.createRadialGradient(
      cx - radius * 0.35,
      cy - radius * 0.35,
      radius * 0.1,
      cx,
      cy,
      radius
    );
    sphereGrad.addColorStop(0, module.accentHex);
    sphereGrad.addColorStop(0.35, module.color);
    sphereGrad.addColorStop(0.75, module.secondaryColor);
    sphereGrad.addColorStop(1, '#020617');

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // 2. Máscara circular para proyectar los meridianos y paralelos rotando
    ctx.clip();

    // Ángulos actuales en radianes
    const yawRad = (rotationYawRef.current * Math.PI) / 180;
    const pitchRad = (rotationPitchRef.current * Math.PI) / 180;

    // Paralelos de latitud (anillos horizontales inclinados)
    ctx.strokeStyle = module.accentHex;
    ctx.lineWidth = 0.75;
    ctx.globalAlpha = 0.22;

    const latitudes = [-0.6, -0.3, 0, 0.3, 0.6];
    for (const lat of latitudes) {
      const ringR = radius * Math.cos(lat);
      const ringY = cy + radius * Math.sin(lat) * Math.cos(pitchRad);
      const ringRy = Math.abs(ringR * Math.sin(pitchRad));

      ctx.beginPath();
      ctx.ellipse(cx, ringY, ringR, Math.max(ringRy, 2), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Nodos tecnológicos en 3D en la superficie esférica
    for (const node of sphereNodesRef.current) {
      // Rotación esférica (lon + yaw)
      const currentLon = node.lon + yawRad;
      const nx = Math.cos(node.lat) * Math.sin(currentLon);
      const ny = Math.sin(node.lat);
      const nz = Math.cos(node.lat) * Math.cos(currentLon);

      // Rotación pitch sobre eje X
      const pY = ny * Math.cos(pitchRad) - nz * Math.sin(pitchRad);
      const pZ = ny * Math.sin(pitchRad) + nz * Math.cos(pitchRad);

      // Solo dibujar nodos en el hemisferio frontal visible (pZ > -0.1)
      if (pZ > -0.1) {
        const screenX = cx + nx * radius;
        const screenY = cy + pY * radius;
        const depthAlpha = Math.max(0.1, (pZ + 0.2) / 1.2);

        ctx.globalAlpha = depthAlpha * (isHovered ? 0.9 : 0.65);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, node.size * (0.8 + depthAlpha * 0.4), 0, Math.PI * 2);
        ctx.fill();

        // Conexión sutil a nodos adyacentes si están cerca
        if (pZ > 0.4) {
          ctx.strokeStyle = module.accentHex;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = depthAlpha * 0.25;
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + nx * 8, screenY + pY * 8);
          ctx.stroke();
        }
      }
    }

    // 4. Sombra de terminador lunar / atmósfera nocturna (hemi-sombra lateral)
    const shadowGrad = ctx.createRadialGradient(
      cx + radius * 0.4,
      cy + radius * 0.4,
      radius * 0.3,
      cx,
      cy,
      radius * 1.05
    );
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.65, 'rgba(3, 7, 18, 0.4)');
    shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.92)');

    ctx.globalAlpha = 1;
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 5. Fresnel Rim Light (resplandor de borde luminoso en el limbo superior)
    const rimGrad = ctx.createRadialGradient(
      cx - radius * 0.5,
      cy - radius * 0.5,
      radius * 0.2,
      cx,
      cy,
      radius
    );
    rimGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
    rimGrad.addColorStop(0.96, module.accentHex);
    rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.7)');

    ctx.globalAlpha = isHovered ? 0.85 : 0.5;
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Continuar bucle de animación
    animFrameRef.current = requestAnimationFrame(renderPlanet);
  }, [module, isHovered]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderPlanet);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderPlanet]);

  // Manejadores de pointer events para el Drag axial exclusivo
  const handlePointerDown = (e: React.PointerEvent) => {
    // Captura del puntero para control fluido
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    velocityYawRef.current = 0;
    onDragStateChange(module.id, true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.hypot(dx, dy) > 5) {
      hasDraggedRef.current = true;
    }

    // El arrastre horizontal modifica el giro en el eje (yaw)
    const sensitivity = 0.65;
    rotationYawRef.current += (e.movementX || 0) * sensitivity;
    velocityYawRef.current = (e.movementX || 0) * sensitivity * 0.75;

    // Arrastre vertical modifica ligeramente la inclinación (pitch) en rango acotado
    rotationPitchRef.current = Math.max(
      -45,
      Math.min(45, rotationPitchRef.current + (e.movementY || 0) * 0.25)
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    onDragStateChange(module.id, false);

    // Si fue un click/tap corto sin arrastre, navegar
    if (!hasDraggedRef.current) {
      onNavigate(module);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate(module);
    }
  };

  const size = module.planetSizePx;

  return (
    // Capa 1: Posición orbital (translateX / translateY)
    <div
      ref={containerRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto select-none"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        willChange: 'transform',
      }}
      onMouseEnter={() => onHover(module.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Contenedor relativo para el planeta + anillo + etiqueta fija */}
      <div className="relative flex flex-col items-center group">
        {/* Halo de resplandor ambiental exterior */}
        <div
          className="absolute -inset-4 rounded-full blur-xl pointer-events-none transition-all duration-300"
          style={{
            background: isHovered
              ? `radial-gradient(circle, ${module.glowRgba} 0%, transparent 75%)`
              : `radial-gradient(circle, ${module.glowRgba} 0%, transparent 60%)`,
            opacity: isHovered ? 0.9 : 0.45,
            transform: isHovered ? 'scale(1.25)' : 'scale(1)',
          }}
        />

        {/* Anillo giroscópico propio - Parte posterior (detrás del planeta) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
          style={{
            width: size * 1.55,
            height: size * 0.55,
            transform: `rotate(${module.ringTiltDeg}deg)`,
          }}
        >
          <div
            className="w-full h-full rounded-full border border-dashed transition-all duration-300"
            style={{
              borderColor: isHovered ? module.accentHex : module.color,
              opacity: isHovered ? 0.75 : 0.35,
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)', // Solo mitad superior
            }}
          />
        </div>

        {/* Capa 2: Esfera interactiva (recibe pointer events para rotación axial) */}
        <button
          type="button"
          tabIndex={0}
          role="button"
          aria-label={`Módulo ${module.title}. Presiona Enter para abrir.`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          className="relative z-10 rounded-full cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070c18] transition-transform duration-200"
          style={{
            width: size,
            height: size,
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
            touchAction: 'none',
          }}
        >
          {/* Micro-canvas con la esfera 3D y paralelos/meridianos en rotación axial */}
          <canvas
            ref={canvasRef}
            width={size * 2}
            height={size * 2}
            className="w-full h-full rounded-full drop-shadow-lg"
          />

          {/* Glifo holográfico central del módulo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="p-2 rounded-xl backdrop-blur-sm border transition-all duration-300"
              style={{
                backgroundColor: isHovered
                  ? 'rgba(7, 12, 24, 0.75)'
                  : 'rgba(7, 12, 24, 0.45)',
                borderColor: isHovered ? module.accentHex : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isHovered ? `0 0 15px ${module.glowRgba}` : 'none',
              }}
            >
              <IconComponent
                className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200"
                style={{
                  color: isHovered ? '#ffffff' : module.accentHex,
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            </div>
          </div>
        </button>

        {/* Anillo giroscópico propio - Parte frontal (delante del planeta) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          style={{
            width: size * 1.55,
            height: size * 0.55,
            transform: `rotate(${module.ringTiltDeg}deg)`,
          }}
        >
          <div
            className="w-full h-full rounded-full border border-solid transition-all duration-300 shadow-[0_0_8px]"
            style={{
              borderColor: isHovered ? module.accentHex : module.color,
              opacity: isHovered ? 0.9 : 0.55,
              clipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)', // Solo mitad inferior
            }}
          />
        </div>

        {/* Capa 3: Etiqueta y Mini-Badge HUD Fijo (NUNCA rota con el planeta) */}
        <div className="mt-2.5 flex flex-col items-center pointer-events-none z-30">
          <div
            className="px-2.5 py-0.5 rounded-full border backdrop-blur-md flex items-center gap-1.5 transition-all duration-200"
            style={{
              backgroundColor: isHovered ? 'rgba(7, 12, 24, 0.95)' : 'rgba(7, 12, 24, 0.75)',
              borderColor: isHovered ? module.accentHex : 'rgba(255, 255, 255, 0.12)',
              boxShadow: isHovered ? `0 0 12px ${module.glowRgba}` : '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: module.accentHex }}
            />
            <span
              className="font-mono text-[11px] font-bold tracking-wider transition-colors"
              style={{ color: isHovered ? '#ffffff' : '#e4e4e7' }}
            >
              {module.title}
            </span>
          </div>

          {/* Mini-métrica compacta bajo la etiqueta */}
          {stats.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-zinc-400">
              <span>{stats[0].value}</span>
              <span className="text-zinc-500 font-sans text-[9px]">{stats[0].label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
