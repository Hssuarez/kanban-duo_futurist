import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (serverClient) return serverClient;

  let url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    '';

  if (!url) {
    for (const k of Object.keys(process.env)) {
      const val = process.env[k];
      if (typeof val === 'string' && val.includes('.supabase.co')) {
        url = val;
        break;
      }
    }
  }

  let key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.STORAGE_ANON_KEY ||
    process.env.NEXT_PUBLIC_STORAGE_ANON_KEY ||
    '';

  if (!key) {
    for (const k of Object.keys(process.env)) {
      const val = process.env[k];
      if (
        typeof val === 'string' &&
        val.startsWith('eyJ') &&
        (k.includes('KEY') || k.includes('ANON') || k.includes('SUPABASE') || k.includes('STORAGE'))
      ) {
        key = val;
        break;
      }
    }
  }

  if (url && key) {
    serverClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return serverClient;
  }

  return null;
}
