'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { compressAndResizeAvatar } from '@/lib/imageUtils';
import {
  X,
  UserCheck,
  Sparkles,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Cpu,
  Upload,
  Camera,
} from 'lucide-react';

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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [compressInfo, setCompressInfo] = useState<{ original: number; compressed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.name);
    setAvatar(currentUser.avatar);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setCompressInfo(null);
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerateAvatar = () => {
    if (!name.trim()) return;
    setCompressInfo(null);
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }

    // Validar tamaño máximo antes de procesar (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. El límite máximo es 10MB.');
      return;
    }

    setIsProcessingImage(true);
    setError('');

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
      // Limpiar input file para permitir seleccionar el mismo archivo nuevamente si se desea
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await onUpdateProfile({
        name: name.trim(),
        avatar,
        newPasswordPlain: newPassword || undefined,
      });
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError('Error al actualizar el perfil.');
      }
    } catch (err) {
      setError('Error al actualizar el perfil.');
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
        className="relative w-full max-w-lg my-auto bg-zinc-950 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky Top */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-zinc-950/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              Configuración de perfil
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Perfil actualizado correctamente.</span>
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
                  src={avatar || currentUser.avatar}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover ring-1 ring-white/10 bg-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  title="Subir foto desde archivo"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium cursor-pointer"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Cambiar</span>
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                  >
                    <Upload className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isProcessingImage ? 'Procesando...' : 'Subir imagen'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0 transition-all active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Avatar IA
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

                {compressInfo && (
                  <p className="text-[11px] text-zinc-500">
                    Optimizada: {compressInfo.original} KB → {compressInfo.compressed} KB
                  </p>
                )}
              </div>
            </div>

            {/* Presets */}
            <div>
              <p className="text-[11px] text-zinc-400 mb-1.5">O elige un avatar prediseñado:</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCompressInfo(null);
                      setAvatar(preset.url);
                    }}
                    className={`p-0.5 rounded-full border transition-all active:scale-[0.95] ${
                      avatar === preset.url
                        ? 'border-white ring-2 ring-white/20'
                        : 'border-transparent hover:border-zinc-600'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20"
              required
            />
          </div>

          {/* Password Change Section */}
          <div className="pt-3 border-t border-white/[0.06]">
            <h4 className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span>Cambiar contraseña (opcional)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-2 text-xs bg-zinc-950/70 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
          <div className="shrink-0 sticky bottom-0 z-10 flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-4 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
