'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { X, UserCheck, Sparkles, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, Cpu } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (updates: {
    name?: string;
    avatar?: string;
    newPasswordPlain?: string;
  }) => Promise<boolean>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setAvatar(currentUser.avatar);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleGenerateAvatar = () => {
    if (!name.trim()) return;
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setError('La nueva clave debe tener al menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Las claves no coinciden.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const ok = await onUpdateProfile({
        name: name.trim(),
        avatar: avatar || currentUser.avatar,
        newPasswordPlain: newPassword || undefined,
      });

      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      } else {
        setError('Error al actualizar registro.');
      }
    } catch {
      setError('Error al actualizar el perfil.');
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#090c15]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              // CONFIGURACIÓN DE IDENTIDAD
            </h3>
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

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-500/60 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>¡IDENTIDAD ACTUALIZADA CON ÉXITO!</span>
            </div>
          )}

          {/* Profile Photo / Avatar Section */}
          <div>
            <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2">
              FOTO DE PERFIL / AVATAR
            </label>
            <div className="flex items-center gap-4 mb-3">
              <img
                src={avatar || currentUser.avatar}
                alt={name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              />
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="URL de imagen externa..."
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

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                NOMBRE
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
                CORREO (ID)
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-3 py-2 text-xs bg-slate-900/60 border border-slate-800 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="border-t border-slate-800 pt-4 mt-2">
            <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>// MODIFICAR CLAVE DE ACCESO (OPCIONAL)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                  NUEVA CLAVE
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                  CONFIRMAR CLAVE
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la clave"
                  className="w-full px-3 py-2 text-xs bg-[#090b14] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400"
                />
              </div>
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
              disabled={isLoading || success}
              className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? 'GUARDANDO...' : 'GUARDAR IDENTIDAD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
