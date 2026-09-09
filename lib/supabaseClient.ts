import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let isConfigured = false;

// Direct check from build-time env vars
const buildUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_URL;

const buildKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_STORAGE_ANON_KEY;

if (buildUrl && buildKey) {
  cachedClient = createClient(buildUrl, buildKey);
  isConfigured = true;
}

export function getCachedSupabase(): SupabaseClient | null {
  return cachedClient;
}

export function getIsConfigured(): boolean {
  return isConfigured;
}

// Async getter that queries /api/config if not defined at build time
export async function getOrInitSupabase(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.configured && data.url && data.anonKey) {
        cachedClient = createClient(data.url, data.anonKey);
        isConfigured = true;
        return cachedClient;
      }
    } catch (e) {
      console.warn('Could not auto-init Supabase from /api/config:', e);
    }
  }

  return null;
}
