import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const allEnvKeys = Object.keys(process.env);
  const relevantKeys = allEnvKeys.filter(
    (k) =>
      k.includes('SUPABASE') ||
      k.includes('STORAGE') ||
      k.includes('POSTGRES') ||
      k.includes('NEXT_PUBLIC')
  );

  // 1. Try finding Supabase URL
  let url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    '';

  // If not found directly, search all envs for a supabase.co URL
  if (!url) {
    for (const k of allEnvKeys) {
      const val = process.env[k];
      if (typeof val === 'string' && val.includes('.supabase.co')) {
        url = val;
        break;
      }
    }
  }

  // 2. Try finding Supabase Anon Key
  let anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.STORAGE_ANON_KEY ||
    process.env.NEXT_PUBLIC_STORAGE_ANON_KEY ||
    '';

  // If not found, look for JWT key in envs
  if (!anonKey) {
    for (const k of allEnvKeys) {
      const val = process.env[k];
      if (
        typeof val === 'string' &&
        val.startsWith('eyJ') &&
        (k.includes('KEY') || k.includes('ANON') || k.includes('SUPABASE') || k.includes('STORAGE'))
      ) {
        anonKey = val;
        break;
      }
    }
  }

  return NextResponse.json({
    configured: Boolean(url && anonKey),
    detectedKeys: relevantKeys,
    url: url || '',
    anonKey: anonKey || '',
  });
}
