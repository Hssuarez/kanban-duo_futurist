'use client';

import React, { useState, useEffect } from 'react';
import { Habit, TargetType, HabitFrequency } from '@/lib/habitTypes';
import { X, Trash2, Check } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  onDelete?: (habitId: string) => void;
  editingHabit?: Habit | null;
  userId: string;
}

const PRESET_ICONS = [
  '🎯', '🏋️', '💧', '📖', '🧘', '🏃', '⏰', '🚫',
  '🙏', '😴', '🥗', '💊', '💡', '🎸', '🧹', '📱',
  '💻', '🚶', '🍎', '💰', '☀️', '🌱', '🔋', '🔥',
];

const CATEGORIES = [
  { id: 'salud', label: 'Salud y Fitness' },
  { id: 'mente', label: 'Mente y Espíritu' },
  { id: 'productividad', label: 'Productividad' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'general', label: 'General' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingHabit,
  userId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [category, setCategory] = useState('general');
  const [targetType, setTargetType] = useState<TargetType>('boolean');
  const [targetValue, setTargetValue] = useState(1);
  const [targetUnit, setTargetUnit] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setIcon(editingHabit.icon);
      setCategory(editingHabit.category);
      setTargetType(editingHabit.targetType);
      setTargetValue(editingHabit.targetValue);
      setTargetUnit(editingHabit.targetUnit || '');
      setFrequency(editingHabit.frequency);
      setIsActive(editingHabit.isActive);
    } else {
      setTitle('');
      setDescription('');
      setIcon('🎯');
      setCategory('general');
      setTargetType('boolean');
      setTargetValue(1);
      setTargetUnit('');
      setFrequency('daily');
      setIsActive(true);
    }
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: editingHabit?.id || `habit-${Date.now()}`,
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      color: '#06b6d4',
      category,
      targetType,
      targetValue: Number(targetValue) || 1,
      targetUnit: targetUnit.trim() || undefined,
      frequency,
      isActive,
      isArchived: false,
      displayOrder: editingHabit?.displayOrder || 99,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div
        className="w-full max-w-lg bg-[#070c18] border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(6,182,212,0.15)] rounded-2xl p-5 sm:p-6 animate-modal-enter relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5 uppercase">
              Nombre del Hábito *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Entrenar en el Gym, Tomar 2L de agua..."
              className="w-full bg-zinc-950/80 border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/60 font-sans"
            />
          </div>

          {/* Icon Presets */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-400 mb-1.5 uppercase">
              Icono Representativo
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950/60 border border-white/[0.06] rounded-xl max-h-28 overflow-y-auto custom-scrollbar">
              {PRESET_ICONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform ${
                    icon === emoji
                      ? 'bg-cyan-500/25 ring-2 ring-cyan-400 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                      : 'hover:bg-zinc-800 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Frequency Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 mb-1.5 uppercase">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 mb-1.5 uppercase">
                Frecuencia
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                className="w-full bg-zinc-950/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="daily">Todos los días (L-D)</option>
                <option value="weekdays">Lunes a Viernes</option>
                <option value="weekends">Fines de semana (S-D)</option>
              </select>
            </div>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-900 cursor-pointer"
            />
            <label htmlFor="isActiveToggle" className="text-xs text-zinc-300 select-none cursor-pointer">
              Activo en la matriz principal de hábitos
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            {editingHabit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Estás seguro de eliminar el hábito "${editingHabit.title}"?`)) {
                    onDelete(editingHabit.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_18px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer font-sans"
              >
                {editingHabit ? 'Guardar Cambios' : 'Crear Hábito'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
