import { useQuery } from '@tanstack/react-query';
import { fileStorageService } from '@/src/features/file-storage/services/file-storage.service';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { BASE_URL } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chỉ nhận fileId là GUID hợp lệ — loại URL rác/legacy gây 404 khi ghép /api/files/{id}. */
export function isFileId(s: string | undefined | null): s is string {
  return !!s && GUID_RE.test(s.trim());
}

interface AudioAttachmentResult {
  /** true khi metadata contentType bắt đầu bằng "audio/". undefined khi chưa load. */
  isAudio?: boolean;
  /** URL tải file (đã kèm BASE_URL) — nguồn phát cho VoiceMessageBubble. */
  downloadUrl: string;
  isLoading: boolean;
}

/**
 * Phát hiện 1 attachment có phải audio không, qua metadata (contentType). List endpoint chỉ
 * trả fileId (không kèm contentType) nên phải hỏi /api/files/{id}/metadata. Kết quả cache lâu
 * (contentType bất biến) — mỗi voice bubble chỉ gọi 1 lần, share cache toàn app.
 *
 * `enabled=false` (fileId không phải GUID) → không gọi, coi như không phải audio.
 */
export function useAudioAttachment(fileId: string | undefined): AudioAttachmentResult {
  const valid = isFileId(fileId);
  const id = valid ? fileId!.trim() : '';

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY.files.metadata(id),
    queryFn: async () => {
      const res = await fileStorageService.getFileMetadata(id);
      return res.data.data ?? null;
    },
    enabled: valid,
    staleTime: 60 * 60 * 1000, // 1h — contentType không đổi
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    isAudio: data ? data.contentType?.toLowerCase().startsWith('audio/') : undefined,
    downloadUrl: `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(id)}`,
    isLoading: valid && isLoading,
  };
}
