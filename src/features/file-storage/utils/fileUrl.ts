import { BASE_URL } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';

/**
 * Absolute URL of the file. The BE only returns `publicUrl` when PublicBaseUrl is configured,
 * otherwise null — in that case, fall back to the download endpoint (api-filestorage.md).
 */
export function resolveFileUrl(publicUrl: string | null | undefined, fileId: string): string {
  if (publicUrl) return publicUrl;
  const origin = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${ENDPOINTS.FILES.DOWNLOAD(fileId)}`;
}
