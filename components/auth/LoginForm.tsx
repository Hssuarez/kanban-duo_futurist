'use client';

import React, { useState } from 'react';
import { Kanban, Lock, Mail, Eye, EyeOff, AlertCircle, Cpu, Zap, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center p-4 relative overflow-hidden font-mono">
      {/* Background Cyberpunk Ambient Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Cyberpunk HUD Frame */}
      <div className="w-full max-w-md bg-[#0e121e]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.15)] p-6 sm:p-8 relative z-10">
        {/* Top Tech Decors */}
        <div className="flex items-center justify-between text-[10px] text-cyan-400/70 border-b border-cyan-500/20 pb-3 mb-6 tracking-widest uppercase">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            // PROTOCOL: KANBAN-DUO.SYS
          </span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            NODE_ONLINE
          </span>
        </div>

        {/* Cyberpunk Logo Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 text-white mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/40 mb-3">
            <Kanban className="w-7 h-7 text-cyan-200" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase font-mono">
            KANBAN<span className="text-cyan-400">//DUO</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-1 tracking-wider uppercase">
            // PORTAL DE ACCESO PRIVADO & SEGURO
          </p>
        </div>

        {/* Error Alert with Cyber Glitch border */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-5 text-xs text-rose-400 bg-rose-950/40 border border-rose-500/60 rounded-xl shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="font-mono text-[11px] leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-cyan-400" /> Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="w-full px-3.5 py-2.5 text-xs bg-[#090b12] border border-slate-700 text-white rounded-xl focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 shadow-inner font-mono transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-cyan-400" /> Clave de Acceso
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave privada"
                className="w-full px-3.5 pr-10 py-2.5 text-xs bg-[#090b12] border border-slate-700 text-white rounded-xl focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 shadow-inner font-mono transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold uppercase tracking-wider rounded-xl text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 mt-4 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black" />
                <span>AUTENTICAR Y ACCEDER</span>
              </>
            )}
          </button>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-6 pt-4 border-t border-cyan-500/20 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            CONEXIÓN SEGURA // CRIPTO-HASH SHA-256
          </p>
        </div>
      </div>
    </div>
  );
};
