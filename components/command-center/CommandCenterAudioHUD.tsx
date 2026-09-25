'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Radio, Languages } from 'lucide-react';
import {
  isSoundEnabled,
  setSoundEnabled,
  getSoundLanguage,
  setSoundLanguage,
  playShipWelcomeVoice,
  playSciFiBootSequence,
  startAmbientWarpDrone,
  stopAmbientWarpDrone,
} from '@/lib/soundEffects';

interface CommandCenterAudioHUDProps {
  currentUserName: string;
  isMobile?: boolean;
}

export const CommandCenterAudioHUD: React.FC<CommandCenterAudioHUDProps> = ({
  currentUserName,
  isMobile = false,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    setLang(getSoundLanguage());
  }, []);

  const handleToggleSound = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      startAmbientWarpDrone();
    } else {
      stopAmbientWarpDrone();
    }
  };

  const handleToggleLang = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLang = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
    setSoundLanguage(nextLang);
  };

  const handleReplayGreeting = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enabled) {
      setEnabled(true);
      setSoundEnabled(true);
    }
    setIsPlayingGreeting(true);
    playSciFiBootSequence();
    setTimeout(() => {
      playShipWelcomeVoice(currentUserName, lang);
      startAmbientWarpDrone();
      setIsPlayingGreeting(false);
    }, 450);
  };

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#030712]/80 border border-white/10 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] select-none pointer-events-auto transition-all duration-300">
      {/* Boton Mute / Unmute */}
      <button
        type="button"
        onClick={handleToggleSound}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all duration-300 ${
          enabled
            ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
            : 'text-zinc-500 hover:text-zinc-300 bg-zinc-900/40 border border-transparent'
        }`}
        title={enabled ? 'Silenciar audio de cabina' : 'Activar audio espacial'}
        aria-label={enabled ? 'Audio de nave activado' : 'Audio silenciado'}
      >
        {enabled ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            {/* Animacion de ondas de sonido */}
            <span className="flex items-center gap-0.5 h-2.5 px-0.5">
              <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 h-3 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-zinc-500">Mute</span>
          </>
        )}
      </button>

      {/* Selector de idioma ES / EN */}
      <button
        type="button"
        onClick={handleToggleLang}
        className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors flex items-center gap-1"
        title={`Idioma de cabina: ${lang.toUpperCase()} (Clic para alternar)`}
      >
        <Languages className="w-2.5 h-2.5 text-zinc-500" />
        <span className={lang === 'es' ? 'text-cyan-300' : 'text-zinc-500'}>ES</span>
        <span className="text-zinc-600">/</span>
        <span className={lang === 'en' ? 'text-cyan-300' : 'text-zinc-500'}>EN</span>
      </button>

      {/* Boton Com-Link: Reproducir saludo de nave bajo demanda */}
      <button
        type="button"
        onClick={handleReplayGreeting}
        disabled={isPlayingGreeting}
        className={`p-1 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all duration-300 ${
          isPlayingGreeting ? 'animate-pulse text-cyan-400' : ''
        }`}
        title="Enlace de cabina (Com-Link) / Repetir saludo de la nave"
        aria-label="Repetir saludo de cabina"
      >
        <Radio className="w-3 h-3" />
      </button>
    </div>
  );
};
