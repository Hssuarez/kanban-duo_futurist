import { NextRequest, NextResponse } from 'next/server';
import {
  isGoogleDriveConfigured,
  getGoogleDriveClient,
  deleteEvidenceFile,
} from '@/lib/googleDriveServer';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, challengeHabitId, dateKey, fileId } = body;
    const headerUserId = req.headers.get('x-user-id');
    const bodyUserId = body.userId;
    const requestingUserId = headerUserId || bodyUserId;

    if (!challengeId || !challengeHabitId || !dateKey) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos (challengeId, challengeHabitId, dateKey).' },
        { status: 400 }
      );
    }

    if (!requestingUserId) {
      return NextResponse.json(
        { success: false, error: 'No se identificó la sesión del usuario.' },
        { status: 401 }
      );
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Servicio de base de datos no disponible.' },
        { status: 503 }
      );
    }

    // 1. Validar usuario activo
    const { data: dbUser, error: uErr } = await supabase
      .from('users')
      .select('id, name, is_active')
      .eq('id', requestingUserId)
      .single();

    if (uErr || !dbUser || !dbUser.is_active) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autorizado o inactivo.' },
        { status: 401 }
      );
    }

    // 2. Verificar que el log exista y pertenezca al usuario
    const { data: existingLog, error: logErr } = await supabase
      .from('challenge_logs')
      .select('id, user_id, evidence_file_id')
      .eq('challenge_id', challengeId)
      .eq('challenge_habit_id', challengeHabitId)
      .eq('user_id', dbUser.id)
      .eq('date_key', dateKey)
      .single();

    if (logErr || !existingLog) {
      return NextResponse.json(
        { success: false, error: 'No se encontró el registro de check-in para este usuario y fecha.' },
        { status: 404 }
      );
    }

    const targetFileId = fileId || existingLog.evidence_file_id;

    // 3. Limpiar campos de evidencia en Supabase
    const { error: updateErr } = await supabase
      .from('challenge_logs')
      .update({
        evidence_url: null,
        evidence_file_id: null,
        evidence_uploaded_at: null,
        evidence_uploaded_by: null,
        evidence_status: 'none',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingLog.id);

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar base de datos al remover la evidencia.' },
        { status: 500 }
      );
    }

    // 4. Si hay archivo en Supabase Storage o Google Drive y no es mock, eliminarlo físicamente
    if (targetFileId) {
      if (targetFileId.startsWith('supabase-')) {
        const storagePath = decodeURIComponent(targetFileId.replace('supabase-', ''));
        try {
          await supabase.storage.from('challenge-evidence').remove([storagePath]);
        } catch (sErr) {
          console.warn(`No se pudo eliminar el archivo en Supabase Storage (${storagePath}):`, sErr);
        }
      } else if (!targetFileId.startsWith('mock-') && isGoogleDriveConfigured()) {
        try {
          const drive = getGoogleDriveClient();
          await deleteEvidenceFile(drive, targetFileId);
        } catch (driveErr) {
          console.warn(`No se pudo eliminar el archivo en Google Drive (${targetFileId}):`, driveErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Evidencia eliminada correctamente.',
    });
  } catch (error: any) {
    console.error('Error en /api/drive/delete:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error inesperado al eliminar evidencia.' },
      { status: 500 }
    );
  }
}
