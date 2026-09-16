'use client';

export interface DeviceAuditInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  os: string;
  browser: string;
}

export interface ClientConnectionAudit {
  ip: string;
  city?: string;
  country?: string;
  region?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  os: string;
  browser: string;
}

/**
 * Detects device hardware, OS, and browser from the client environment
 */
export function getDeviceInfo(): DeviceAuditInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'desktop',
      deviceName: 'Equipo',
      os: 'Desconocido',
      browser: 'Web',
    };
  }

  const ua = navigator.userAgent || '';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let os = 'Desconocido';
  let browser = 'Navegador Web';
  let deviceName = 'PC';

  // 1. Detect Device Type
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) && !isTablet;

  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';
  else deviceType = 'desktop';

  // 2. Detect Operating System
  if (/windows/i.test(ua)) {
    if (/windows nt 10\.0/i.test(ua)) os = 'Windows 11/10';
    else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
    else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
    else os = 'Windows';
  } else if (/android/i.test(ua)) {
    const match = ua.match(/android\s+([\d.]+)/i);
    os = match ? `Android ${match[1].split('.')[0]}` : 'Android';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/os\s+([\d_]+)/i);
    os = match ? `iOS ${match[1].replace(/_/g, '.').split('.')[0]}` : 'iOS';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Detect Browser
  if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome\//i.test(ua) && !/edg\//i.test(ua) && !/opr\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
  }

  // 4. Detect Device Brand / Specific Name
  if (/iphone/i.test(ua)) {
    deviceName = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    deviceName = 'iPad';
  } else if (/samsung|sm-[a-z0-9]+/i.test(ua)) {
    deviceName = 'Samsung Galaxy';
  } else if (/pixel/i.test(ua)) {
    deviceName = 'Google Pixel';
  } else if (/xiaomi|redmi|poco/i.test(ua)) {
    deviceName = 'Xiaomi / Redmi';
  } else if (/motorola|moto/i.test(ua)) {
    deviceName = 'Motorola';
  } else if (/huawei/i.test(ua)) {
    deviceName = 'Huawei';
  } else if (deviceType === 'mobile') {
    deviceName = 'Dispositivo Móvil';
  } else if (deviceType === 'tablet') {
    deviceName = 'Tablet';
  } else if (os.includes('Windows')) {
    deviceName = 'PC Windows';
  } else if (os.includes('macOS')) {
    deviceName = 'Apple Mac';
  } else {
    deviceName = 'Computador';
  }

  return {
    deviceType,
    deviceName,
    os,
    browser,
  };
}

/**
 * Fetches the public client IP and geolocation from our server endpoint
 * and pairs it with the detected client device information
 */
export async function getClientConnectionInfo(): Promise<ClientConnectionAudit> {
  const deviceInfo = getDeviceInfo();
  let ip = '127.0.0.1';
  let city = '';
  let country = '';
  let region = '';

  try {
    const res = await fetch('/api/client-info', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ip) ip = data.ip;
      if (data.city) city = data.city;
      if (data.country) country = data.country;
      if (data.region) region = data.region;
    }
  } catch {
    // If running in offline or sandbox mode, fall back to localhost
    ip = '127.0.0.1';
  }

  return {
    ip,
    city,
    country,
    region,
    ...deviceInfo,
  };
}
