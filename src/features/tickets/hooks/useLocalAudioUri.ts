import { useEffect, useState } from 'react';
import { File, Paths } from 'expo-file-system';
import { fileStorageService } from '@/src/features/file-storage/services/file-storage.service';

/**
 * Downloads the audio file to local cache (via axios — the interceptor auto-attaches Bearer)
 * then returns the local URI. Playing from a local file lets expo-audio read the TOTAL DURATION
 * immediately (remote stream + headers often keep duration=0 → "--:--"). Cached by fileId so it
 * isn't re-downloaded on every mount.
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
        // Download failed — keep null, the player just won't play (rare case).
      }
    })();
    return () => {
      active = false;
    };
  }, [fileId, ext]);

  return uri;
}
