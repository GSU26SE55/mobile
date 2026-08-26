import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { fileStorageService } from '../services/file-storage.service';

export function useFileMetadata(fileId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.files.metadata(fileId ?? ''),
    queryFn: () => fileStorageService.getFileMetadata(fileId!).then((r) => r.data.data),
    enabled: !!fileId,
  });
}
