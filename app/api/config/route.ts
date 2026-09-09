import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    '';

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.STORAGE_ANON_KEY ||
    process.env.NEXT_PUBLIC_STORAGE_ANON_KEY ||
    '';

  return NextResponse.json({
    configured: Boolean(url && anonKey),
    url,
    anonKey,
  });
}
