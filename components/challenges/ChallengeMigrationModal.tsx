'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Database, Copy, Check, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { syncCloudChallenges, getChallengeCloudSyncStatus, ChallengeCloudSyncStatus } from '@/lib/challengeStorage';

interface ChallengeMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

const MIGRATION_SQL = `-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRACIÓN DEFINITIVA V8
-- RETOS COMPARTIDOS (CHALLENGES), MIEMBROS, HÁBITOS, LOGS, OBJETIVOS Y ACTIVIDAD
-- 100% Idempotente y con permisos de acceso anónimo
-- ========================================================

-- 1. TABLA: challenges (Retos principales)
CREATE TABLE IF NOT EXISTS public.challenges (
    id TEXT PRIMARY KEY,
    created_by TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '🏆',
    color TEXT NOT NULL DEFAULT '#06b6d4',
    cover_image TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    mode TEXT NOT NULL DEFAULT 'competitive',
    status TEXT NOT NULL DEFAULT 'active',
    target_goal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: challenge_members (Participantes del reto)
CREATE TABLE IF NOT EXISTS public.challenge_members (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_id, user_id)
);

-- 3. TABLA: challenge_habits (Hábitos vinculados al reto)
CREATE TABLE IF NOT EXISTS public.challenge_habits (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏋️',
    target_value INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: challenge_logs (Check-ins diarios de retos)
CREATE TABLE IF NOT EXISTS public.challenge_logs (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    challenge_habit_id TEXT NOT NULL REFERENCES public.challenge_habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    date_key DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    numeric_value NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_id, challenge_habit_id, user_id, date_key)
);

-- 5. TABLA: challenge_goals (Objetivos cuantificables del reto)
CREATE TABLE IF NOT EXISTS public.challenge_goals (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_value NUMERIC NOT NULL DEFAULT 1,
    current_value NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'sesiones',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA: challenge_activities (Feed de actividad en tiempo real)
CREATE TABLE IF NOT EXISTS public.challenge_activities (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'check_in',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenge_members_challenge ON public.challenge_members(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_members_user ON public.challenge_members(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_habits_challenge ON public.challenge_habits(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_logs_composite ON public.challenge_logs(challenge_id, user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_challenge_goals_challenge ON public.challenge_goals(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_activities_challenge ON public.challenge_activities(challenge_id, created_at DESC);

-- Habilitar RLS y políticas abiertas para cliente anónimo
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Acceso a challenges" ON public.challenges;
  CREATE POLICY "Acceso a challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Acceso a challenge_members" ON public.challenge_members;
  CREATE POLICY "Acceso a challenge_members" ON public.challenge_members FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Acceso a challenge_habits" ON public.challenge_habits;
  CREATE POLICY "Acceso a challenge_habits" ON public.challenge_habits FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Acceso a challenge_logs" ON public.challenge_logs;
  CREATE POLICY "Acceso a challenge_logs" ON public.challenge_logs FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Acceso a challenge_goals" ON public.challenge_goals;
  CREATE POLICY "Acceso a challenge_goals" ON public.challenge_goals FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Acceso a challenge_activities" ON public.challenge_activities;
  CREATE POLICY "Acceso a challenge_activities" ON public.challenge_activities FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Publicación Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'challenges') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'challenge_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'challenge_habits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_habits;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'challenge_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'challenge_goals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_goals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'challenge_activities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_activities;
  END IF;
END $$;`;

export const ChallengeMigrationModal: React.FC<ChallengeMigrationModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ChallengeCloudSyncStatus>(getChallengeCloudSyncStatus());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSyncStatus(getChallengeCloudSyncStatus());
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await syncCloudChallenges();
      const updated = getChallengeCloudSyncStatus();
      setSyncStatus(updated);
      if (updated.isSynced) {
        onSyncSuccess?.();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#070c18] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-base">
                Sincronización en la Nube Supabase
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sincroniza retos entre otros navegadores, dispositivos y modo incógnito
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

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Status banner */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              syncStatus.isSynced
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
            }`}
          >
            {syncStatus.isSynced ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="font-semibold block">
                {syncStatus.isSynced
                  ? 'Base de datos en la nube lista y sincronizada'
                  : 'Sincronización en la nube pendiente de migración'}
              </span>
              <p className="text-[11px] text-zinc-300">
                {syncStatus.statusText}
                {syncStatus.errorMessage ? ` (${syncStatus.errorMessage})` : ''}
              </p>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="space-y-2 text-zinc-300">
            <h4 className="font-mono font-bold text-white text-xs uppercase tracking-wider">
              ¿Por qué no veo mi reto en otro dispositivo o en incógnito?
            </h4>
            <p className="leading-relaxed">
              Los retos que creas se guardan de inmediato en tu navegador. Para que aparezcan de forma instantánea en cualquier otro equipo, celular o sesión en modo incógnito, tu proyecto de Supabase necesita tener activadas las tablas de retos.
            </p>
            <div className="bg-zinc-950/60 border border-white/[0.06] rounded-xl p-3 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-cyan-300">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <span>Abre tu consola de Supabase (SQL Editor).</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                <span>Copia el script SQL de abajo y pégalo en una nueva consulta.</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-[10px]">
                  3
                </span>
                <span>Presiona &ldquo;Run&rdquo;. ¡Tus retos y check-ins se sincronizarán solos!</span>
              </div>
            </div>
          </div>

          {/* Code Box with 1-click copy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-mono text-[11px]">Script SQL de Migración V8</span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-zinc-950 rounded-xl border border-white/[0.08] text-[10px] font-mono text-zinc-300 max-h-48 overflow-y-auto custom-scrollbar select-all">
              {MIGRATION_SQL}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl border border-white/[0.08] hover:border-cyan-500/30 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <span>Ir a Supabase</span>
            <ExternalLink className="w-3 h-3 text-cyan-400" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetrySync}
              disabled={isRetrying}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Comprobando...' : 'Reintentar Sincronización'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
