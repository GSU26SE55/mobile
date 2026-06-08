import { useMutation } from '@tanstack/react-query';
import { fileStorageLib } from '../../../lib/fileStorage';
import { AttachmentForm } from '../schemas/comment.schema';

export function useUploadCommentAttachment() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }): Promise<AttachmentForm> => {
      const res = await fileStorageLib.uploadAttachment(file.uri, file.name, file.type);
      const data = res.data.data!;
      return {
        fileId:      data.fileId,
        fileName:    data.fileName,
        contentType: data.contentType,
        sizeBytes:   data.size,
      };
    },
  });
}
