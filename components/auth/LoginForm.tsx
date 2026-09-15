'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { loginWithCredentials } from '@/lib/storage';
import { User } from '@/lib/types';
import { Globe } from '@/components/ui/Globe';
import { InteractiveConstellationBackground } from '@/components/ui/InteractiveConstellationBackground';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Focus state: when mouse is over the login card, background activity dims softly
  const [isCardHovered, setIsCardHovered] = useState(false);

  // Target mouse coordinates (-0.5 to 0.5)
  const targetMouseRef = useRef({ x: 0, y: 0 });

  // Smooth lerped inertia coordinates for layered parallax
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Accessibility check: prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    let animId: number;
    let currentX = 0;
    let currentY = 0;

    const loop = () => {
      const target = targetMouseRef.current;
      // Gentle inertia interpolation (decay factor 0.055)
      currentX += (target.x - currentX) * 0.055;
      currentY += (target.y - currentY) * 0.055;

      setSmoothMouse({ x: currentX, y: currentY });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const normX = clientX / innerWidth - 0.5;
    const normY = clientY / innerHeight - 0.5;
    targetMouseRef.current = { x: normX, y: normY };
  };

  const handleMouseLeave = () => {
    // Return smoothly to center rest position when leaving window
    targetMouseRef.current = { x: 0, y: 0 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Credenciales no autorizadas en el sistema.');
      }
    } catch {
      setError('Error al contactar el nodo de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen md:h-screen md:max-h-screen bg-[#050811] flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans selection:bg-cyan-500/30 selection:text-white overflow-x-hidden overflow-y-auto md:overflow-hidden"
    >
      {/* 1. FONDO: Deep Space Vignette with Subtle Layered Parallax (2-3px) */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-transform duration-100 ease-out will-change-transform"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 25% 35%, rgba(6, 182, 212, 0.08) 0%, transparent 65%), radial-gradient(ellipse 65% 55% at 85% 50%, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
          transform: `translate3d(${smoothMouse.x * 4}px, ${smoothMouse.y * 4}px, 0)`,
        }}
      />

      {/* 2. CONSTELACIONES: Interactive Constellation Background with Parallax (4-6px) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(${smoothMouse.x * 8}px, ${smoothMouse.y * 8}px, 0)`,
        }}
      >
        <InteractiveConstellationBackground
          isDimmed={isCardHovered}
          className="w-full h-full"
        />
      </div>

      {/* 3. GLOBE: Cinematic Globe Layer with Traveling Paths and Depth Parallax (8-10px) */}
      {/* Desktop (md+): Scale 720px-940px, positioned in center-right behind the card */}
      {/* Mobile (<md): Anchored at top (top-4 sm:top-8), centered horizontally so upper hemisphere crowns the card */}
      <div
        className={`absolute top-4 sm:top-8 md:top-1/2 md:-translate-y-1/2 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[-6%] lg:right-[0%] xl:right-[5%] w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[720px] md:h-[720px] lg:w-[840px] lg:h-[840px] xl:w-[940px] xl:h-[940px] pointer-events-none transition-[opacity,transform] duration-700 z-0 will-change-transform ${
          isCardHovered
            ? 'opacity-65 sm:opacity-75 lg:opacity-80'
            : 'opacity-82 sm:opacity-88 lg:opacity-95'
        }`}
        style={{
          transform: `translate3d(${smoothMouse.x * 14}px, ${smoothMouse.y * 14}px, 0)`,
        }}
        aria-hidden="true"
      >
        <Globe mousePosition={smoothMouse} className="w-full h-full" />
      </div>

      {/* 4. LOGIN CARD: Presence augmented by ~10% (max-w-[420px], p-8 sm:p-10), 3D micro-tilt (±4-6 deg) and deep glassmorphism (z-10) */}
      <div
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        className="w-full max-w-[420px] relative z-10 py-2 mt-28 sm:mt-24 md:mt-0 animate-modal-enter transition-[transform,box-shadow] duration-200 ease-out will-change-transform"
        style={{
          transform: `perspective(1000px) rotateX(${smoothMouse.y * -4.5}deg) rotateY(${smoothMouse.x * 4.5}deg) translate3d(${smoothMouse.x * -6}px, ${smoothMouse.y * -6}px, 0)`,
        }}
      >
        <div className="relative w-full bg-[#070c18]/88 backdrop-blur-2xl border border-cyan-500/22 hover:border-cyan-400/38 rounded-3xl shadow-[0_25px_65px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.09)] p-8 sm:p-10 overflow-hidden group transition-all">
          {/* Top Edge Refraction Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

          {/* Subtle Radial Glare Tracking Mouse */}
          <div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(420px circle at ${(smoothMouse.x + 0.5) * 100}% ${(smoothMouse.y + 0.5) * 100}%, rgba(6, 182, 212, 0.07), transparent 80%)`,
            }}
          />

          {/* Branding Header */}
          <div className="text-center mb-6 relative z-10">
            {/* Logo Badge */}
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-white mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.22)] mb-3.5 group-hover:scale-105 group-hover:border-cyan-400/50 transition-all">
              <div className="flex items-end gap-1 h-5" aria-hidden="true">
                <div className="w-1 h-5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                <div className="w-1 h-3.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <div className="w-1 h-4 bg-white/80 rounded-full" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              Kanban<span className="text-cyan-400 font-semibold drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Duo</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-normal">
              Inicia sesión en tu espacio de trabajo colaborativo
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/40 rounded-xl animate-fade-in relative z-10 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form Inputs with Internal Icons */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="group/field">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within/field:text-cyan-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#050914]/85 border border-slate-700/60 hover:border-slate-600 text-white rounded-xl focus:border-cyan-400/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 transition-all placeholder:text-slate-500 shadow-inner"
                />
              </div>
            </div>

            <div className="group/field">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within/field:text-cyan-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#050914]/85 border border-slate-700/60 hover:border-slate-600 text-white rounded-xl focus:border-cyan-400/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 transition-all placeholder:text-slate-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* High-Contrast Radiant Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-white via-cyan-50 to-white hover:from-cyan-100 hover:to-white text-slate-950 font-semibold rounded-xl text-xs shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 group/btn cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Entrar al espacio</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] text-center relative z-10">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-normal">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              Acceso seguro con cifrado y presencia activa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
