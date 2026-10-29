/**
 * Browser / Desktop Native Notification Service
 * Integrates HTML5 Notification API for alerts when the app is in background or minimized.
 */

export type BrowserNotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function isBrowserNotificationSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined';
  } catch {
    return false;
  }
}

export function getBrowserNotificationPermission(): BrowserNotificationStatus {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission || 'default';
  } catch {
    return 'unsupported';
  }
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationStatus> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    if (typeof Notification.requestPermission !== 'function') return 'unsupported';
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    try {
      return Notification.permission || 'denied';
    } catch {
      return 'denied';
    }
  }
}

export function showBrowserNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  if (!isBrowserNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body: options?.body || '',
      icon: '/favicon.ico',
      tag: options?.tag || `kanban-${Date.now()}`,
    });

    notif.onclick = () => {
      window.focus();
      if (options?.onClick) {
        options.onClick();
      }
      notif.close();
    };

    // Auto close after 6 seconds
    setTimeout(() => {
      try {
        notif.close();
      } catch {
        // Ignore
      }
    }, 6000);
  } catch (err) {
    console.error('Failed to trigger browser notification:', err);
  }
}
