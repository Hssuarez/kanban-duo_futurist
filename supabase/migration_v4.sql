-- ========================================================
-- Migración v4: Soporte Multi-Proyecto con Tableros y Equipos
-- ========================================================

-- 1. Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#06b6d4',
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  member_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices para proyectos
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);

-- 3. Habilitar RLS y Realtime para proyectos
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'Acceso a proyectos'
  ) THEN
    CREATE POLICY "Acceso a proyectos" ON public.projects FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
END $$;

-- 4. Sembrar el proyecto por defecto 'proj-default' (Protocolo Alpha) con todos los usuarios actuales
INSERT INTO public.projects (id, name, description, color, created_by, member_ids)
VALUES (
  'proj-default',
  'Protocolo Alpha (Proyecto Principal)',
  'Tablero central del sistema con el equipo inicial.',
  '#06b6d4',
  'user-admin',
  ARRAY['user-admin', 'user-alex', 'user-beatriz']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Agregar columna project_id a public.tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE;

-- 6. Asignar todas las tareas existentes sin project_id al proyecto por defecto
UPDATE public.tasks
SET project_id = 'proj-default'
WHERE project_id IS NULL;

-- 7. Crear índice para acelerar consultas por proyecto en tareas
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
