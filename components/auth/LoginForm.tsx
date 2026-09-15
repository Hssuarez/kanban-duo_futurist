'use client';

import React, { useState } from 'react';
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

  // Card-local 3D micro-tilt and spotlight tracking (independent of stars and background)
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Micro tilt strictly between -3.5deg and 3.5deg
    const rotateX = ((y - centerY) / centerY) * -3.5;
    const rotateY = ((x - centerX) / centerX) * 3.5;
    e.currentTarget.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--card-mouse-x', `${x.toFixed(1)}px`);
    e.currentTarget.style.setProperty('--card-mouse-y', `${y.toFixed(1)}px`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsCardHovered(false);
    e.currentTarget.style.setProperty('--card-rotate-x', '0deg');
    e.currentTarget.style.setProperty('--card-rotate-y', '0deg');
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
    <div className="min-h-screen md:h-screen md:max-h-screen bg-[#050811] flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans selection:bg-cyan-500/30 selection:text-white overflow-x-hidden overflow-y-auto md:overflow-hidden">
      {/* 1. CAPA FONDO: Deep Space Vignette (Fijo, sin transform global) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 25% 35%, rgba(6, 182, 212, 0.08) 0%, transparent 65%), radial-gradient(ellipse 65% 55% at 85% 50%, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
        }}
      />

      {/* 2. CAPA CONSTELACIONES: Canvas interactivo fijo (reacción 100% interna sin mover el canvas) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <InteractiveConstellationBackground
          isDimmed={isCardHovered}
          className="w-full h-full"
        />
      </div>

      {/* 3. CAPA GLOBE: Posición base estable (no responde al movimiento de las estrellas) */}
      <div
        className={`absolute top-4 sm:top-8 md:top-1/2 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:-translate-y-1/2 md:right-[0%] lg:right-[4%] xl:right-[8%] w-[330px] h-[330px] sm:w-[440px] sm:h-[440px] md:w-[720px] md:h-[720px] lg:w-[840px] lg:h-[840px] xl:w-[940px] xl:h-[940px] pointer-events-none transition-opacity duration-700 z-0 ${
          isCardHovered
            ? 'opacity-65 sm:opacity-75 lg:opacity-80'
            : 'opacity-82 sm:opacity-88 lg:opacity-95'
        }`}
        aria-hidden="true"
      >
        <Globe className="w-full h-full" />
      </div>

      {/* 4. CAPA LOGIN CARD: Posición fija y estable en layout, micro-tilt y spotlight internos e independientes */}
      <div
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={handleCardMouseLeave}
        onMouseMove={handleCardMouseMove}
        className="w-full max-w-[420px] relative z-10 py-2 mt-28 sm:mt-24 md:mt-0 animate-modal-enter transition-[box-shadow] duration-200 ease-out will-change-transform"
        style={{
          transform: 'perspective(1000px) rotateX(var(--card-rotate-x, 0deg)) rotateY(var(--card-rotate-y, 0deg))',
        }}
      >
        <div className="relative w-full bg-[#070c18]/88 backdrop-blur-2xl border border-cyan-500/22 hover:border-cyan-400/38 rounded-3xl shadow-[0_25px_65px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.09)] p-8 sm:p-10 overflow-hidden group transition-all">
          {/* Top Edge Refraction Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

          {/* Subtle Radial Glare Tracking Mouse internally inside Card */}
          <div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(350px circle at var(--card-mouse-x, 50%) var(--card-mouse-y, 50%), rgba(6, 182, 212, 0.08), transparent 80%)',
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
