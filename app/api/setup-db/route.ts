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

        -- Políticas de acceso para anon / autenticados
        DROP POLICY IF EXISTS "Public access habits" ON public.habits;
        CREATE POLICY "Public access habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access habit_logs" ON public.habit_logs;
        CREATE POLICY "Public access habit_logs" ON public.habit_logs FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access goals" ON public.goals;
        CREATE POLICY "Public access goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public access habit_notes" ON public.habit_notes;
        CREATE POLICY "Public access habit_notes" ON public.habit_notes FOR ALL USING (true) WITH CHECK (true);
      `;

      await client.query(sql);

      return NextResponse.json({
        success: true,
        message: 'Tablas de Habit Core (habits, habit_logs, goals, habit_notes) creadas o verificadas exitosamente en Supabase.',
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
