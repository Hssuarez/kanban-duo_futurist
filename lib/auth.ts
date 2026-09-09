import { User, SecurityLog } from './types';

const SALT = '_kanban_duo_salt_2026';

// SHA-256 password hash using standard Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + SALT);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for non-subtle contexts
  let hash = 0;
  const str = password + SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const calculated = await hashPassword(password);
  return calculated === hash;
}

// Preset photo options for easy selection
export const PRESET_AVATARS = [
  {
    name: 'Profesional 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Profesional 2',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Profesional 3',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Profesional 4',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ilustrado Tech',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TechMaster',
  },
  {
    name: 'Avatar Creativo',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CreativeAlex',
  },
  {
    name: 'Avatar Minimalista',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=BeatrizDev',
  },
];
