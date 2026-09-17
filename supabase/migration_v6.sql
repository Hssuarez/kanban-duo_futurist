-- ========================================================
-- Migración v6: Dominio HABIT CORE (Hábitos, Retos, Objetivos, Notas)
-- Idempotente, No Destructiva y Compatible con Supabase
-- ========================================================

-- 1. Tabla de Hábitos (Personales y de Retos)
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id TEXT, -- Se añade FK después de crear challenges
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#06b6d4',
  category TEXT DEFAULT 'general',
  target_type TEXT NOT NULL DEFAULT 'boolean' CHECK (target_type IN ('boolean', 'count', 'numeric', 'duration')),
  target_value NUMERIC DEFAULT 1,
  target_unit TEXT,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'custom')),
  frequency_days INT[] DEFAULT '{1,2,3,4,5,6,7}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Registros Diarios de Hábitos (Check-ins)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'skipped', 'failed', 'not_applicable')),
  numeric_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_habit_user_date UNIQUE (habit_id, user_id, date_key)
);

-- 3. Tabla de Retos Compartidos (Challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  created_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  color TEXT DEFAULT '#06b6d4',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  target_goal TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agregar FK de challenge_id en habits si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'habits_challenge_id_fkey'
  ) THEN
    ALTER TABLE public.habits 
    ADD CONSTRAINT habits_challenge_id_fkey 
    FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Tabla de Miembros de Retos (Challenge Members)
CREATE TABLE IF NOT EXISTS public.challenge_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_challenge_user UNIQUE (challenge_id, user_id)
);

-- 5. Tabla de Objetivos (Goals)
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id TEXT REFERENCES public.challenges(id) ON DELETE CASCADE,
  habit_id TEXT REFERENCES public.habits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  month_key TEXT,
  target_type TEXT NOT NULL DEFAULT 'boolean' CHECK (target_type IN ('boolean', 'count', 'percentage')),
  target_value NUMERIC DEFAULT 1,
  current_value NUMERIC DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla de Notas Periódicas (Habit Notes)
CREATE TABLE IF NOT EXISTS public.habit_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id TEXT REFERENCES public.challenges(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_period_note UNIQUE (user_id, period_key)
);

-- 7. Integración Opcional en Tasks Existentes (No Destructiva)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS challenge_id TEXT REFERENCES public.challenges(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS habit_id TEXT REFERENCES public.habits(id) ON DELETE SET NULL;

-- 8. Índices de Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_challenge_id ON public.habits(challenge_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date_key ON public.habit_logs(date_key);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_challenges_created_by ON public.challenges(created_by);
CREATE INDEX IF NOT EXISTS idx_challenge_members_challenge ON public.challenge_members(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_members_user ON public.challenge_members(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_month_key ON public.goals(month_key);
CREATE INDEX IF NOT EXISTS idx_habit_notes_user_period ON public.habit_notes(user_id, period_key);
CREATE INDEX IF NOT EXISTS idx_tasks_challenge_id ON public.tasks(challenge_id);
CREATE INDEX IF NOT EXISTS idx_tasks_habit_id ON public.tasks(habit_id);

-- 9. Habilitar RLS en las Nuevas Tablas
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Acceso a habits') THEN
    CREATE POLICY "Acceso a habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habit_logs' AND policyname = 'Acceso a habit_logs') THEN
    CREATE POLICY "Acceso a habit_logs" ON public.habit_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Acceso a challenges') THEN
    CREATE POLICY "Acceso a challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_members' AND policyname = 'Acceso a challenge_members') THEN
    CREATE POLICY "Acceso a challenge_members" ON public.challenge_members FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Acceso a goals') THEN
    CREATE POLICY "Acceso a goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habit_notes' AND policyname = 'Acceso a habit_notes') THEN
    CREATE POLICY "Acceso a habit_notes" ON public.habit_notes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10. Agregar a Publicación Realtime de Supabase
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habit_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'challenges') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'goals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
  END IF;
END $$;
