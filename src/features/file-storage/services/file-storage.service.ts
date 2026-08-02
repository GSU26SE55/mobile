import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import type {
  FileUploadResponse,
  FileMetadataResponse,
  UploadFilePayload,
  PresignedUrlOptions,
} from '../types/file-storage.types';

export const fileStorageService = {
  // RN: append { uri, name, type } as Blob.
  // Content-Type PHẢI set cứng 'multipart/form-data' (không boundary) — để 'undefined' (trông cậy
  // axios tự suy ra) làm request không bao giờ được gửi đi trên Android (RN XHR bridge bắn 'onerror'
  // ngay, axios báo "Network Error", 0 traffic tới server). RN native module tự sinh boundary đúng
  // khi thấy Content-Type bắt đầu bằng 'multipart/form-data' + body là FormData. Bug nổi tiếng:
  // axios/axios#4800, #2875, #1567, #3540 — chỉ xảy ra Android, iOS không bị.
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
