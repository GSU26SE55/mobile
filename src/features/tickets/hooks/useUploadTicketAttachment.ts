import { useMutation } from '@tanstack/react-query';
import { fileStorageService } from '@/src/features/file-storage/services/file-storage.service';
import { FilePurposeEnum } from '@/src/features/file-storage/enums/file-storage.enum';
import { resolveFileUrl } from '@/src/features/file-storage/utils/fileUrl';
import type { UploadedTicketAttachment } from '../types/ticket.types';

export function useUploadTicketAttachment() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }): Promise<UploadedTicketAttachment> => {
      const res = await fileStorageService.uploadFile({
        uri: file.uri,
        name: file.name,
        type: file.type,
        purpose: FilePurposeEnum.TicketAttachment,
      });
      const data = res.data.data;
      if (!res.data.isSuccess || !data) {
        throw new Error(res.data.message ?? 'Upload failed');
      }

      return {
        uri:         file.uri,
        fileId:      data.fileId,
        fileName:    data.fileName,
        contentType: data.contentType,
        sizeBytes:   data.size,
        // BE ticket create requires `url`. publicUrl is null when PublicBaseUrl isn't
        // configured → resolveFileUrl falls back to the download endpoint, and already
        // prepends the origin so it returns an absolute URL (BE only validates non-empty).
        url:         resolveFileUrl(data.publicUrl, data.fileId),
      };
    },
  });
}
