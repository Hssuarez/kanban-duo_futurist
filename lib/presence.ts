import { User } from './types';
import { getOrInitSupabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

let presenceChannel: RealtimeChannel | null = null;
let currentTrackedUser: User | null = null;
let onlineUserIds: Set<string> = new Set();
const listeners = new Set<(onlineIds: string[]) => void>();

// Local BroadcastChannel so tabs on the same browser also sync presence in real time
let localPresenceChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  localPresenceChannel = new BroadcastChannel('kanban_presence_local_v1');
  localPresenceChannel.addEventListener('message', (event) => {
    if (event.data?.type === 'presence_sync' && Array.isArray(event.data.onlineIds)) {
      event.data.onlineIds.forEach((id: string) => onlineUserIds.add(id));
      notifyListeners();
    }
  });
}

function notifyListeners() {
  const ids = Array.from(onlineUserIds);
  listeners.forEach((cb) => {
    try {
      cb(ids);
    } catch (e) {
      console.warn('Error en listener de presencia:', e);
    }
  });
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUserIds);
}

export function isUserOnline(userId: string): boolean {
  return onlineUserIds.has(userId);
}

export function subscribeToPresence(callback: (onlineIds: string[]) => void): () => void {
  listeners.add(callback);
  // Emit immediately with current state
  callback(Array.from(onlineUserIds));
  return () => {
    listeners.delete(callback);
  };
}

export async function initPresence(user: User | null) {
  if (typeof window === 'undefined') return;

  if (!user) {
    if (presenceChannel && currentTrackedUser) {
      try {
        await presenceChannel.untrack();
      } catch {}
    }
    currentTrackedUser = null;
    return;
  }

  currentTrackedUser = user;
  onlineUserIds.add(user.id);
  notifyListeners();

  if (localPresenceChannel) {
    try {
      localPresenceChannel.postMessage({
        type: 'presence_sync',
        onlineIds: Array.from(onlineUserIds),
      });
    } catch {}
  }

  const client = await getOrInitSupabase();
  if (!client) {
    return;
  }

  // If already have channel, update tracking
  if (presenceChannel) {
    try {
      await presenceChannel.track({
        userId: user.id,
        userName: user.name,
        onlineAt: new Date().toISOString(),
      });
      return;
    } catch (e) {
      console.warn('Error actualizando track en canal existente:', e);
    }
  }

  try {
    presenceChannel = client.channel('kanban-presence-room', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel?.presenceState() || {};
        const newOnlineIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          newOnlineIds.add(key);
        });
        if (currentTrackedUser) {
          newOnlineIds.add(currentTrackedUser.id);
        }
        onlineUserIds = newOnlineIds;
        notifyListeners();
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        onlineUserIds.add(key);
        notifyListeners();
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (currentTrackedUser && key !== currentTrackedUser.id) {
          onlineUserIds.delete(key);
          notifyListeners();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel?.track({
            userId: user.id,
            userName: user.name,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    // Cleanup when closing tab
    window.addEventListener('beforeunload', () => {
      try {
        presenceChannel?.untrack();
      } catch {}
    });
  } catch (err) {
    console.warn('Error inicializando canal Supabase Presence:', err);
  }
}
