import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

// In-memory cache for folder IDs to optimize Google Drive API calls
// key: `parentFolderId:sanitizedName` -> value: `folderId`
const folderCache = new Map<string, string>();

/**
 * Checks whether Google Drive credentials are fully configured in the environment.
 */
export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID
  );
}

/**
 * Sanitizes names to be safe for Google Drive folder and file names,
 * removing special characters and normalizing accents.
 */
export function sanitizeName(name: string): string {
  if (!name) return 'Sin_Nombre';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[/\\:*?"<>|#%&{}\\<>*?/$!'":@+`|=]/g, '_') // remove invalid path characters
    .replace(/\s+/g, '_') // replace spaces with underscores
    .replace(/_+/g, '_') // collapse consecutive underscores
    .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
    .slice(0, 80); // reasonable length
}

/**
 * Creates an authorized Google Drive client using a Service Account.
 */
export function getGoogleDriveClient(): drive_v3.Drive {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Google Drive Service Account credentials are not configured in environment.');
  }

  // Handle escaped \n in environment variables
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Searches for a subfolder by name within a parent folder. If not found, creates it.
 * Uses an in-memory cache to minimize round-trips to the Google Drive API.
 */
export async function findOrCreateFolder(
  drive: drive_v3.Drive,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  const sanitized = sanitizeName(folderName) || 'Carpeta';
  const cacheKey = `${parentFolderId}:${sanitized}`;

  const cachedId = folderCache.get(cacheKey);
  if (cachedId) {
    return cachedId;
  }

  try {
    // 1. Search existing folder
    // Note: escape single quotes in sanitized name
    const safeQueryName = sanitized.replace(/'/g, "\\'");
    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeQueryName}' and '${parentFolderId}' in parents and trashed = false`;

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
      const existingId = res.data.files[0].id;
      folderCache.set(cacheKey, existingId);
      return existingId;
    }

    // 2. Folder does not exist, create it
    const createRes = await drive.files.create({
      requestBody: {
        name: sanitized,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    if (!createRes.data.id) {
      throw new Error(`Failed to create Google Drive folder: ${sanitized}`);
    }

    const newFolderId = createRes.data.id;
    folderCache.set(cacheKey, newFolderId);
    return newFolderId;
  } catch (err: any) {
    console.error(`Error in findOrCreateFolder for "${sanitized}":`, err);
    throw err;
  }
}

/**
 * Resolves or creates the hierarchical folder structure:
 * Root (GOOGLE_DRIVE_FOLDER_ID) -> [USUARIO] -> [RETO]
 */
export async function ensureUserChallengeFolder(
  drive: drive_v3.Drive,
  userName: string,
  challengeTitle: string
): Promise<{ userFolderId: string; challengeFolderId: string }> {
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing from environment.');
  }

  // 1. Carpeta de Usuario: /KanbanDuo_Evidencias/[USUARIO]/
  const userFolderId = await findOrCreateFolder(drive, userName, rootFolderId);

  // 2. Carpeta de Reto: /KanbanDuo_Evidencias/[USUARIO]/[RETO]/
  const challengeFolderId = await findOrCreateFolder(drive, challengeTitle, userFolderId);

  return { userFolderId, challengeFolderId };
}

/**
 * Uploads an evidence file buffer into the designated Google Drive folder.
 * Files remain PRIVATE (no anyoneWithLink permissions).
 */
export async function uploadEvidenceFile(
  drive: drive_v3.Drive,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  parentFolderId: string
): Promise<{ fileId: string; fileName: string; size: number }> {
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null); // End of stream

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [parentFolderId],
      mimeType,
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, size',
    supportsAllDrives: true,
  });

  if (!response.data.id) {
    throw new Error('Google Drive upload succeeded but did not return a file ID.');
  }

  return {
    fileId: response.data.id,
    fileName: response.data.name || fileName,
    size: Number(response.data.size) || fileBuffer.length,
  };
}

/**
 * Deletes a file from Google Drive.
 */
export async function deleteEvidenceFile(
  drive: drive_v3.Drive,
  fileId: string
): Promise<boolean> {
  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
    return true;
  } catch (err: any) {
    // If already deleted or not found (404), treat as successfully removed
    if (err.code === 404 || err.status === 404) {
      return true;
    }
    console.error(`Error deleting Google Drive file (${fileId}):`, err);
    throw err;
  }
}

/**
 * Streams a private file from Google Drive.
 */
export async function getFileStream(
  drive: drive_v3.Drive,
  fileId: string
): Promise<{ stream: any; mimeType: string; size?: number }> {
  // 1. Fetch file metadata
  const meta = await drive.files.get({
    fileId,
    fields: 'mimeType, size, name',
    supportsAllDrives: true,
  });

  const mimeType = meta.data.mimeType || 'image/jpeg';
  const size = meta.data.size ? Number(meta.data.size) : undefined;

  // 2. Fetch media stream
  const media = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' }
  );

  return {
    stream: media.data,
    mimeType,
    size,
  };
}
