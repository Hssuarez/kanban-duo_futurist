'use client';

import React, { useState, useRef } from 'react';
import { UserRole } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { compressAndResizeAvatar } from '@/lib/imageUtils';
import { X, UserPlus, Sparkles, AlertCircle, Eye, EyeOff, Upload, Camera, CheckCircle2 } from 'lucide-react';

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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [compressInfo, setCompressInfo] = useState<{ original: number; compressed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
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
        setError('Error al registrar nuevo usuario.');
      }
    } catch {
      setError('Error al crear el usuario.');
    } finally {
      setIsLoading(false);
    }
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
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-zinc-950/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <UserPlus className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Nuevo usuario
              </h3>
              <p className="text-[11px] text-zinc-400">
                Crea una nueva cuenta de acceso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
                  src={avatar}
                  alt="Vista previa"
                  className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/20 bg-zinc-900"
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
                    className="px-3 py-1.5 bg-zinc-900 text-zinc-300 border border-white/[0.08] hover:bg-zinc-800 text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0 transition-colors active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto
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

            {/* Avatar presets */}
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
                    <img src={p.url} alt={p.name} className="w-8 h-8 rounded-md object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                placeholder="Ej: Laura Gómez"
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
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
                placeholder="laura@empresa.com"
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Contraseña inicial
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-900 border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

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
          </div>
        </div>

        {/* Sticky Footer */}
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
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_22px_rgba(6,182,212,0.55)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
