'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '@/lib/types';
import { PRESET_AVATARS } from '@/lib/auth';
import { compressAndResizeAvatar } from '@/lib/imageUtils';
import { X, Sparkles, AlertCircle, Cpu, Upload, Camera, CheckCircle2 } from 'lucide-react';

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

  if (!isOpen || !user) return null;

  const handleGenerateAvatar = () => {
    if (!name.trim()) return;
    setCompressInfo(null);
    const generated = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;
    setAvatar(generated);
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
              <div className="relative group shrink-0">
                <img
                  src={avatar || user.avatar}
                  alt="Vista previa"
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-slate-900"
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
                    title="Generar avatar dinámico según el nombre"
                    className="px-3 py-2 bg-slate-900 text-slate-300 border border-slate-700 hover:border-cyan-500/40 hover:text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AUTO
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

            {/* Avatar Presets */}
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
                    <img
                      src={p.url}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  </button>
                ))}
              </div>
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
