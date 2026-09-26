import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleMigration();
}

export async function POST() {
  return handleMigration();
}

async function handleMigration() {
  const connString =
    process.env.POSTGRES_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_URL_NON_POOLING;

  const host = process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_HOST || process.env.POSTGRES_HOST;
  const user = process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_USER || process.env.POSTGRES_USER;
  const password = process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.NEXT_PUBLIC_SUPABASE_POSTGRES_DATABASE || process.env.POSTGRES_DATABASE || 'postgres';

  // Permitir certificados autofirmados / cadenas de Supabase en entorno serverless
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  let pool: Pool;
  if (connString) {
    const sanitizedConn = connString.replace(/([?&])sslmode=[^&]+/, '$1sslmode=no-verify');
    pool = new Pool({
      connectionString: sanitizedConn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
  } else if (host && user && password) {
    pool = new Pool({
      host,
      user,
      password,
      database,
      port: 5432,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
  } else {
    return NextResponse.json(
      {
        success: false,
        error: 'No Postgres connection credentials available in environment',
        detectedKeys: Object.keys(process.env).filter((k) => k.includes('POSTGRES') || k.includes('SUPABASE')),
      },
      { status: 500 }
    );
  }

  try {
    const client = await pool.connect();
    try {
      const sql = `
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

        -- 5. Tabla de Retos Compartidos (Challenges)
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

        -- 6. Tabla de Miembros de Retos (Challenge Members)
        CREATE TABLE IF NOT EXISTS public.challenge_members (
          id TEXT PRIMARY KEY,
          challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          status TEXT NOT NULL DEFAULT 'pending',
          joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
          accepted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (challenge_id, user_id)
        );

        -- Garantizar columna status y accepted_at si la tabla ya existía
        ALTER TABLE IF EXISTS public.challenge_members 
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

        ALTER TABLE IF EXISTS public.challenge_members 
        ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

        -- 7. Tabla de Hábitos de Reto (Challenge Habits)
        CREATE TABLE IF NOT EXISTS public.challenge_habits (
          id TEXT PRIMARY KEY,
          challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          icon TEXT NOT NULL DEFAULT '🏋️',
          target_value INTEGER DEFAULT 1,
          display_order INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- 8. Tabla de Check-ins de Reto (Challenge Logs)
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
          UNIQUE (challenge_habit_id, user_id, date_key)
        );

        -- 9. Tabla de Objetivos de Reto (Challenge Goals)
        CREATE TABLE IF NOT EXISTS public.challenge_goals (
          id TEXT PRIMARY KEY,
          challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          target_value NUMERIC DEFAULT 20,
          current_value NUMERIC DEFAULT 0,
          unit TEXT DEFAULT 'sesiones',
          is_completed BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- 10. Tabla de Actividades de Reto (Challenge Activities)
        CREATE TABLE IF NOT EXISTS public.challenge_activities (
          id TEXT PRIMARY KEY,
          challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'joined',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- 11. Columnas de Invitación en Projects
        ALTER TABLE IF EXISTS public.projects 
        ADD COLUMN IF NOT EXISTS pending_member_ids JSONB DEFAULT '[]'::jsonb;

        -- Índices Habit Core y Retos
        CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
        CREATE INDEX IF NOT EXISTS idx_habit_logs_composite ON public.habit_logs(habit_id, user_id, date_key);
        CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_habit_notes_user ON public.habit_notes(user_id, period_key);
        CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
        CREATE INDEX IF NOT EXISTS idx_challenge_members_user_status ON public.challenge_members(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_challenge_members_challenge ON public.challenge_members(challenge_id);
        CREATE INDEX IF NOT EXISTS idx_challenge_habits_challenge ON public.challenge_habits(challenge_id);
        CREATE INDEX IF NOT EXISTS idx_challenge_logs_composite ON public.challenge_logs(challenge_id, user_id, date_key);

        -- Habilitar RLS
        ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.habit_notes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.challenge_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.challenge_habits ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.challenge_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.challenge_goals ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.challenge_activities ENABLE ROW LEVEL SECURITY;

        -- Políticas de acceso para anon / autenticados
        DROP POLICY IF EXISTS "Public access habits" ON public.habits;
        CREATE POLICY "Public access habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access habit_logs" ON public.habit_logs;
        CREATE POLICY "Public access habit_logs" ON public.habit_logs FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access goals" ON public.goals;
        CREATE POLICY "Public access goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access habit_notes" ON public.habit_notes;
        CREATE POLICY "Public access habit_notes" ON public.habit_notes FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access challenges" ON public.challenges;
        CREATE POLICY "Public access challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access challenge_members" ON public.challenge_members;
        CREATE POLICY "Public access challenge_members" ON public.challenge_members FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access challenge_habits" ON public.challenge_habits;
        CREATE POLICY "Public access challenge_habits" ON public.challenge_habits FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access challenge_logs" ON public.challenge_logs;
        CREATE POLICY "Public access challenge_logs" ON public.challenge_logs FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access challenge_goals" ON public.challenge_goals;
        CREATE POLICY "Public access challenge_goals" ON public.challenge_goals FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access challenge_activities" ON public.challenge_activities;
        CREATE POLICY "Public access challenge_activities" ON public.challenge_activities FOR ALL USING (true) WITH CHECK (true);
      `;

      await client.query(sql);

      return NextResponse.json({
        success: true,
        message: 'Tablas de Habit Core, Retos Compartidos e Invitaciones verificadas exitosamente en Supabase.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Error ejecutando migración en Supabase Postgres:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        code: err.code,
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
