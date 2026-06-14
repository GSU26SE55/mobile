import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '../../../lib/queryKeys';
import { fileStorageService } from '../services/file-storage.service';

/**
 * Xóa file theo fileId. FileStorage chỉ xóa object + metadata — domain service sở hữu
 * resource phải clear reference (e.g. AvatarFileId) TRƯỚC khi gọi hook này.
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => fileStorageService.deleteFile(fileId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.files });
    },
  });
}
