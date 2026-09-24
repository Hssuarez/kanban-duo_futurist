'use client';

import React from 'react';
import { CommandCenterModuleConfig, ModuleStatItem } from './commandCenterConfig';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CommandCenterModuleCardProps {
  module: CommandCenterModuleConfig;
  stats: ModuleStatItem[];
  isHovered: boolean;
  onNavigate: () => void;
  positionPreference?: 'top' | 'bottom' | 'left' | 'right';
  planetSize?: number;
  isDragging?: boolean;
}

export const CommandCenterModuleCard: React.FC<CommandCenterModuleCardProps> = ({
  module,
  stats,
  isHovered,
  onNavigate,
  positionPreference = 'right',
  planetSize = 80,
  isDragging = false,
}) => {
  const visible = isHovered && !isDragging;
  const offset = Math.round(planetSize / 2 + 14);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onNavigate();
      }}
      className={`absolute z-40 cursor-pointer transition-all duration-200 select-none ${
        visible
          ? 'opacity-100 scale-100 pointer-events-auto shadow-2xl'
          : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{
        width: '230px',
        top:
          positionPreference === 'bottom'
            ? `calc(50% + ${offset}px)`
            : positionPreference === 'left' || positionPreference === 'right'
            ? '50%'
            : undefined,
        bottom: positionPreference === 'top' ? `calc(50% + ${offset}px)` : undefined,
        left:
          positionPreference === 'right'
            ? `calc(50% + ${offset}px)`
            : positionPreference === 'top' || positionPreference === 'bottom'
            ? '50%'
            : undefined,
        right: positionPreference === 'left' ? `calc(50% + ${offset}px)` : undefined,
        transform:
          positionPreference === 'top' || positionPreference === 'bottom'
            ? visible
              ? 'translateX(-50%)'
              : positionPreference === 'bottom'
              ? 'translateX(-50%) translateY(8px)'
              : 'translateX(-50%) translateY(-8px)'
            : visible
            ? 'translateY(-50%)'
            : 'translateY(-45%)',
      }}
    >
      <div
        className="rounded-2xl p-3.5 border backdrop-blur-xl transition-all duration-300 relative overflow-hidden group/card"
        style={{
          backgroundColor: 'rgba(7, 12, 24, 0.92)',
          borderColor: isHovered ? module.accentHex : 'rgba(255, 255, 255, 0.12)',
          boxShadow: isHovered
            ? `0 0 25px ${module.glowRgba}, 0 10px 30px rgba(0,0,0,0.8)`
            : '0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        {/* Glow ambient de fondo */}
        <div
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity"
          style={{ backgroundColor: module.color }}
        />

        {/* Encabezado de la tarjeta */}
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px]"
              style={{ backgroundColor: module.accentHex }}
            />
            <span className="font-mono text-xs font-bold text-white tracking-wider truncate">
              {module.title}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 group-hover/card:translate-x-0.5 transition-transform shrink-0">
            <span>Abrir</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Subtítulo breve */}
        <p className="text-[11px] text-zinc-400 mb-2.5 line-clamp-1">
          {module.subtitle}
        </p>

        {/* Rejilla de métricas reales */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.04]">
            {stats.slice(0, 3).map((st, i) => (
              <div
                key={i}
                className={`p-1.5 rounded-lg bg-zinc-950/60 border border-white/[0.04] ${
                  i === 2 ? 'col-span-2' : ''
                }`}
              >
                <div className="text-[10px] text-zinc-400 font-sans truncate">
                  {st.label}
                </div>
                <div
                  className="font-mono text-xs sm:text-sm font-bold tracking-tight"
                  style={{ color: st.highlight ? module.accentHex : '#f4f4f5' }}
                >
                  {st.prefix || ''}{st.value}{st.suffix || ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
