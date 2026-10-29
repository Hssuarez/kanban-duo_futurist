-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRACIÓN ADITIVA V10
-- CLASIFICACIÓN DE RETOS (FÍSICO VS. GENERAL) Y REGISTRO DE CALORÍAS
--
-- Naturaleza: 100% ADITIVA Y NO DESTRUCTIVA
-- No elimina tablas, filas ni columnas existentes.
-- ========================================================

-- 1. Añadir columna dedicada challenge_type a public.challenges
-- Valores admitidos: 'physical' (físico/deportivo con métricas de kcal) | 'general' (hábito general sin kcal)
-- Se deja NULL por defecto en filas históricas para que la aplicación aplique
-- inferencia no destructiva hasta que el creador guarde explícitamente el tipo.
ALTER TABLE IF EXISTS public.challenges
ADD COLUMN IF NOT EXISTS challenge_type TEXT;

-- 2. Garantizar que la columna numeric_value exista en public.challenge_logs
-- (Utilizada en retos físicos para almacenar las calorías enteras registradas [0..10000])
ALTER TABLE IF EXISTS public.challenge_logs
ADD COLUMN IF NOT EXISTS numeric_value NUMERIC;

-- 3. Restricción de validación no destructiva para el rango de calorías (0 a 10,000)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_challenge_logs_calories_range'
  ) THEN
    ALTER TABLE public.challenge_logs
    ADD CONSTRAINT chk_challenge_logs_calories_range
    CHECK (numeric_value IS NULL OR (numeric_value >= 0 AND numeric_value <= 10000));
  END IF;
END $$;
