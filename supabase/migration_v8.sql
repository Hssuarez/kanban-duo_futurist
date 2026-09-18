-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRACIÓN DEFINITIVA Y COMPLETA V8
-- RETOS COMPARTIDOS (CHALLENGES), MIEMBROS, HÁBITOS, LOGS, OBJETIVOS Y ACTIVIDAD
-- 
-- INSTRUCCIONES DE APLICACIÓN:
-- 1. Ve a tu Dashboard de Supabase (https://supabase.com/dashboard)
-- 2. Selecciona tu proyecto y dirígete al menú "SQL Editor" (icono de terminal en la barra lateral izquierda)
-- 3. Crea una "New Query", pega todo este archivo y presiona "Run" (botón verde)
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
    mode TEXT NOT NULL DEFAULT 'competitive', -- 'collaborative' | 'competitive'
    status TEXT NOT NULL DEFAULT 'active',    -- 'upcoming' | 'active' | 'completed' | 'archived'
    target_goal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: challenge_members (Participantes del reto)
CREATE TABLE IF NOT EXISTS public.challenge_members (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',     -- 'owner' | 'member'
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_id, user_id)
);

-- 3. TABLA: challenge_habits (Hábitos vinculados al reto para la matriz)
CREATE TABLE IF NOT EXISTS public.challenge_habits (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏋️',
    target_value INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: challenge_logs (Evidencia de check-ins diarios en hora Bogotá)
CREATE TABLE IF NOT EXISTS public.challenge_logs (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    challenge_habit_id TEXT NOT NULL REFERENCES public.challenge_habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    date_key DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'empty' | 'not_applicable'
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

-- 6. TABLA: challenge_activities (Feed de actividad reciente en vivo)
CREATE TABLE IF NOT EXISTS public.challenge_activities (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'check_in', -- 'check_in' | 'joined' | 'milestone' | 'goal_completed'
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenge_members_challenge ON public.challenge_members(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_members_user ON public.challenge_members(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_habits_challenge ON public.challenge_habits(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_logs_composite ON public.challenge_logs(challenge_id, user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_challenge_goals_challenge ON public.challenge_goals(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_activities_challenge ON public.challenge_activities(challenge_id, created_at DESC);

-- ========================================================
-- POLÍTICAS RLS (ACCESO DIRECTO PARA CLIENTE ANÓNIMO / LOCAL-FIRST)
-- ========================================================
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_activities ENABLE ROW LEVEL SECURITY;

-- Publicación Realtime con REPLICA IDENTITY FULL para capturar eliminaciones completas
ALTER TABLE public.challenge_logs REPLICA IDENTITY FULL;
ALTER TABLE public.challenges REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- 1. challenges
  DROP POLICY IF EXISTS "Users can select challenges they participate in" ON public.challenges;
  DROP POLICY IF EXISTS "Authenticated users can create challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Creators and admins can update challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Creators can delete their challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Acceso total challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Acceso a challenges" ON public.challenges;
  CREATE POLICY "Acceso a challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

  -- 2. challenge_members
  DROP POLICY IF EXISTS "Users can view challenge members" ON public.challenge_members;
  DROP POLICY IF EXISTS "Users can join or owners can add members" ON public.challenge_members;
  DROP POLICY IF EXISTS "Owners can update member roles" ON public.challenge_members;
  DROP POLICY IF EXISTS "Users can leave or owners can remove members" ON public.challenge_members;
  DROP POLICY IF EXISTS "Acceso a challenge_members" ON public.challenge_members;
  CREATE POLICY "Acceso a challenge_members" ON public.challenge_members FOR ALL USING (true) WITH CHECK (true);

  -- 3. challenge_habits
  DROP POLICY IF EXISTS "Users can view challenge habits" ON public.challenge_habits;
  DROP POLICY IF EXISTS "Owners can manage challenge habits" ON public.challenge_habits;
  DROP POLICY IF EXISTS "Acceso a challenge_habits" ON public.challenge_habits;
  CREATE POLICY "Acceso a challenge_habits" ON public.challenge_habits FOR ALL USING (true) WITH CHECK (true);

  -- 4. challenge_logs
  DROP POLICY IF EXISTS "Members can select all challenge logs for the matrix" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can only insert their own challenge logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can only update their own challenge logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can only delete their own challenge logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can view challenge logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can log their own habits" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can update their own logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can delete their own logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Acceso a challenge_logs" ON public.challenge_logs;
  CREATE POLICY "Acceso a challenge_logs" ON public.challenge_logs FOR ALL USING (true) WITH CHECK (true);

  -- 5. challenge_goals
  DROP POLICY IF EXISTS "Acceso a challenge_goals" ON public.challenge_goals;
  CREATE POLICY "Acceso a challenge_goals" ON public.challenge_goals FOR ALL USING (true) WITH CHECK (true);

  -- 6. challenge_activities
  DROP POLICY IF EXISTS "Users can view challenge activities" ON public.challenge_activities;
  DROP POLICY IF EXISTS "Users can record activities" ON public.challenge_activities;
  DROP POLICY IF EXISTS "Acceso a challenge_activities" ON public.challenge_activities;
  CREATE POLICY "Acceso a challenge_activities" ON public.challenge_activities FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ========================================================
-- PUBLICACIÓN REALTIME (Sincronización instantánea entre navegadores)
-- ========================================================
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
END $$;
