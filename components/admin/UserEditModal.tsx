'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { compressAndResizeAvatar } from '@/lib/imageUtils';
import { X, Sparkles, AlertCircle, Upload, Camera, CheckCircle2, User as UserIcon } from 'lucide-react';

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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [compressInfo, setCompressInfo] = useState<{ original: number; compressed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar);
      setRole(user.role);
      setIsActive(user.isActive);
    }
    setError('');
    setCompressInfo(null);
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleGenerateAvatar = () => {
    if (!name.trim()) return;
    setCompressInfo(null);
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsProcessingImage(true);
    try {
      const result = await compressAndResizeAvatar(file, 128, 0.82);
      setAvatar(result.dataUrl);
      setCompressInfo({
        original: result.originalSizeKb,
        compressed: result.compressedSizeKb,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la imagen.';
      setError(msg);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center font-sans"
    >
      <div
        className="relative w-full max-w-lg my-auto bg-zinc-950 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden text-zinc-200 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky Top */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-zinc-950/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <UserIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Editar usuario
              </h3>
              <p className="text-[11px] text-zinc-400">
                {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Photo / Avatar Section */}
            <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Foto de perfil
            </label>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative group shrink-0">
                <img
                  src={avatar || user.avatar}
                  alt="Vista previa"
                  className="w-16 h-16 rounded-xl object-cover ring-1 ring-white/20 bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  title="Subir foto desde archivo"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-xl flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium cursor-pointer"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Subir</span>
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="flex-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                  >
                    <Upload className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isProcessingImage ? 'Procesando...' : 'Subir imagen'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    title="Generar avatar según el nombre"
                    className="px-3 py-1.5 bg-zinc-900 text-zinc-300 border border-white/[0.08] hover:bg-zinc-800 text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0 transition-colors active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Auto
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Compression feedback badge */}
                {compressInfo ? (
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>
                      Optimizada: {compressInfo.original} KB → {compressInfo.compressed} KB
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Auto-optimización a 128×128 WebP
                  </p>
                )}
              </div>
            </div>

            {/* Avatar Presets */}
            <div className="mt-2">
              <span className="text-[11px] text-zinc-400 font-medium block mb-1.5">
                O elige un avatar sugerido:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(p.url);
                      setCompressInfo(null);
                    }}
                    title={p.name}
                    className={`p-0.5 rounded-lg border transition-all shrink-0 ${
                      avatar === p.url ? 'border-white ring-2 ring-white/20' : 'border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    <img
                      src={p.url}
                      alt={p.name}
                      className="w-8 h-8 rounded-md object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Rol en el sistema
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-white/[0.08] text-zinc-200 rounded-lg focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="member">Colaborador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Estado de la cuenta
              </label>
              <select
                value={isActive ? 'active' : 'suspended'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-white/[0.08] text-zinc-200 rounded-lg focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer - Sticky Bottom */}
          <div className="shrink-0 sticky bottom-0 z-10 flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.08] bg-zinc-950/95 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] rounded-lg transition-colors active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg transition-all active:scale-[0.98]"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
