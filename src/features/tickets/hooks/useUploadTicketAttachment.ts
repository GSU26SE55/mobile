import { useMutation } from '@tanstack/react-query';
import { fileStorageLib } from '../../../lib/fileStorage';
import type { UploadedTicketAttachment } from '../types/ticket.types';

export function useUploadTicketAttachment() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }): Promise<UploadedTicketAttachment> => {
      const res = await fileStorageLib.uploadTicketAttachment(file.uri, file.name, file.type);
      const data = res.data.data;
      if (!data) {
        throw new Error(res.data.message ?? 'Upload failed');
      }

      return {
        uri:         file.uri,
        fileId:      data.fileId,
        fileName:    data.fileName,
        contentType: data.contentType,
        sizeBytes:   data.size,
      };
    },
  });
}
