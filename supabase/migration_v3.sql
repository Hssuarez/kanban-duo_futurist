-- ========================================================
-- Migración v3: Soporte de Fechas de Tareas (started_at, completed_at)
-- y Tabla de Histórico Inmutable de Estados (task_status_history)
-- ========================================================

-- 1. Agregar columnas a public.tasks si no existen
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Migración segura de datos para tareas existentes
UPDATE public.tasks
SET started_at = created_at
WHERE started_at IS NULL AND (status = 'iniciado' OR status = 'trabajando' OR status = 'finalizado');

UPDATE public.tasks
SET completed_at = updated_at
WHERE completed_at IS NULL AND status = 'finalizado';

-- 3. Crear tabla de histórico de estados
CREATE TABLE IF NOT EXISTS public.task_status_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  previous_status TEXT CHECK (previous_status IN ('iniciado', 'trabajando', 'finalizado') OR previous_status IS NULL),
  new_status TEXT NOT NULL CHECK (new_status IN ('iniciado', 'trabajando', 'finalizado')),
  changed_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  changed_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  observations TEXT
);

-- 4. Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_tsh_task_id ON public.task_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_tsh_created_at ON public.task_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_tsh_changed_by ON public.task_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_tasks_started_at ON public.tasks(started_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON public.tasks(completed_at);

-- 5. Habilitar Realtime y RLS
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_status_history;
ALTER TABLE public.task_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a historico" ON public.task_status_history FOR ALL USING (true) WITH CHECK (true);

-- 6. Sembrar histórico inicial para tareas existentes
INSERT INTO public.task_status_history (id, task_id, previous_status, new_status, changed_by, changed_by_name, created_at, observations)
SELECT 
  'hist-' || t.id || '-init',
  t.id,
  NULL,
  t.status,
  t.created_by,
  COALESCE(u.name, 'Sistema'),
  t.created_at,
  'Registro inicial del sistema'
FROM public.tasks t
LEFT JOIN public.users u ON t.created_by = u.id
ON CONFLICT (id) DO NOTHING;
