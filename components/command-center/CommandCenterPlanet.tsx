'use client';

import React, { useRef } from 'react';
import { CommandCenterModuleConfig, ModuleStatItem } from './commandCenterConfig';
import {
  Kanban,
  Calendar,
  BarChart3,
  Target,
  Activity,
  Trophy,
  Timer,
  Sparkles,
} from 'lucide-react';
import { CommandCenterModuleCard } from './CommandCenterModuleCard';
import { PlanetSurface } from './PlanetSurface';

interface CommandCenterPlanetProps {
  module: CommandCenterModuleConfig;
  stats: ModuleStatItem[];
  x: number; // Posición orbital X en px relativa al centro
  y: number; // Posición orbital Y en px relativa al centro
  size?: number; // Diámetro escalado en px
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onNavigate: (module: CommandCenterModuleConfig) => void;
  onDragStateChange: (moduleId: string, isDragging: boolean) => void;
  isMobile?: boolean;
  positionPreference?: 'top' | 'bottom' | 'left' | 'right';
  zIndex?: number;
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
  size: sizeProp,
  isHovered,
  onHover,
  onNavigate,
  onDragStateChange,
  isMobile = false,
  positionPreference = 'right',
  zIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado de rotación axial (imperativo en refs para máximo rendimiento 60 FPS sin re-renders)
  const rotationYawRef = useRef<number>(Math.random() * 360);
  const rotationPitchRef = useRef<number>(module.ringTiltDeg);
  const velocityYawRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerXRef = useRef<number>(0);
  const lastPointerYRef = useRef<number>(0);
  const lastPointerTimeRef = useRef<number>(0);
  const recentVelocityRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  const IconComponent = MODULE_ICONS[module.id] || Sparkles;

  // Manejadores de pointer events para el Drag axial exclusivo
  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPointerXRef.current = e.clientX;
    lastPointerYRef.current = e.clientY;
    lastPointerTimeRef.current = performance.now();
    velocityYawRef.current = 0;
    recentVelocityRef.current = 0;
    onDragStateChange(module.id, true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const totalDx = e.clientX - dragStartRef.current.x;
    const totalDy = e.clientY - dragStartRef.current.y;

    if (Math.hypot(totalDx, totalDy) > 5) {
      hasDraggedRef.current = true;
    }

    const deltaX = e.clientX - lastPointerXRef.current;
    const deltaY = e.clientY - lastPointerYRef.current;
    lastPointerXRef.current = e.clientX;
    lastPointerYRef.current = e.clientY;

    // Sensibilidad calibrada: ~100px equivale a ~90° de giro (0.9°/px)
    const sensitivity = 0.9;
    rotationYawRef.current += deltaX * sensitivity;

    // Medición de velocidad instantánea suavizada para inercia al soltar
    const now = performance.now();
    const dt = Math.max((now - lastPointerTimeRef.current) / 1000, 0.008);
    lastPointerTimeRef.current = now;

    const instVelocity = (deltaX * sensitivity) / (dt * 60);
    recentVelocityRef.current = recentVelocityRef.current * 0.4 + instVelocity * 0.6;

    // Inclinación pitch en rango acotado [-45°, 45°]
    rotationPitchRef.current = Math.max(
      -45,
      Math.min(45, rotationPitchRef.current + deltaY * 0.3)
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    onDragStateChange(module.id, false);

    // Si hubo arrastre, transferir velocidad residual amortiguada (inercia 400-800ms)
    if (hasDraggedRef.current) {
      velocityYawRef.current = Math.max(-14, Math.min(14, recentVelocityRef.current));
    } else {
      velocityYawRef.current = 0;
      // Click o tap corto sin arrastre
      if (isMobile) {
        if (isHovered) {
          onNavigate(module);
        } else {
          onHover(module.id);
        }
      } else {
        onNavigate(module);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate(module);
    }
  };

  const size = sizeProp || module.planetSizePx;

  return (
    // Capa 1: Posición orbital (translateX / translateY)
    <div
      ref={containerRef}
      className="absolute top-1/2 left-1/2 pointer-events-auto select-none"
      style={{
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`,
        willChange: 'transform',
        zIndex: isHovered ? 60 : zIndex ?? 25,
      }}
      onMouseEnter={() => onHover(module.id)}
      onMouseLeave={() => {
        if (!isDraggingRef.current) {
          onHover(null);
        }
      }}
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
            opacity: isHovered ? 0.95 : 0.4,
            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
          }}
        />

        {/* Anillo giroscópico propio - Parte posterior (detrás del planeta) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
          style={{
            width: size * 1.58,
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
          {/* Micro-canvas con la superficie 3D esférica de alta fidelidad */}
          <PlanetSurface
            module={module}
            size={size}
            rotationYawRef={rotationYawRef}
            rotationPitchRef={rotationPitchRef}
            velocityYawRef={velocityYawRef}
            isDraggingRef={isDraggingRef}
            isHovered={isHovered}
          />

          {/* Glifo flotante translúcido y sutil que permite ver la rotación de los meridianos detrás */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full backdrop-blur-[2px] border flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: isHovered
                  ? 'rgba(7, 12, 24, 0.45)'
                  : 'rgba(7, 12, 24, 0.22)',
                borderColor: isHovered ? module.accentHex : 'rgba(255, 255, 255, 0.16)',
                boxShadow: isHovered ? `0 0 16px ${module.glowRgba}` : '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <IconComponent
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200"
                style={{
                  color: isHovered ? '#ffffff' : module.accentHex,
                  transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                  filter: isHovered ? `drop-shadow(0 0 6px ${module.accentHex})` : 'none',
                }}
              />
            </div>
          </div>
        </button>

        {/* Anillo giroscópico propio - Parte frontal (delante del planeta) con micro-satélite */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          style={{
            width: size * 1.58,
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
          {/* Micro-satélite orbital en el anillo */}
          <div
            className="absolute w-1.5 h-1.5 rounded-full transition-opacity duration-300 pointer-events-none"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: `0 0 6px ${module.accentHex}`,
              bottom: '0px',
              left: '50%',
              transform: 'translate(-50%, 50%)',
              opacity: isHovered ? 1 : 0.6,
            }}
          />
        </div>

        {/* Capa 3: Etiqueta y Mini-Badge HUD Fijo (NUNCA rota con el planeta) */}
        <div className="mt-1 sm:mt-2.5 flex flex-col items-center pointer-events-none z-30">
          <div
            className="px-2 sm:px-2.5 py-0.5 rounded-full border backdrop-blur-md flex items-center gap-1 sm:gap-1.5 transition-all duration-200"
            style={{
              backgroundColor: isHovered ? 'rgba(7, 12, 24, 0.95)' : 'rgba(7, 12, 24, 0.75)',
              borderColor: isHovered ? module.accentHex : 'rgba(255, 255, 255, 0.12)',
              boxShadow: isHovered ? `0 0 12px ${module.glowRgba}` : '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: module.accentHex }}
            />
            <span
              className="font-mono text-[9px] sm:text-[11px] font-bold tracking-wider transition-colors max-w-[80px] sm:max-w-none truncate"
              style={{ color: isHovered ? '#ffffff' : '#e4e4e7' }}
            >
              {module.title}
            </span>
          </div>

          {/* Mini-métrica compacta bajo la etiqueta (solo en pantallas sm o mayores) */}
          {stats.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 mt-1 text-[10px] font-mono text-zinc-400">
              <span>{stats[0].value}</span>
              <span className="text-zinc-500 font-sans text-[9px]">{stats[0].label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta Contextual Flotante (Desktop/Tablet) dentro del mismo contenedor de hover */}
      {!isMobile && (
        <CommandCenterModuleCard
          module={module}
          stats={stats}
          isHovered={isHovered}
          isDragging={isDraggingRef.current}
          onNavigate={() => onNavigate(module)}
          positionPreference={positionPreference}
          planetSize={size}
        />
      )}
    </div>
  );
};
