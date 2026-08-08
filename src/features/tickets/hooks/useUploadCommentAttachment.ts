import { useMutation } from '@tanstack/react-query';
import { fileStorageService } from '@/src/features/file-storage/services/file-storage.service';
import { FilePurposeEnum } from '@/src/features/file-storage/enums/file-storage.enum';
import { AttachmentForm } from '../schemas/comment.schema';

export function useUploadCommentAttachment() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }): Promise<AttachmentForm> => {
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
        fileId:      data.fileId,
        fileName:    data.fileName,
        contentType: data.contentType,
        sizeBytes:   data.size,
      };
    },
  });
}
