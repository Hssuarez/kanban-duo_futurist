'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChallengeGoal } from '@/lib/challengeTypes';
import { X, Flag, Trash2, Target, CheckCircle2 } from 'lucide-react';

interface ChallengeGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<ChallengeGoal>) => void;
  onDelete?: (goalId: string) => void;
  editingGoal?: ChallengeGoal | null;
  challengeId: string;
}

const COMMON_UNITS = ['sesiones', 'días', 'horas', 'km', '%', 'veces'];

export const ChallengeGoalModal: React.FC<ChallengeGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingGoal,
  challengeId,
}) => {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState<number>(20);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState<string>('sesiones');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setTargetValue(editingGoal.targetValue ?? 20);
      setCurrentValue(editingGoal.currentValue ?? 0);
      setUnit(editingGoal.unit || 'sesiones');
      setIsCompleted(editingGoal.isCompleted ?? false);
    } else {
      setTitle('');
      setTargetValue(20);
      setCurrentValue(0);
      setUnit('sesiones');
      setIsCompleted(false);
    }
  }, [editingGoal, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTarget = Math.max(1, Number(targetValue) || 1);
    const parsedCurrent = Math.max(0, Number(currentValue) || 0);
    const autoCompleted = isCompleted || parsedCurrent >= parsedTarget;

    onSave({
      id: editingGoal?.id,
      challengeId,
      title: title.trim(),
      targetValue: parsedTarget,
      currentValue: parsedCurrent,
      unit: unit.trim() || 'sesiones',
      isCompleted: autoCompleted,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
    });

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#070c18] border border-cyan-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-base">
                {editingGoal ? 'Personalizar Objetivo' : 'Nuevo Objetivo del Reto'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Define hitos cuantificables para este reto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Goal Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Descripción del Objetivo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Cumplir 20 sesiones en el gimnasio..."
              required
              className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
            />
          </div>

          {/* Numeric Targets */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-zinc-300 block">
                Meta Objetivo *
              </label>
              <div className="relative">
                <Target className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-zinc-300 block">
                Progreso Actual
              </label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 absolute left-3 top-2.5 text-cyan-400" />
                <input
                  type="number"
                  min={0}
                  value={currentValue}
                  onChange={(e) => setCurrentValue(Number(e.target.value))}
                  className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Unit selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Unidad de Medida
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2 py-1 text-xs font-mono rounded-lg border transition-all ${
                    unit === u
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="O escribe una unidad personalizada..."
              className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
            />
          </div>

          {/* Complete Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div>
              <span className="text-xs font-medium text-white block">Marcar como completado</span>
              <span className="text-[10px] text-zinc-400">
                Se marcará automáticamente si el progreso alcanza la meta
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCompleted(!isCompleted)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                isCompleted || currentValue >= targetValue
                  ? 'bg-cyan-500 justify-end'
                  : 'bg-zinc-800 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
            {editingGoal && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Estás seguro de que deseas eliminar el objetivo "${editingGoal.title}"?`
                    )
                  ) {
                    onDelete(editingGoal.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer"
              >
                {editingGoal ? 'Guardar Cambios' : 'Crear Objetivo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
