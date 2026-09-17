-- ========================================================
-- KANBAN//DUO & HABIT CORE — MIGRATION V7
-- FASE C: SHARED CHALLENGES (RETOS COLABORATIVOS Y COMPETITIVOS)
-- Tablas dedicadas, índices optimizados y RLS granular
-- ========================================================

-- 1. TABLA: challenges
CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '🏆',
    color TEXT NOT NULL DEFAULT '#06b6d4',
    cover_image TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    mode TEXT NOT NULL DEFAULT 'competitive', -- 'collaborative' | 'competitive'
    status TEXT NOT NULL DEFAULT 'active',    -- 'upcoming' | 'active' | 'completed' | 'archived'
    target_goal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: challenge_members
CREATE TABLE IF NOT EXISTS challenge_members (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',     -- 'owner' | 'member'
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_id, user_id)
);

-- 3. TABLA: challenge_habits
CREATE TABLE IF NOT EXISTS challenge_habits (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏋️',
    target_value INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: challenge_logs (Evidencia de check-in independiente)
CREATE TABLE IF NOT EXISTS challenge_logs (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    challenge_habit_id TEXT NOT NULL REFERENCES challenge_habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_key DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'empty' | 'not_applicable'
    numeric_value NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_id, challenge_habit_id, user_id, date_key)
);

-- 5. TABLA: challenge_activities (Feed en tiempo real)
CREATE TABLE IF NOT EXISTS challenge_activities (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL DEFAULT 'check_in', -- 'check_in' | 'joined' | 'milestone'
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenge_members_challenge ON challenge_members(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_members_user ON challenge_members(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_habits_challenge ON challenge_habits(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_logs_composite ON challenge_logs(challenge_id, user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_challenge_activities_challenge ON challenge_activities(challenge_id, created_at DESC);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) ESTRICTA Y POR OPERACIÓN
-- ========================================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_activities ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- POLÍTICAS: challenges
-- --------------------------------------------------------
-- SELECT: Cualquier usuario autenticado puede ver los retos en los que es miembro o creador
CREATE POLICY "Users can select challenges they participate in" ON challenges
FOR SELECT USING (
    auth.uid() = created_by
    OR EXISTS (
        SELECT 1 FROM challenge_members cm
        WHERE cm.challenge_id = challenges.id
        AND cm.user_id = auth.uid()
    )
);

-- INSERT: Usuarios autenticados pueden crear retos
CREATE POLICY "Users can create challenges" ON challenges
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- UPDATE: Solo el creador/owner puede actualizar la información del reto
CREATE POLICY "Challenge owners can update challenge" ON challenges
FOR UPDATE USING (auth.uid() = created_by);

-- DELETE: Solo el creador/owner puede eliminar el reto
CREATE POLICY "Challenge owners can delete challenge" ON challenges
FOR DELETE USING (auth.uid() = created_by);

-- --------------------------------------------------------
-- POLÍTICAS: challenge_members
-- --------------------------------------------------------
-- SELECT: Miembros pueden ver a los demás miembros del mismo reto
CREATE POLICY "Members can view participants of their challenges" ON challenge_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM challenge_members cm
        WHERE cm.challenge_id = challenge_members.challenge_id
        AND cm.user_id = auth.uid()
    )
);

-- INSERT: Creador del reto o el propio usuario uniéndose
CREATE POLICY "Owner or self can add challenge members" ON challenge_members
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM challenges c
        WHERE c.id = challenge_members.challenge_id
        AND c.created_by = auth.uid()
    )
);

-- DELETE: Owner del reto o el propio usuario saliendo
CREATE POLICY "Owner or self can remove challenge members" ON challenge_members
FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM challenges c
        WHERE c.id = challenge_members.challenge_id
        AND c.created_by = auth.uid()
    )
);

-- --------------------------------------------------------
-- POLÍTICAS: challenge_habits
-- --------------------------------------------------------
CREATE POLICY "Members can view challenge habits" ON challenge_habits
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM challenge_members cm
        WHERE cm.challenge_id = challenge_habits.challenge_id
        AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Owner can insert challenge habits" ON challenge_habits
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM challenges c
        WHERE c.id = challenge_habits.challenge_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "Owner can update challenge habits" ON challenge_habits
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM challenges c
        WHERE c.id = challenge_habits.challenge_id
        AND c.created_by = auth.uid()
    )
);

-- --------------------------------------------------------
-- POLÍTICAS: challenge_logs (LA REGLA FUNDAMENTAL)
-- TODOS PUEDEN VER LA MATRIZ DEL RETO.
-- CADA USUARIO SOLO PUEDE MODIFICAR SUS PROPIOS CHECK-INS.
-- --------------------------------------------------------
-- 1. SELECT: Cualquier miembro del reto puede ver TODOS los logs del reto (para pintar la matriz)
CREATE POLICY "Members can select all challenge logs for the matrix" ON challenge_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM challenge_members cm
        WHERE cm.challenge_id = challenge_logs.challenge_id
        AND cm.user_id = auth.uid()
    )
);

-- 2. INSERT: ÚNICAMENTE el usuario autenticado para su propio user_id
CREATE POLICY "Users can only insert their own challenge logs" ON challenge_logs
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM challenge_members cm
        WHERE cm.challenge_id = challenge_logs.challenge_id
        AND cm.user_id = auth.uid()
    )
);

-- 3. UPDATE: ÚNICAMENTE el usuario autenticado para su propio check-in
CREATE POLICY "Users can only update their own challenge logs" ON challenge_logs
FOR UPDATE USING (
    auth.uid() = user_id
) WITH CHECK (
    auth.uid() = user_id
);

-- 4. DELETE: ÚNICAMENTE el usuario autenticado para su propio check-in
CREATE POLICY "Users can only delete their own challenge logs" ON challenge_logs
FOR DELETE USING (
    auth.uid() = user_id
);

-- --------------------------------------------------------
-- POLÍTICAS: challenge_activities
-- --------------------------------------------------------
CREATE POLICY "Members can view challenge activities" ON challenge_activities
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM challenge_members cm
        WHERE cm.challenge_id = challenge_activities.challenge_id
        AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Members can insert their own challenge activity" ON challenge_activities
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);
