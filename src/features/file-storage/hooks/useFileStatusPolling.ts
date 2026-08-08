import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { fileStorageService } from '../services/file-storage.service';
import { FileStatusEnum } from '../enums/file-storage.enum';

const POLL_INTERVAL_MS = 3000; // docs recommend 2–5s

/**
 * Poll the file's metadata every ~3s until `status=Ready`.
 * Automatically stops when it reaches `Ready`, `Quarantined`, or `Deleted` (terminal states).
 * Matches the docs: download/presigned-url can only be served once it's no longer `Processing`.
 *
 * Also returns convenience flags: isReady / isFailed (Quarantined|Deleted).
 */
export function useFileStatusPolling(fileId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: QUERY_KEY.files.metadata(fileId ?? ''),
    queryFn: () => fileStorageService.getFileMetadata(fileId!).then((r) => r.data.data),
    enabled: !!fileId && enabled,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      // stop polling at terminal states (Ready / Quarantined / Deleted)
      if (
        status === FileStatusEnum.Ready ||
        status === FileStatusEnum.Quarantined ||
        status === FileStatusEnum.Deleted
      ) {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
  });

  const status = query.data?.status;
  return {
    ...query,
    isReady: status === FileStatusEnum.Ready,
    isFailed: status === FileStatusEnum.Quarantined || status === FileStatusEnum.Deleted,
  };
}
