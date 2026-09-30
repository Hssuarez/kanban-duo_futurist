import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import {
  isGoogleDriveConfigured,
  getGoogleDriveClient,
  getFileStream,
} from '@/lib/googleDriveServer';
import { getServerSupabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } | Promise<{ fileId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const fileId = resolvedParams?.fileId;

    if (!fileId) {
      return new Response('File ID missing', { status: 400 });
    }

    // 1. Soporte para archivos almacenados en Supabase Storage
    if (fileId.startsWith('supabase-')) {
      const storagePath = decodeURIComponent(fileId.replace('supabase-', ''));
      const supabase = getServerSupabase();
      if (!supabase) {
        return new Response('Base de datos no disponible en el servidor', { status: 503 });
      }

      const { data, error } = await supabase.storage
        .from('challenge-evidence')
        .download(storagePath);

      if (error || !data) {
        return new Response('Imagen de evidencia no encontrada en Supabase Storage', { status: 404 });
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': data.type || 'image/jpeg',
          'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
          'X-Content-Type-Options': 'nosniff',
          'Content-Length': String(buffer.length),
        },
      });
    }

    // 2. Soporte para modo desarrollo / archivos de prueba
    if (fileId.startsWith('mock-')) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="#090d16">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0e1726" />
            <stop offset="100%" stop-color="#050914" />
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#grad)" rx="12" stroke="#06b6d4" stroke-width="2" stroke-opacity="0.4"/>
        <circle cx="300" cy="160" r="45" fill="#06b6d4" fill-opacity="0.1" stroke="#06b6d4" stroke-width="2"/>
        <path d="M285 155h30v20h-30z M295 145h10v10h-10z" fill="#06b6d4" />
        <circle cx="300" cy="165" r="5" fill="#22d3ee" />
        <text x="50%" y="240" text-anchor="middle" fill="#22d3ee" font-family="monospace" font-size="16" font-weight="bold" letter-spacing="1">EVIDENCIA EN MODO SIMULACION</text>
        <text x="50%" y="270" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="12">Google Drive no configurado en entorno</text>
        <text x="50%" y="295" text-anchor="middle" fill="#06b6d4" font-family="monospace" font-size="11" opacity="0.8">ID: ${fileId}</text>
      </svg>`;

      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 2. Comprobar configuración de Google Drive
    if (!isGoogleDriveConfigured()) {
      return new Response('Google Drive credentials not configured on server', { status: 503 });
    }

    // 3. Obtener stream desde Google Drive
    const drive = getGoogleDriveClient();
    const { stream, mimeType, size } = await getFileStream(drive, fileId);

    const webStream = Readable.toWeb(stream) as ReadableStream;
    const headers: Record<string, string> = {
      'Content-Type': mimeType || 'image/jpeg',
      'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    };

    if (size && !isNaN(size)) {
      headers['Content-Length'] = String(size);
    }

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error?.code === 404 || error?.status === 404) {
      return new Response('Imagen de evidencia no encontrada en Google Drive', { status: 404 });
    }
    console.error('Error en /api/drive/file/[fileId]:', error);
    return new Response('Error al recuperar la imagen desde Google Drive', { status: 500 });
  }
}
