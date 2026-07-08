import { useEffect, useState } from 'react';
import { File, Paths } from 'expo-file-system';
import { fileStorageService } from '../../file-storage/services/file-storage.service';

/**
 * Tải file audio về cache local (qua axios — interceptor tự gắn Bearer) rồi trả URI local.
 * Phát từ file local giúp expo-audio đọc được TỔNG THỜI LƯỢNG ngay (remote stream + headers
 * thường giữ duration=0 → "--:--"). Cache theo fileId để không tải lại mỗi lần mount.
 */
const cache = new Map<string, string>();

export function useLocalAudioUri(fileId: string, ext = 'm4a'): string | null {
  const [uri, setUri] = useState<string | null>(() => cache.get(fileId) ?? null);

  useEffect(() => {
    const cached = cache.get(fileId);
    if (cached) {
      setUri(cached);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fileStorageService.downloadFile(fileId);
        if (!active) return;
        const bytes = new Uint8Array(res.data as ArrayBuffer);
        const file = new File(Paths.cache, `voice-${fileId}.${ext}`);
        if (!file.exists) file.create();
        file.write(bytes);
        cache.set(fileId, file.uri);
        if (active) setUri(file.uri);
      } catch {
        // Tải lỗi — giữ null, player sẽ không phát được (hiếm khi xảy ra).
      }
    })();
    return () => {
      active = false;
    };
  }, [fileId, ext]);

  return uri;
}
