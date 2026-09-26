-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRACIÓN V10
-- INVITACIONES Y ACEPTACIÓN DE PARTICIPACIÓN EN PROYECTOS Y RETOS
-- ========================================================

-- 1. Añadir columna pending_member_ids a la tabla de proyectos
ALTER TABLE IF EXISTS public.projects 
ADD COLUMN IF NOT EXISTS pending_member_ids JSONB DEFAULT '[]'::jsonb;

-- 2. Añadir columna status a la tabla de participantes de retos (default 'pending' para nuevas invitaciones)
ALTER TABLE IF EXISTS public.challenge_members 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined'));

-- 3. Añadir columna accepted_at para trazabilidad de confirmación
ALTER TABLE IF EXISTS public.challenge_members 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- 4. Índices de aceleración para consultas de estado de participación
CREATE INDEX IF NOT EXISTS idx_challenge_members_user_status ON public.challenge_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_pending_members ON public.projects USING gin (pending_member_ids);
