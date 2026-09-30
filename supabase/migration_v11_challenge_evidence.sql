-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRACIÓN V11
-- EVIDENCIAS FOTOGRÁFICAS EN RETOS COMPARTIDOS (GOOGLE DRIVE INTEGRATION)
-- ========================================================

-- 1. Añadir columnas de evidencia a la tabla challenge_logs de forma idempotente
ALTER TABLE IF EXISTS public.challenge_logs 
ADD COLUMN IF NOT EXISTS evidence_url TEXT;

ALTER TABLE IF EXISTS public.challenge_logs 
ADD COLUMN IF NOT EXISTS evidence_file_id TEXT;

ALTER TABLE IF EXISTS public.challenge_logs 
ADD COLUMN IF NOT EXISTS evidence_uploaded_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.challenge_logs 
ADD COLUMN IF NOT EXISTS evidence_uploaded_by TEXT;

ALTER TABLE IF EXISTS public.challenge_logs 
ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'none';

-- 2. Asegurar restricción check para evidence_status si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_challenge_logs_evidence_status'
    ) THEN
        ALTER TABLE public.challenge_logs 
        ADD CONSTRAINT check_challenge_logs_evidence_status 
        CHECK (evidence_status IN ('none', 'uploading', 'uploaded', 'failed'));
    END IF;
END $$;

-- 3. Índices para acelerar consultas de evidencia y auditoría
CREATE INDEX IF NOT EXISTS idx_challenge_logs_evidence_status 
ON public.challenge_logs(challenge_id, evidence_status);

CREATE INDEX IF NOT EXISTS idx_challenge_logs_evidence_file 
ON public.challenge_logs(evidence_file_id);
