import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, userId, acceptedAt } = body;

    if (!challengeId || !userId) {
      return NextResponse.json(
        { success: false, error: 'challengeId y userId son requeridos.' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Base de datos no disponible en el servidor.' },
        { status: 503 }
      );
    }

    const nowIso = acceptedAt || new Date().toISOString();

    // 1. Intentar actualizar registro existente por (challenge_id, user_id)
    const { data: updated, error: updErr } = await supabase
      .from('challenge_members')
      .update({
        status: 'accepted',
        accepted_at: nowIso,
      })
      .match({ challenge_id: challengeId, user_id: userId })
      .select();

    if (!updErr && updated && updated.length > 0) {
      return NextResponse.json({
        success: true,
        member: updated[0],
      });
    }

    // 2. Si no existía, crear fila como accepted
    const memberId = `cm-${challengeId}-${userId}`;
    const { data: upserted, error: upsErr } = await supabase
      .from('challenge_members')
      .upsert(
        {
          id: memberId,
          challenge_id: challengeId,
          user_id: userId,
          role: 'member',
          status: 'accepted',
          joined_at: nowIso.slice(0, 10),
          accepted_at: nowIso,
        },
        { onConflict: 'challenge_id,user_id' }
      )
      .select()
      .single();

    if (upsErr) {
      return NextResponse.json(
        { success: false, error: upsErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: upserted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
