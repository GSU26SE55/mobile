import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import type {
  FileUploadResponse,
  FileMetadataResponse,
  UploadFilePayload,
  PresignedUrlOptions,
} from '../types/file-storage.types';

export const fileStorageService = {
  // RN: append { uri, name, type } as Blob; để axios tự set multipart boundary → Content-Type undefined.
  uploadFile: (payload: UploadFilePayload) => {
    const form = new FormData();
    form.append('file', {
      uri: payload.uri,
      name: payload.name,
      type: payload.type,
    } as unknown as Blob);
    if (payload.folderName) form.append('folderName', payload.folderName);
    if (payload.purpose !== undefined) form.append('purpose', String(payload.purpose));
    return axiosInstance.post<CommonResponse<FileUploadResponse>>(
      ENDPOINTS.FILES.UPLOAD,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  getFileMetadata: (id: string) =>
    axiosInstance.get<CommonResponse<FileMetadataResponse>>(ENDPOINTS.FILES.METADATA(id)),

  // Binary stream — KHÔNG bọc CommonResponse. RN: arraybuffer (Blob hỗ trợ hạn chế).
  // Note: render ảnh ưu tiên <Image> + useAuthImageHeaders; method này cho download file phi-ảnh.
  downloadFile: (id: string) =>
    axiosInstance.get<ArrayBuffer>(ENDPOINTS.FILES.DOWNLOAD(id), {
      responseType: 'arraybuffer',
    }),

  getPresignedUrl: (id: string, options?: PresignedUrlOptions) =>
    axiosInstance.get<CommonResponse<string>>(ENDPOINTS.FILES.PRESIGNED_URL(id), {
      params:
        options?.expiresInMinutes !== undefined
          ? { expiresInMinutes: options.expiresInMinutes }
          : undefined,
    }),

  deleteFile: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(ENDPOINTS.FILES.DELETE(id)),
};
