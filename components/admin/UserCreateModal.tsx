'use client';

import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { X, UserPlus, Sparkles, AlertCircle, Eye, EyeOff, Cpu } from 'lucide-react';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    email: string;
    passwordPlain: string;
    role: UserRole;
    avatar?: string;
  }) => Promise<boolean>;
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('member');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0].url);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAvatar = () => {
    if (!name.trim()) return;
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La clave debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onCreate({
        name: name.trim(),
        email: email.trim(),
        passwordPlain: password,
        role,
        avatar: avatar || undefined,
      });

      if (ok) {
        setName('');
        setEmail('');
        setPassword('');
        onClose();
      } else {
        setError('Error al registrar nuevo operador.');
      }
    } catch {
      setError('Error al crear el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity font-mono">
      <div
        className="bg-[#0e121e] w-full max-w-lg rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.2)] border border-cyan-500/40 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#090c15]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              // ALTA DE NUEVO OPERADOR EN RED
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-cyan-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Photo / Avatar Section */}
          <div>
            <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2">
              FOTO DE PERFIL / AVATAR
            </label>
            <div className="flex items-center gap-4 mb-3">
              <img
                src={avatar}
                alt="Vista previa"
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              />
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="URL de foto o elige abajo..."
                    className="flex-1 px-3 py-1.5 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    className="px-2.5 py-1.5 bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 uppercase tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AUTO
                  </button>
                </div>
              </div>
            </div>

            {/* Avatar presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(p.url)}
                  title={p.name}
                  className={`p-0.5 rounded-xl border-2 transition-all shrink-0 ${
                    avatar === p.url ? 'border-cyan-400 scale-105 shadow-[0_0_10px_#06b6d4]' : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={p.url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                NOMBRE COMPLETO
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Neo Anderson"
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="neo@matrix.sys"
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                CLAVE DE ACCESO INICIAL
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-3 pr-8 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                NIVEL DE PRIVILEGIO
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-cyan-300 rounded-xl focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
              >
                <option value="member">👤 COLABORADOR (TABLERO)</option>
                <option value="admin">🛡️ ADMINISTRADOR (OMEGA)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-wider"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? 'REGISTRANDO...' : 'DAR DE ALTA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
