'use client';

import React, { useState, useRef } from 'react';
import { UserRole } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { compressAndResizeAvatar } from '@/lib/imageUtils';
import { X, UserPlus, Sparkles, AlertCircle, Eye, EyeOff, Cpu, Upload, Camera, CheckCircle2 } from 'lucide-react';

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
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt="Vista previa"
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  title="Subir foto desde archivo"
                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 rounded-xl flex flex-col items-center justify-center transition-opacity text-cyan-300 text-[10px] font-bold cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>SUBIR</span>
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-950 to-indigo-950 hover:from-cyan-900 hover:to-indigo-900 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all shadow-sm active:scale-98"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isProcessingImage ? 'PROCESANDO...' : 'SUBIR FOTO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    className="px-3 py-2 bg-slate-900 text-slate-300 border border-slate-700 hover:border-cyan-500/40 hover:text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AUTO
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
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>
                      OPTIMIZADA: {compressInfo.original} KB → {compressInfo.compressed} KB (WebP 128x128) ⚡
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 tracking-wider">
                    // FORMATO INTELIGENTE: AUTO-RECORTE A 128X128 (~10 KB)
                  </p>
                )}
              </div>
            </div>

            {/* Avatar presets */}
            <div className="mt-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                O SELECCIONA UN AVATAR CYBERPUNK:
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
                    className={`p-0.5 rounded-xl border-2 transition-all shrink-0 ${
                      avatar === p.url ? 'border-cyan-400 scale-105 shadow-[0_0_10px_#06b6d4]' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                  </button>
                ))}
              </div>
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
