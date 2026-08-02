import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { fileStorageService } from '../services/file-storage.service';
import { FileStatusEnum } from '../enums/file-storage.enum';

const POLL_INTERVAL_MS = 3000; // doc khuyến nghị 2–5s

/**
 * Poll metadata của file mỗi ~3s cho đến khi `status=Ready`.
 * Tự dừng khi đạt `Ready`, `Quarantined`, hoặc `Deleted` (terminal states).
 * Khớp doc: download/presigned-url chỉ phục vụ được khi không còn `Processing`.
 *
 * Trả về thêm cờ tiện ích: isReady / isFailed (Quarantined|Deleted).
 */
export function useFileStatusPolling(fileId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: QUERY_KEY.files.metadata(fileId ?? ''),
    queryFn: () => fileStorageService.getFileMetadata(fileId!).then((r) => r.data.data),
    enabled: !!fileId && enabled,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      // dừng polling ở terminal states (Ready / Quarantined / Deleted)
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
