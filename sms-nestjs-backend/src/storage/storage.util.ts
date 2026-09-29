import { extname } from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

export type StorageProvider = 'local' | 'r2';

export function getStorageProvider(): StorageProvider {
  return process.env.STORAGE_PROVIDER?.toLowerCase() === 'r2' ? 'r2' : 'local';
}

export function normalizeStorageToken(value: string | null | undefined): string {
  const normalized = (value || 'uncategorized')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'uncategorized';
}

export function isAllowedStorageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function buildStoredFileName(originalName: string, id: string): string {
  const extension = extname(originalName).toLowerCase();
  const baseName =
    originalName
      .slice(0, extension ? -extension.length : undefined)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'upload';

  return `${id}-${baseName}${extension}`;
}

export function toPublicStorageUrl(apiOrigin: string, relativePath: string): string {
  const origin = apiOrigin.replace(/\/+$/, '');
  return `${origin}/storage/${relativePath.replace(/^\/+/, '')}`;
}

export function toStoredFileContentUrl(apiOrigin: string, fileId: string): string {
  const origin = apiOrigin.replace(/\/+$/, '');
  return `${origin}/storage/files/${fileId}/content`;
}
