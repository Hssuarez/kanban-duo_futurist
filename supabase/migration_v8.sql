-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRATION V8
-- SOPORTE ROBUSTO PARA RETOS (CHALLENGES), OBJETIVOS (GOALS) Y PERMISOS ANON
-- Garantiza persistencia, sincronización y personalización en tiempo real
-- ========================================================

-- 1. Asegurar tabla challenge_goals
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

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_challenge_goals_challenge ON public.challenge_goals(challenge_id);

-- 2. Habilitar RLS en todas las tablas de retos
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_activities ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas restrictivas previas que bloquean cliente anónimo
DO $$
BEGIN
  -- challenges
  DROP POLICY IF EXISTS "Users can select challenges they participate in" ON public.challenges;
  DROP POLICY IF EXISTS "Authenticated users can create challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Creators and admins can update challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Creators can delete their challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Acceso total challenges" ON public.challenges;
  DROP POLICY IF EXISTS "Acceso a challenges" ON public.challenges;
  CREATE POLICY "Acceso a challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

  -- challenge_members
  DROP POLICY IF EXISTS "Users can view challenge members" ON public.challenge_members;
  DROP POLICY IF EXISTS "Users can join or owners can add members" ON public.challenge_members;
  DROP POLICY IF EXISTS "Owners can update member roles" ON public.challenge_members;
  DROP POLICY IF EXISTS "Users can leave or owners can remove members" ON public.challenge_members;
  DROP POLICY IF EXISTS "Acceso a challenge_members" ON public.challenge_members;
  CREATE POLICY "Acceso a challenge_members" ON public.challenge_members FOR ALL USING (true) WITH CHECK (true);

  -- challenge_habits
  DROP POLICY IF EXISTS "Users can view challenge habits" ON public.challenge_habits;
  DROP POLICY IF EXISTS "Owners can manage challenge habits" ON public.challenge_habits;
  DROP POLICY IF EXISTS "Acceso a challenge_habits" ON public.challenge_habits;
  CREATE POLICY "Acceso a challenge_habits" ON public.challenge_habits FOR ALL USING (true) WITH CHECK (true);

  -- challenge_logs
  DROP POLICY IF EXISTS "Users can view challenge logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can log their own habits" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can update their own logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Users can delete their own logs" ON public.challenge_logs;
  DROP POLICY IF EXISTS "Acceso a challenge_logs" ON public.challenge_logs;
  CREATE POLICY "Acceso a challenge_logs" ON public.challenge_logs FOR ALL USING (true) WITH CHECK (true);

  -- challenge_goals
  DROP POLICY IF EXISTS "Acceso a challenge_goals" ON public.challenge_goals;
  CREATE POLICY "Acceso a challenge_goals" ON public.challenge_goals FOR ALL USING (true) WITH CHECK (true);

  -- challenge_activities
  DROP POLICY IF EXISTS "Users can view challenge activities" ON public.challenge_activities;
  DROP POLICY IF EXISTS "Users can record activities" ON public.challenge_activities;
  DROP POLICY IF EXISTS "Acceso a challenge_activities" ON public.challenge_activities;
  CREATE POLICY "Acceso a challenge_activities" ON public.challenge_activities FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 4. Agregar a Publicación Realtime de Supabase
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
