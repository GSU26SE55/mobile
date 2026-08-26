import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { fileStorageService } from '../services/file-storage.service';
import type { PresignedUrlOptions } from '../types/file-storage.types';

export function usePresignedUrl(
  fileId: string | undefined,
  options?: PresignedUrlOptions,
) {
  return useQuery({
    queryKey: QUERY_KEY.files.presignedUrl(fileId ?? ''),
    queryFn: () => fileStorageService.getPresignedUrl(fileId!, options).then((r) => r.data.data),
    enabled: !!fileId,
  });
}
