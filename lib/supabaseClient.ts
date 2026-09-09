import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_STORAGE_ANON_KEY;

export let isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

// Async init for environments where variables were delivered via server runtime
export async function ensureSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabase) return supabase;

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.configured && data.url && data.anonKey) {
        supabase = createClient(data.url, data.anonKey);
        isSupabaseConfigured = true;
        return supabase;
      }
    } catch {
      // ignore
    }
  }
  return null;
}
