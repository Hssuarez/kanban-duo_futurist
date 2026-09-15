'use client';

import React, { useState } from 'react';
import { Kanban, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
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

  // Normalized mouse coordinates (-0.5 to 0.5) for ambient Globe tracking & card micro-depth
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const normX = clientX / innerWidth - 0.5;
    const normY = clientY / innerHeight - 0.5;
    setMousePos({ x: normX, y: normY });
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
      className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans selection:bg-zinc-800 overflow-x-hidden overflow-y-auto"
    >
      {/* 1. FONDO: Subtle Atmospheric Deep Space Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(6, 182, 212, 0.08) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59, 130, 246, 0.04) 0%, transparent 60%)',
        }}
      />

      {/* 2. CONSTELACIONES: Interactive Constellation Background (Canvas 2D, 60fps, Radial Zone) */}
      <InteractiveConstellationBackground
        isDimmed={isCardHovered}
        className="absolute inset-0 z-0"
      />

      {/* 3. GLOBE: Aceternity COBE WebGL Globe Layer */}
      {/* Mobile: Anchored at top (top-4 sm:top-8), centered horizontally so top hemisphere floats proudly above the card */}
      {/* Desktop (md+): Centered vertically (md:top-1/2 md:-translate-y-1/2), positioned behind/right of the card */}
      <div
        className={`absolute top-4 sm:top-8 md:top-1/2 md:-translate-y-1/2 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[2%] lg:right-[8%] xl:right-[12%] w-[330px] h-[330px] sm:w-[440px] sm:h-[440px] md:w-[560px] md:h-[560px] lg:w-[680px] lg:h-[680px] xl:w-[740px] xl:h-[740px] pointer-events-none transition-opacity duration-700 z-0 ${
          isCardHovered
            ? 'opacity-65 sm:opacity-75 lg:opacity-85'
            : 'opacity-85 sm:opacity-90 lg:opacity-95'
        }`}
        aria-hidden="true"
      >
        <Globe mousePosition={mousePos} className="w-full h-full" />
      </div>

      {/* 4. LOGIN CARD: Studio Glassmorphic Card with Micro-Tilt (z-10) */}
      <div
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        className="w-full max-w-sm relative z-10 py-2 mt-28 sm:mt-24 md:mt-0 animate-modal-enter transition-transform duration-300 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${mousePos.y * -2.5}deg) rotateY(${mousePos.x * 2.5}deg)`,
        }}
      >
        <div className="relative w-full bg-zinc-900/85 backdrop-blur-2xl border border-white/[0.1] hover:border-cyan-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.75)] p-6 sm:p-8 overflow-hidden group transition-colors">
          {/* Subtle Radial Glare */}
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(350px circle at ${(mousePos.x + 0.5) * 100}% ${(mousePos.y + 0.5) * 100}%, rgba(255, 255, 255, 0.06), transparent 80%)`,
            }}
          />

          {/* Branding */}
          <div className="text-center mb-6 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-zinc-800/90 border border-white/[0.12] text-white mx-auto flex items-center justify-center shadow-lg mb-3 group-hover:scale-105 group-hover:border-cyan-500/40 transition-all">
              <Kanban className="w-5 h-5 text-zinc-100" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Kanban<span className="text-zinc-400 font-normal">Duo</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Inicia sesión en tu espacio de trabajo colaborativo
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg animate-fade-in relative z-10">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 text-white rounded-lg focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 pr-9 py-2 text-xs bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 text-white rounded-lg focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-lg text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50 group/btn"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Entrar al espacio</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center relative z-10">
            <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              Acceso seguro con cifrado y presencia activa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
