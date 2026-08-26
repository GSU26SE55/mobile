import { useEffect, useState } from 'react';
import { getAccessToken } from '@/src/lib/secureStore';

/**
 * Load the access token once to build the Authorization header for <Image> loading images
 * from FileStorageService (GET /api/files/{id}/download — endpoint requires auth).
 *
 * Used when `publicUrl === null`: <Image source={{ uri: BASE_URL + DOWNLOAD(fileId), headers }} />.
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
