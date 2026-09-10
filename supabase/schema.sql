-- ========================================================
-- Schema SQL v2 para Kanban Duo (Supabase / PostgreSQL)
-- Soporte completo de Usuarios, Contraseñas Cifradas, Roles y Fotos
-- ========================================================

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT '#3b82f6',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Insertar cuentas iniciales con contraseñas seguras
-- Diana (Admin): Admin123!
-- Alex (Colaborador): Alex123!
-- Beatriz (Colaboradora): Beatriz123!
INSERT INTO public.users (id, name, email, avatar, color, role, password_hash, is_active)
VALUES
  (
    'user-admin',
    'Diana Méndez (Admin)',
    'admin@empresa.com',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    '#6366f1',
    'admin',
    '5728a1892a1d83dc6f27686ec169475e6bf47fa680155203471ad3e33633f5e6',
    true
  ),
  (
    'user-alex',
    'Alex Rivera',
    'alex@empresa.com',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    '#3b82f6',
    'member',
    '6c5ee3e006a4217ecf271f5760599383e9d0aab51f3800b3d01d94e1a8d1afec',
    true
  ),
  (
    'user-beatriz',
    'Beatriz Castro',
    'beatriz@empresa.com',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    '#8b5cf6',
    'member',
    'aec392b498649320df0f57d2cc7f0ea4a554956348bd22278a95c143936998ba',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  avatar = EXCLUDED.avatar,
  role = EXCLUDED.role;

-- 2. Tabla de Tareas
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('iniciado', 'trabajando', 'finalizado')),
  priority TEXT NOT NULL CHECK (priority IN ('baja', 'media', 'alta')),
  assigned_to TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Registro de Actividad en Tareas
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  task_title TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Auditoría de Seguridad (cambios de contraseñas, fotos, usuarios)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  admin_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL,
  target_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  target_user_name TEXT,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar Sincronización Realtime en Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;

-- Políticas de seguridad RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso a usuarios" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso a tareas" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso a logs actividad" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso a logs seguridad" ON public.security_logs FOR ALL USING (true) WITH CHECK (true);
