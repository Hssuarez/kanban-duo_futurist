-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRACIÓN V9 (HÁBITOS PERSONALES, LOGS, METAS Y NOTAS)
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu Supabase Dashboard: https://supabase.com/dashboard
-- 2. Entra a tu proyecto -> SQL Editor (icono de terminal a la izquierda)
-- 3. Pega este contenido y presiona RUN (botón verde)
-- ========================================================

-- 1. Tabla de Hábitos Personales
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  challenge_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#06b6d4',
  category TEXT DEFAULT 'general',
  target_type TEXT NOT NULL DEFAULT 'boolean',
  target_value NUMERIC DEFAULT 1,
  target_unit TEXT,
  frequency TEXT DEFAULT 'daily',
  frequency_days INT[] DEFAULT '{1,2,3,4,5,6,7}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Registros Diarios de Hábitos (Check-ins)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  numeric_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_habit_user_date UNIQUE (habit_id, user_id, date_key)
);

-- 3. Tabla de Objetivos (Goals)
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  challenge_id TEXT,
  habit_id TEXT REFERENCES public.habits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  month_key TEXT,
  target_type TEXT NOT NULL DEFAULT 'boolean',
  target_value NUMERIC DEFAULT 1,
  current_value NUMERIC DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Notas Periódicas (Habit Notes)
CREATE TABLE IF NOT EXISTS public.habit_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_period_note UNIQUE (user_id, period_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_composite ON public.habit_logs(habit_id, user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_notes_user ON public.habit_notes(user_id, period_key);

-- Habilitar RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (Local-first + Supabase anon key)
DROP POLICY IF EXISTS "Public access habits" ON public.habits;
CREATE POLICY "Public access habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access habit_logs" ON public.habit_logs;
CREATE POLICY "Public access habit_logs" ON public.habit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access goals" ON public.goals;
CREATE POLICY "Public access goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access habit_notes" ON public.habit_notes;
CREATE POLICY "Public access habit_notes" ON public.habit_notes FOR ALL USING (true) WITH CHECK (true);
