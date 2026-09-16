import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. IP extraction (Vercel, Cloudflare, proxies, or direct connection)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfIp = req.headers.get('cf-connecting-ip');

    let ip = '';
    if (forwardedFor) {
      // First IP in the list is the original client IP
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp.trim();
    } else if (cfIp) {
      ip = cfIp.trim();
    } else {
      ip = '127.0.0.1';
    }

    // 2. Geolocation headers (provided automatically by Vercel Edge Network)
    let city = req.headers.get('x-vercel-ip-city') || '';
    if (city) {
      try {
        city = decodeURIComponent(city);
      } catch {}
    }

    const country = req.headers.get('x-vercel-ip-country') || '';
    const region = req.headers.get('x-vercel-ip-country-region') || '';

    return NextResponse.json(
      {
        ip,
        city,
        country,
        region,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ip: '127.0.0.1',
        city: '',
        country: '',
        region: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
