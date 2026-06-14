import { useEffect, useState } from 'react';
import { getAccessToken } from '../../../lib/secureStore';

/**
 * Load access token once để dựng header Authorization cho <Image> tải ảnh
 * từ FileStorageService (GET /api/files/{id}/download — endpoint cần auth).
 *
 * Dùng khi `publicUrl === null`: <Image source={{ uri: BASE_URL + DOWNLOAD(fileId), headers }} />.
 */
export function useAuthImageHeaders() {
  const [headers, setHeaders] = useState<{ Authorization: string } | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getAccessToken().then((token) => {
      if (active && token) setHeaders({ Authorization: `Bearer ${token}` });
    });
    return () => {
      active = false;
    };
  }, []);

  return headers;
}
