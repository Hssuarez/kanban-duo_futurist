'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Save, Check } from 'lucide-react';

interface HabitNotesCardProps {
  initialContent: string;
  onSave: (content: string) => void;
}

export const HabitNotesCard: React.FC<HabitNotesCardProps> = ({ initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = () => {
    onSave(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-[#070c18]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-mono tracking-wider">
            Notas
          </h4>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Guardado</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </>
          )}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tus reflexiones, ajustes de rutina o metas del mes..."
        rows={6}
        className="w-full flex-1 bg-zinc-950/60 border border-white/[0.06] rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 resize-none font-mono leading-relaxed custom-scrollbar"
      />
    </div>
  );
};
