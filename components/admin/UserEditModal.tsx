'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { X, Sparkles, AlertCircle, Cpu } from 'lucide-react';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (targetUserId: string, updates: {
    name: string;
    email: string;
    avatar: string;
    role: UserRole;
    isActive: boolean;
  }) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar);
      setRole(user.role);
      setIsActive(user.isActive);
    }
    setError('');
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleGenerateAvatar = () => {
    if (!name.trim()) return;
    const generated = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;
    setAvatar(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('El nombre y el correo son obligatorios.');
      return;
    }
    onSave(user.id, {
      name: name.trim(),
      email: email.trim(),
      avatar: avatar.trim() || user.avatar,
      role,
      isActive,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity font-mono">
      <div
        className="bg-[#0e121e] w-full max-w-lg rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.2)] border border-cyan-500/40 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#090c15]">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                // MODIFICAR OPERADOR: {user.name.toUpperCase()}
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
              Control de identidad, avatar, permisos de rol y estado
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-cyan-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
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
                src={avatar || user.avatar}
                alt="Vista previa"
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              />
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="URL externa de imagen..."
                    className="flex-1 px-3 py-1.5 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    title="Generar avatar dinámico según el nombre"
                    className="px-2.5 py-1.5 bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 uppercase tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AUTO
                  </button>
                </div>
              </div>
            </div>

            {/* Avatar Presets */}
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
                  <img
                    src={p.url}
                    alt={p.name}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name & Email */}
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
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                ROL EN EL SISTEMA
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

            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                ESTADO DE LA CUENTA
              </label>
              <select
                value={isActive ? 'active' : 'suspended'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-cyan-300 rounded-xl focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
              >
                <option value="active">🟢 ACTIVO (ONLINE)</option>
                <option value="suspended">🔴 SUSPENDIDO (OFFLINE)</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
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
              className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider"
            >
              GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
