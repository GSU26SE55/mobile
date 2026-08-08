import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { fileStorageService } from '../services/file-storage.service';

/**
 * Delete a file by fileId. FileStorage only deletes the object + metadata — the domain service that
 * owns the resource must clear the reference (e.g. AvatarFileId) BEFORE calling this hook.
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
