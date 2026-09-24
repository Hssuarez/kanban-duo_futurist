'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '@/lib/types';
import { Layers, ChevronDown, Plus, Check, Sparkles, FolderPlus, X } from 'lucide-react';

interface CommandCenterProjectCoreProps {
  activeProject: Project | null;
  accessibleProjects: Project[];
  taskCount: number;
  onSelectProject: (projectId: string) => void;
  onOpenCreateProject?: () => void;
  scale?: number;
  onCoreClick?: () => void;
  isDropdownOpen?: boolean;
  onDropdownOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
}

export const CommandCenterProjectCore: React.FC<CommandCenterProjectCoreProps> = ({
  activeProject,
  accessibleProjects,
  taskCount,
  onSelectProject,
  onOpenCreateProject,
  scale = 1,
  onCoreClick,
  isDropdownOpen: propIsDropdownOpen,
  onDropdownOpenChange,
  isMobile: propIsMobile,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isDropdownOpen = propIsDropdownOpen !== undefined ? propIsDropdownOpen : internalOpen;
  const setDropdownOpen = (open: boolean) => {
    setInternalOpen(open);
    onDropdownOpenChange?.(open);
  };

  const [isMounted, setIsMounted] = useState(false);
  const [internalIsMobile, setInternalIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setInternalIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobile = propIsMobile !== undefined ? propIsMobile : internalIsMobile;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileModalRef = useRef<HTMLDivElement>(null);
  const baseSize = 190 * scale;
  const projectColor = activeProject?.color || '#06b6d4';

  // Cerrar menú al hacer clic fuera (en escritorio)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Si el clic ocurrió dentro del disparador/núcleo, ignorar
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      // Si estamos en móvil y el clic ocurrió dentro de la tarjeta modal, ignorar
      if (mobileModalRef.current && mobileModalRef.current.contains(target)) {
        return;
      }
      setDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const renderProjectList = (isMobileView: boolean) => (
    <>
      <div className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-white/10 text-[10px] sm:text-[11px] font-mono text-zinc-300">
        <div className="flex items-center gap-1.5 font-bold tracking-wider">
          <span>PROYECTOS DISPONIBLES</span>
          <span className="text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded-full border border-cyan-500/30 text-[10px]">
            {accessibleProjects.length}
          </span>
        </div>
        {isMobileView && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(false);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="max-h-56 sm:max-h-48 overflow-y-auto space-y-1.5 sm:space-y-1 py-1 custom-scrollbar">
        {accessibleProjects.map((p) => {
          const isSelected = activeProject?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProject(p.id);
                setDropdownOpen(false);
              }}
              className={`w-full min-h-[44px] sm:min-h-0 flex items-center justify-between px-3 py-2.5 sm:py-1.5 rounded-xl text-left text-xs font-mono transition-all cursor-pointer active:scale-[0.98] ${
                isSelected
                  ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'hover:bg-white/[0.06] active:bg-white/[0.1] text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: p.color || '#3b82f6' }}
                />
                <span className="truncate">{p.name}</span>
              </div>
              {isSelected && <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {onOpenCreateProject && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(false);
            onOpenCreateProject();
          }}
          className="w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 py-2 sm:py-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 active:bg-cyan-950/30 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nuevo Proyecto</span>
        </button>
      )}
    </>
  );

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
        isDropdownOpen ? 'z-50' : 'z-20'
      } flex flex-col items-center justify-center select-none cursor-default group`}
      style={{ width: baseSize * 1.5, height: baseSize * 1.5 }}
    >
      {/* 1. Halo de atmósfera exterior reactiva al color del proyecto */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 animate-pulse"
        style={{
          width: baseSize * 1.35,
          height: baseSize * 1.35,
          background: `radial-gradient(circle, ${projectColor}33 0%, rgba(59, 130, 246, 0.12) 50%, transparent 75%)`,
          filter: 'blur(24px)',
        }}
      />

      {/* 2. Anillos orbitales tecnológicos */}
      <div
        className="absolute rounded-full border border-dashed pointer-events-none animate-[spin_60s_linear_infinite]"
        style={{
          width: baseSize * 1.25,
          height: baseSize * 1.25,
          borderColor: `${projectColor}40`,
        }}
      />
      <div
        className="absolute rounded-full border border-dotted pointer-events-none animate-[spin_45s_linear_infinite_reverse]"
        style={{
          width: baseSize * 1.12,
          height: baseSize * 1.12,
          borderColor: 'rgba(59, 130, 246, 0.25)',
        }}
      />

      {/* 3. Esfera central holográfica del Proyecto Activo */}
      <div
        onClick={() => {
          if (!activeProject && onOpenCreateProject) {
            onOpenCreateProject();
          } else if (onCoreClick) {
            onCoreClick();
          }
        }}
        className="relative rounded-full border shadow-2xl flex flex-col items-center justify-center text-center p-2 sm:p-4 backdrop-blur-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.03] cursor-pointer"
        style={{
          width: baseSize,
          height: baseSize,
          borderColor: `${projectColor}60`,
          boxShadow: `0 0 40px ${projectColor}35, inset 0 0 25px rgba(0,0,0,0.8)`,
          background: `radial-gradient(circle at 35% 30%, ${projectColor}30 0%, rgba(15, 23, 42, 0.9) 65%, #020617 100%)`,
        }}
      >
        {/* Rejilla holográfica interior */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '14px 14px',
            backgroundPosition: '0 0, 7px 7px',
          }}
        />

        {/* Resplandor superior de cristal */}
        <div
          className="absolute -top-10 -left-10 rounded-full pointer-events-none"
          style={{
            width: baseSize * 0.8,
            height: baseSize * 0.6,
            background:
              'radial-gradient(ellipse at 40% 40%, rgba(255, 255, 255, 0.35) 0%, rgba(6, 182, 212, 0.15) 45%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />

        {/* Contenido si hay proyecto activo */}
        {activeProject ? (
          <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1 max-w-[90%]">
            {/* Indicador de Polo */}
            <div
              onClick={(e) => {
                if (accessibleProjects.length > 1) {
                  e.stopPropagation();
                  setDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300 tracking-wider ${
                accessibleProjects.length > 1 ? 'cursor-pointer hover:bg-cyan-900/60' : ''
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: projectColor }} />
              <span>WORKSPACE</span>
            </div>

            {/* Nombre del Proyecto */}
            <h3
              onClick={(e) => {
                if (accessibleProjects.length > 1) {
                  e.stopPropagation();
                  setDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`font-mono font-black tracking-wide text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] truncate max-w-[130px] sm:max-w-[160px] leading-tight mt-0.5 ${
                accessibleProjects.length > 1 ? 'cursor-pointer hover:text-cyan-300' : ''
              }`}
              style={{ fontSize: scale < 0.7 ? '11px' : scale < 0.9 ? '13px' : '15px' }}
              title={activeProject.name}
            >
              {activeProject.name}
            </h3>

            {/* Tareas del Proyecto */}
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-zinc-300">
              <span className="font-bold text-cyan-300">{taskCount}</span>
              <span className="text-zinc-400">{taskCount === 1 ? 'tarea' : 'tareas'}</span>
            </div>

            {/* Botón Switcher para desplegar proyectos */}
            {accessibleProjects.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!isDropdownOpen);
                }}
                className="mt-1 px-2.5 py-1 sm:py-0.5 rounded-lg sm:rounded-md bg-cyan-500/20 sm:bg-white/10 hover:bg-cyan-500/30 sm:hover:bg-white/20 border border-cyan-400/40 sm:border-white/15 text-[9px] sm:text-[9px] font-mono font-semibold text-cyan-200 sm:text-zinc-200 flex items-center gap-1.5 sm:gap-1 transition-all active:scale-95 cursor-pointer z-10 shadow-sm shadow-cyan-500/10"
                title="Cambiar proyecto activo"
              >
                <span>Cambiar</span>
                <ChevronDown className={`w-3 h-3 sm:w-2.5 sm:h-2.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        ) : (
          /* Estado sin proyecto (Nuevo usuario) */
          <div className="relative z-10 flex flex-col items-center gap-1 p-1 max-w-[95%] text-center">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
            </div>
            <span className="font-mono text-[9px] sm:text-[11px] font-bold text-amber-300 leading-tight">
              SIN PROYECTO
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateProject?.();
              }}
              className="mt-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-[9px] sm:text-[10px] flex items-center gap-1 shadow-md shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Crear primero</span>
            </button>
          </div>
        )}
      </div>

      {/* 4A. Modal Móvil Holográfico en Portal: 100% centrado en la pantalla del celular */}
      {isDropdownOpen && isMobile && isMounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto animate-fade-in">
          {/* Telón de fondo oscuro táctil */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setDropdownOpen(false)}
          />

          {/* Tarjeta Modal Centrada para Móvil */}
          <div
            ref={mobileModalRef}
            style={{ backgroundColor: '#070c18' }}
            className="relative w-full max-w-[320px] rounded-2xl border border-cyan-500/40 bg-[#070c18] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/25 z-10 overflow-hidden animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {renderProjectList(true)}
          </div>
        </div>,
        document.body
      )}

      {/* 4B. Dropdown Holográfico de Escritorio: Anclado matemáticamente bajo el Núcleo Central */}
      {isDropdownOpen && !isMobile && (
        <div
          style={{ backgroundColor: '#070c18' }}
          className="hidden sm:block absolute top-[85%] left-1/2 z-50 w-60 sm:w-64 p-2.5 rounded-2xl border border-cyan-500/40 bg-[#070c18] backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/20 animate-dropdown-centered"
        >
          {renderProjectList(false)}
        </div>
      )}
    </div>
  );
};
