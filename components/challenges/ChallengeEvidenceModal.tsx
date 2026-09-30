'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChallengeLog, EvidenceStatus } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import { updateLocalChallengeLogEvidence } from '@/lib/challengeStorage';
import {
  X,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  HardDrive,
  Calendar,
  Lock,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface ChallengeEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  challengeTitle: string;
  challengeHabitId: string;
  habitTitle: string;
  dateKey: string;
  targetUser: User;
  currentUser: User;
  log?: ChallengeLog;
  onEvidenceUpdated?: (updatedLog: ChallengeLog) => void;
  onEvidenceDeleted?: () => void;
}

export const ChallengeEvidenceModal: React.FC<ChallengeEvidenceModalProps> = ({
  isOpen,
  onClose,
  challengeId,
  challengeTitle,
  challengeHabitId,
  habitTitle,
  dateKey,
  targetUser,
  currentUser,
  log,
  onEvidenceUpdated,
  onEvidenceDeleted,
}) => {
  const [mounted, setMounted] = useState(false);
  const isOwner = currentUser.id === targetUser.id;

  // Estados de selección y preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [imageMetrics, setImageMetrics] = useState<{
    originalSizeKb: number;
    compressedSizeKb: number;
    width: number;
    height: number;
  } | null>(null);

  // Estados de red y UI
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset al abrir o cambiar de log
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCompressedBlob(null);
      setImageMetrics(null);
      setErrorMsg(null);
      setIsSuccess(false);
      setImageLoading(true);
      setImageError(false);
      setIsFullscreen(false);
      setUploadProgress(0);
    }
  }, [isOpen, log?.id, log?.evidenceFileId]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Limpiar blob URL al desmontar o cambiar
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen || !mounted) return null;

  // Compresión en cliente mediante HTML5 Canvas (Max 1600px, JPEG 0.82)
  const compressClientImage = async (
    file: File
  ): Promise<{ blob: Blob; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ blob: file, width: img.width, height: img.height });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width, height });
            } else {
              resolve({ blob: file, width: img.width, height: img.height });
            }
          },
          'image/jpeg',
          0.82
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };

      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona un archivo de imagen válido (JPG, PNG o WEBP).');
      return;
    }

    try {
      const originalSizeKb = Math.round(file.size / 1024);
      const { blob, width, height } = await compressClientImage(file);
      const compressedSizeKb = Math.round(blob.size / 1024);

      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      const newPreview = URL.createObjectURL(blob);
      setSelectedFile(file);
      setCompressedBlob(blob);
      setPreviewUrl(newPreview);
      setImageMetrics({
        originalSizeKb,
        compressedSizeKb,
        width,
        height,
      });
    } catch (err) {
      console.error('Error al procesar y comprimir la imagen:', err);
      setErrorMsg('No se pudo procesar la imagen seleccionada.');
    }
  };

  // Subir evidencia a Google Drive mediante backend seguro
  const handleUploadConfirm = async () => {
    if (!compressedBlob && !selectedFile) return;
    if (!isOwner) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      const uploadFile = compressedBlob || selectedFile!;
      const filename = selectedFile?.name.replace(/\.[^/.]+$/, '.jpg') || 'evidence.jpg';

      formData.append('file', uploadFile, filename);
      formData.append('challengeId', challengeId);
      formData.append('challengeHabitId', challengeHabitId);
      formData.append('dateKey', dateKey);
      formData.append('userId', currentUser.id);

      if (log?.evidenceFileId) {
        formData.append('previousFileId', log.evidenceFileId);
      }

      setUploadProgress(45);

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
        },
        body: formData,
      });

      setUploadProgress(80);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al subir la evidencia a Google Drive.');
      }

      setUploadProgress(100);
      setIsSuccess(true);

      // Actualizar estado local y sincronizar
      const updatedLog = updateLocalChallengeLogEvidence(
        challengeId,
        challengeHabitId,
        currentUser.id,
        dateKey,
        {
          evidenceUrl: data.evidence.url,
          evidenceFileId: data.evidence.fileId,
          evidenceUploadedAt: data.evidence.uploadedAt,
          evidenceUploadedBy: currentUser.id,
          evidenceStatus: 'uploaded',
        }
      );

      if (updatedLog && onEvidenceUpdated) {
        onEvidenceUpdated(updatedLog);
      }

      setTimeout(() => {
        setIsUploading(false);
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Fallo en subida de evidencia:', err);
      setIsUploading(false);
      setErrorMsg(err.message || 'Error de conexión al subir la evidencia.');
    }
  };

  // Eliminar evidencia existente
  const handleDeleteEvidence = async () => {
    if (!isOwner) return;
    if (!confirm('¿Estás seguro de eliminar esta evidencia fotográfica? La foto se borrará de Google Drive.')) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/drive/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          challengeId,
          challengeHabitId,
          dateKey,
          fileId: log?.evidenceFileId,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo eliminar la evidencia.');
      }

      // Actualizar local
      updateLocalChallengeLogEvidence(challengeId, challengeHabitId, currentUser.id, dateKey, {
        evidenceUrl: null,
        evidenceFileId: null,
        evidenceUploadedAt: null,
        evidenceUploadedBy: null,
        evidenceStatus: 'none',
      });

      if (onEvidenceDeleted) {
        onEvidenceDeleted();
      }

      onClose();
    } catch (err: any) {
      console.error('Error al eliminar evidencia:', err);
      setErrorMsg(err.message || 'Error al eliminar evidencia.');
    } finally {
      setIsDeleting(false);
    }
  };

  const existingPhotoUrl =
    log?.evidenceUrl ||
    (log?.evidenceFileId ? `/api/drive/file/${encodeURIComponent(log.evidenceFileId)}` : null);

  const hasExistingEvidence = Boolean(
    (log?.evidenceStatus === 'uploaded' || existingPhotoUrl) && !selectedFile
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#070c18] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.95)] max-h-[92vh] flex flex-col relative text-zinc-200">
        {/* Neon HUD Top Indicator */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-white text-base truncate">
                  Evidencia Fotográfica
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    hasExistingEvidence
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {hasExistingEvidence ? '📷 ADJUNTA' : 'PENDIENTE'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {habitTitle} · <span className="text-cyan-400 font-mono">{dateKey}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auditor Banner if viewing another user's evidence */}
        {!isOwner && (
          <div className="px-4 py-2 bg-zinc-900/90 border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Modo Auditor: Evidencia de <strong className="text-white">{targetUser.name}</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Solo Lectura
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Error Message Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">Atención</div>
                <div className="text-rose-300/90">{errorMsg}</div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-scale-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-emerald-300">¡Evidencia Sincronizada!</div>
                <div className="text-[11px] text-emerald-400/90">
                  Guardada en tu Google Drive privado y propagada a todo el equipo.
                </div>
              </div>
            </div>
          )}

          {/* 1. Vista de Evidencia Existente */}
          {hasExistingEvidence && existingPhotoUrl && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-black group max-h-[340px] flex items-center justify-center">
                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 gap-2">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                    <span className="text-xs text-zinc-400 font-mono">
                      Cargando desde Google Drive...
                    </span>
                  </div>
                )}

                {imageError ? (
                  <div className="p-8 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-sm font-semibold text-zinc-200">
                      No se pudo cargar la imagen
                    </div>
                    <div className="text-xs text-zinc-400">
                      Puede haber sido eliminada de Drive o expirado el enlace.
                    </div>
                  </div>
                ) : (
                  <img
                    src={existingPhotoUrl}
                    alt={`Evidencia ${habitTitle} - ${dateKey}`}
                    className={`w-full max-h-[340px] object-contain transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                )}

                {/* Botón Pantalla Completa / Expandir */}
                {!imageLoading && !imageError && (
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm border border-white/20 transition-all opacity-80 hover:opacity-100 cursor-pointer"
                    title="Ver en grande"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Metadatos de la imagen */}
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Google Drive Privado</span>
                </div>
                {log?.evidenceUploadedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>
                      {new Date(log.evidenceUploadedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Vista Previa de Imagen Nueva Seleccionada */}
          {previewUrl && (
            <div className="space-y-3 animate-fade-in">
              <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-black group max-h-[320px] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Vista previa de evidencia"
                  className="w-full max-h-[320px] object-contain"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setCompressedBlob(null);
                    setImageMetrics(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                  title="Descartar esta imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Métricas de compresión */}
              {imageMetrics && (
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs font-mono text-cyan-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Optimizada para subida</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    <span className="text-zinc-500 line-through mr-1">
                      {imageMetrics.originalSizeKb} KB
                    </span>
                    <span className="text-cyan-300 font-bold">{imageMetrics.compressedSizeKb} KB</span>
                    <span className="text-zinc-500 ml-1">
                      ({imageMetrics.width}x{imageMetrics.height})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Dropzone / Botón de Selección (Solo para el propietario) */}
          {isOwner && !previewUrl && (
            <div className="space-y-3">
              {/* Input nativo oculto: estrictamente galería/archivos, NUNCA cámara directa */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/80 rounded-2xl p-6 text-center transition-all bg-zinc-950/40 hover:bg-cyan-950/15 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 mx-auto flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                  <Upload className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="mt-3">
                  <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {hasExistingEvidence ? 'Reemplazar fotografía' : 'Adjuntar fotografía'}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Selecciona una imagen de tu galería o archivos (JPG, PNG o WEBP)
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1">
                    Se comprimirá automáticamente antes de sincronizar
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* 4. Barra de Progreso de Subida */}
          {isUploading && (
            <div className="space-y-2 p-3 rounded-xl bg-zinc-900/90 border border-cyan-500/30">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Sincronizando con Google Drive...
                </span>
                <span className="text-white font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-zinc-950/80 flex items-center justify-between gap-3">
          {/* Lado izquierdo: Eliminar (si ya hay foto y es el dueño) */}
          {isOwner && hasExistingEvidence && !previewUrl ? (
            <button
              type="button"
              disabled={isDeleting || isUploading}
              onClick={handleDeleteEvidence}
              className="px-3 py-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-500/30 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Eliminando...' : 'Eliminar foto'}</span>
            </button>
          ) : (
            <div />
          )}

          {/* Lado derecho: Botones de Confirmar o Cerrar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cerrar
            </button>

            {isOwner && previewUrl && (
              <button
                type="button"
                disabled={isUploading}
                onClick={handleUploadConfirm}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar y Subir</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Modal Pantalla Completa (LightBox) */}
        {isFullscreen && existingPhotoUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={existingPhotoUrl}
              alt="Evidencia a pantalla completa"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-xs font-mono text-zinc-400 text-center">
              {targetUser.name} · {habitTitle} · {dateKey}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
