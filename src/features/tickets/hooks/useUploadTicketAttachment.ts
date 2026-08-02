import { useMutation } from '@tanstack/react-query';
import { fileStorageService } from '../../file-storage/services/file-storage.service';
import { FilePurposeEnum } from '../../file-storage/enums/file-storage.enum';
import { ENDPOINTS } from '../../../lib/endpoints';
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
        // BE ticket create bắt buộc `url`. publicUrl null khi PublicBaseUrl chưa
        // cấu hình → fallback endpoint download (BE chỉ validate non-empty).
        url:         data.publicUrl ?? ENDPOINTS.FILES.DOWNLOAD(data.fileId),
      };
    },
  });
}
