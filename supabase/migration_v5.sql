-- ========================================================
-- Migración v5: Auditoría Forense de IP, Geolocalización y Dispositivos
-- ========================================================

-- 1. Columnas de auditoría en la tabla de usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_ip TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_device TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_city TEXT;

-- 2. Columnas estructuradas en el registro de eventos de seguridad
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE public.security_logs ADD COLUMN IF NOT EXISTS browser TEXT;

-- 3. Índices para acelerar consultas de auditoría y análisis de conexiones
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON public.security_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_logs(ip);
CREATE INDEX IF NOT EXISTS idx_security_logs_admin_id ON public.security_logs(admin_id);
