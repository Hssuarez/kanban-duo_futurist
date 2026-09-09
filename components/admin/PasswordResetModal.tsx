'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { X, KeyRound, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onResetPassword: (targetUserId: string, newPass: string) => Promise<boolean>;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  user,
  onResetPassword,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La clave debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las claves no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onResetPassword(user.id, password);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setPassword('');
          setConfirmPassword('');
          onClose();
        }, 1500);
      } else {
        setError('Error al restablecer la clave criptográfica.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity font-mono">
      <div
        className="bg-[#0e121e] w-full max-w-md rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.2)] border border-amber-500/40 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-[#090c15]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              // RESTABLECER CLAVE // {user.name.toUpperCase()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target User Info */}
          <div className="flex items-center gap-3 p-3 bg-[#080b14] border border-slate-800 rounded-xl">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-amber-400/60"
            />
            <div>
              <p className="text-xs font-bold text-white uppercase">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-500/60 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>¡NUEVO CRIPTO-HASH GENERADO Y APLICADO!</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                NUEVA CLAVE
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 uppercase tracking-wider"
              >
                <Sparkles className="w-3 h-3" /> AUTO-GENERAR
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-3.5 pr-10 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5">
              CONFIRMAR CLAVE
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la clave"
              className="w-full px-3.5 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-wider"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? 'APLICANDO...' : 'GUARDAR CLAVE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
