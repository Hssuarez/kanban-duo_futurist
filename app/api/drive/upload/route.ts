import { NextRequest, NextResponse } from 'next/server';
import {
  isGoogleDriveConfigured,
  getGoogleDriveClient,
  ensureUserChallengeFolder,
  uploadEvidenceFile,
  deleteEvidenceFile,
  sanitizeName,
} from '@/lib/googleDriveServer';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
];

const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB max

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    const challengeId = formData.get('challengeId') as string | null;
    const challengeHabitId = formData.get('challengeHabitId') as string | null;
    const dateKey = formData.get('dateKey') as string | null;
    const previousFileId = (formData.get('previousFileId') as string | null) || undefined;
    const headerUserId = req.headers.get('x-user-id');
    const formUserId = formData.get('userId') as string | null;
    const requestingUserId = headerUserId || formUserId;

    // 1. Validaciones básicas de parámetros
    if (!file || !challengeId || !challengeHabitId || !dateKey) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos (file, challengeId, challengeHabitId, dateKey).' },
        { status: 400 }
      );
    }

    if (!requestingUserId) {
      return NextResponse.json(
        { success: false, error: 'No se identificó la sesión del usuario (x-user-id requerido).' },
        { status: 401 }
      );
    }

    // 2. Validación de archivo (tipo y peso)
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Tipo de archivo no permitido (${file.type}). Solo imágenes JPG, PNG o WEBP.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'El archivo supera el límite de 12 MB.' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Servicio de base de datos no disponible en el servidor.' },
        { status: 503 }
      );
    }

    // 3. ZERO-TRUST: Verificar usuario en base de datos
    const { data: dbUser, error: uErr } = await supabase
      .from('users')
      .select('id, name, is_active, role')
      .eq('id', requestingUserId)
      .single();

    if (uErr || !dbUser || !dbUser.is_active) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autorizado o inactivo.' },
        { status: 401 }
      );
    }

    // 4. Verificar que el reto exista
    const { data: challenge, error: cErr } = await supabase
      .from('challenges')
      .select('id, title, start_date, end_date, created_by')
      .eq('id', challengeId)
      .single();

    if (cErr || !challenge) {
      return NextResponse.json(
        { success: false, error: 'El reto especificado no existe.' },
        { status: 404 }
      );
    }

    const isCreator = challenge.created_by === dbUser.id;
    const isAdmin = dbUser.role === 'admin';

    // 5. ZERO-TRUST: Verificar membresía aceptada en el reto
    let { data: member, error: mErr } = await supabase
      .from('challenge_members')
      .select('id, status, role')
      .eq('challenge_id', challengeId)
      .eq('user_id', dbUser.id)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    // Auto-curación y activación de membresía:
    // Si el usuario ya fue invitado al reto (existe fila en challenge_members) y está subiendo evidencia,
    // o si es el creador/admin del reto, confirmamos automáticamente su participación activa en Supabase:
    if (member && member.status !== 'accepted') {
      await supabase
        .from('challenge_members')
        .update({
          status: 'accepted',
          accepted_at: nowIso,
        })
        .eq('id', member.id);
      member.status = 'accepted';
    } else if (!member && (isCreator || isAdmin)) {
      const newMemberId = `cm-${challengeId}-${dbUser.id}`;
      await supabase.from('challenge_members').upsert({
        id: newMemberId,
        challenge_id: challengeId,
        user_id: dbUser.id,
        role: isCreator ? 'owner' : 'member',
        status: 'accepted',
        joined_at: challenge.start_date || nowIso.slice(0, 10),
        accepted_at: nowIso,
      }, { onConflict: 'challenge_id,user_id' });
      member = { id: newMemberId, status: 'accepted', role: isCreator ? 'owner' : 'member' };
    }

    if (!member || member.status !== 'accepted') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado: El usuario no es participante activo de este reto.' },
        { status: 403 }
      );
    }

    // 6. Verificar que el hábito pertenezca al reto
    const { data: habit, error: hErr } = await supabase
      .from('challenge_habits')
      .select('id, title, challenge_id')
      .eq('id', challengeHabitId)
      .eq('challenge_id', challengeId)
      .single();

    if (hErr || !habit) {
      return NextResponse.json(
        { success: false, error: 'El hábito no pertenece al reto especificado.' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const logId = `clog-${challengeId}-${challengeHabitId}-${dbUser.id}-${dateKey}`;

    // 7. MODO DESARROLLO / DRIVE NO CONFIGURADO
    if (!isGoogleDriveConfigured()) {
      const mockFileId = `mock-${Date.now()}`;
      const mockUrl = `/api/drive/file/${mockFileId}`;

      // Actualizar en Supabase de todos modos para pruebas de flujo
      await supabase.from('challenge_logs').upsert({
        id: logId,
        challenge_id: challengeId,
        challenge_habit_id: challengeHabitId,
        user_id: dbUser.id,
        date_key: dateKey,
        status: 'completed',
        evidence_url: mockUrl,
        evidence_file_id: mockFileId,
        evidence_uploaded_at: nowIso,
        evidence_uploaded_by: dbUser.id,
        evidence_status: 'uploaded',
        updated_at: nowIso,
      });

      return NextResponse.json({
        success: true,
        isMock: true,
        message: 'Google Drive no configurado en entorno. Se registró evidencia en modo simulación.',
        evidence: {
          fileId: mockFileId,
          fileName: file.name,
          url: mockUrl,
          status: 'uploaded',
          uploadedAt: nowIso,
          uploadedBy: dbUser.id,
        },
      });
    }

    // 8. FLUJO REAL: GOOGLE DRIVE PERSONAL VÍA OAUTH 2.0
    const drive = getGoogleDriveClient();

    const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeHabit = sanitizeName(habit.title);
    const safeUser = sanitizeName(dbUser.name);
    const shortHash = Math.random().toString(36).substring(2, 8);
    const fileName = `${dateKey}_${safeHabit}_${safeUser}_${shortHash}.${originalExt}`;

    let uploadResult: { fileId: string; fileName: string; size: number };

    try {
      // Resolver estructura de carpetas: /KanbanDuo_Evidencias/[USUARIO]/[RETO]/
      const { challengeFolderId } = await ensureUserChallengeFolder(
        drive,
        dbUser.name,
        challenge.title
      );

      // Subir archivo privado a Google Drive
      uploadResult = await uploadEvidenceFile(
        drive,
        fileBuffer,
        fileName,
        file.type || 'image/jpeg',
        challengeFolderId
      );
    } catch (driveErr: any) {
      console.error('Error al subir a Google Drive Personal:', driveErr);
      return NextResponse.json(
        {
          success: false,
          error: `Error al subir la evidencia a Google Drive: ${driveErr?.message || 'Fallo de conexión o credenciales inválidas.'}`,
        },
        { status: 500 }
      );
    }

    const evidenceUrl = `/api/drive/file/${encodeURIComponent(uploadResult.fileId)}`;

    // 9. Actualizar Supabase (Atomicidad)
    const { error: upsertErr } = await supabase.from('challenge_logs').upsert({
      id: logId,
      challenge_id: challengeId,
      challenge_habit_id: challengeHabitId,
      user_id: dbUser.id,
      date_key: dateKey,
      status: 'completed',
      evidence_url: evidenceUrl,
      evidence_file_id: uploadResult.fileId,
      evidence_uploaded_at: nowIso,
      evidence_uploaded_by: dbUser.id,
      evidence_status: 'uploaded',
      updated_at: nowIso,
    });

    // 10. COMPENSACIÓN / ROLLBACK SI SUPABASE FALLA
    if (upsertErr) {
      console.error('Error actualizando Supabase tras subir a Drive. Compensando rollback en Drive:', upsertErr);
      await deleteEvidenceFile(drive, uploadResult.fileId).catch((delErr) =>
        console.error('Error al compensar borrado en Drive tras fallo de Supabase:', delErr)
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Error al registrar la evidencia en base de datos. Se canceló la subida a Drive.',
          details: upsertErr.message,
        },
        { status: 500 }
      );
    }

    // 11. LIMPIEZA SEGURA DE EVIDENCIA ANTERIOR
    if (previousFileId && previousFileId !== uploadResult.fileId && !previousFileId.startsWith('mock-')) {
      deleteEvidenceFile(drive, previousFileId).catch((delPrevErr) =>
        console.warn(`No se pudo eliminar el archivo anterior en Drive (${previousFileId}):`, delPrevErr)
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'google-drive',
      evidence: {
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        url: evidenceUrl,
        status: 'uploaded',
        uploadedAt: nowIso,
        uploadedBy: dbUser.id,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/drive/upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error inesperado durante la subida de evidencia.',
      },
      { status: 500 }
    );
  }
}
