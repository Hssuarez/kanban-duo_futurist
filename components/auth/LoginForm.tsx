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
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 relative font-sans selection:bg-zinc-800">
      {/* Studio Card */}
      <div className="w-full max-w-sm bg-zinc-900/90 border border-white/[0.08] rounded-xl shadow-2xl p-6 sm:p-7 relative z-10 animate-modal-enter">
        {/* Logo Branding */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/[0.1] text-white mx-auto flex items-center justify-center shadow-sm mb-3">
            <Kanban className="w-5 h-5 text-zinc-200" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Kanban<span className="text-zinc-400 font-normal">Duo</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Inicia sesión en tu espacio de trabajo
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-white rounded-lg focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500/20 transition-all placeholder:text-zinc-500"
            />
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
                className="w-full px-3 pr-9 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-white rounded-lg focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500/20 transition-all placeholder:text-zinc-500"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded-lg text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Continuar</span>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            Acceso seguro y protegido
          </p>
        </div>
      </div>
    </div>
  );
};
