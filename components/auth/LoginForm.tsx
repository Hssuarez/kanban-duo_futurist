'use client';

import React, { useState, useRef } from 'react';
import { Kanban, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { loginWithCredentials } from '@/lib/storage';
import { User } from '@/lib/types';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Aceternity 3D Card tilt states
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth tilt: max 12 degrees
    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotate({ x: rotX, y: rotY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
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
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 relative font-sans selection:bg-zinc-800 overflow-hidden">
      {/* Aceternity Dot Background with Radial Fade Mask */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 25%, transparent 80%)',
        }}
      />

      {/* Aceternity Ambient Spotlight Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[340px] pointer-events-none opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(120, 119, 198, 0.35) 0%, rgba(6, 182, 212, 0.1) 45%, transparent 80%)',
        }}
      />

      {/* 3D Card Container with Perspective */}
      <div
        className="w-full max-w-sm relative z-10 py-4"
        style={{ perspective: '1000px' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Aceternity 3D Card Body */}
        <div
          ref={cardRef}
          style={{
            transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${
              isHovered ? 1.02 : 1
            }, ${isHovered ? 1.02 : 1}, 1)`,
            transition: isHovered
              ? 'transform 0.08s ease-out'
              : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full bg-zinc-900/90 backdrop-blur-xl border border-white/[0.1] hover:border-cyan-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 sm:p-8 overflow-hidden group"
        >
          {/* Dynamic Light Glare Overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-20"
            style={{
              background: `radial-gradient(400px circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${glare.opacity}), transparent 80%)`,
            }}
          />

          {/* 3D Card Item 1: Floating Branding (translateZ: 45px) */}
          <div
            style={{
              transform: isHovered ? 'translateZ(45px)' : 'translateZ(0px)',
              transition: 'transform 0.25s ease-out',
            }}
            className="text-center mb-6 relative z-10"
          >
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
            <div
              style={{
                transform: isHovered ? 'translateZ(30px)' : 'translateZ(0px)',
                transition: 'transform 0.2s ease-out',
              }}
              className="flex items-start gap-2 p-3 mb-4 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg animate-fade-in relative z-10"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* 3D Card Item 2: Form Inputs (translateZ: 25px) */}
          <form
            onSubmit={handleSubmit}
            style={{
              transform: isHovered ? 'translateZ(25px)' : 'translateZ(0px)',
              transition: 'transform 0.25s ease-out',
            }}
            className="space-y-3.5 relative z-10"
          >
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

            {/* 3D Card Item 3: Submit Button (translateZ: 38px) */}
            <div
              style={{
                transform: isHovered ? 'translateZ(38px)' : 'translateZ(0px)',
                transition: 'transform 0.25s ease-out',
              }}
              className="pt-2"
            >
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

          {/* Security Footer (translateZ: 15px) */}
          <div
            style={{
              transform: isHovered ? 'translateZ(15px)' : 'translateZ(0px)',
              transition: 'transform 0.25s ease-out',
            }}
            className="mt-6 pt-4 border-t border-white/[0.06] text-center relative z-10"
          >
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
