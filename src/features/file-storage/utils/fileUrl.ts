import { BASE_URL } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';

/**
 * URL tuyệt đối của file. BE chỉ trả `publicUrl` khi có cấu hình PublicBaseUrl,
 * ngược lại null — khi đó fallback về endpoint download (api-filestorage.md).
 */
export function resolveFileUrl(publicUrl: string | null | undefined, fileId: string): string {
  if (publicUrl) return publicUrl;
  const origin = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${ENDPOINTS.FILES.DOWNLOAD(fileId)}`;
}
