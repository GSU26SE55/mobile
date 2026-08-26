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
  // Content-Type MUST be hardcoded to 'multipart/form-data' (no boundary) — leaving it 'undefined'
  // (relying on axios to infer it) makes the request never actually get sent on Android (the RN XHR
  // bridge fires 'onerror' immediately, axios reports "Network Error", 0 traffic reaches the server).
  // The RN native module generates the correct boundary itself when it sees Content-Type starting
  // with 'multipart/form-data' + a FormData body. Well-known bug: axios/axios#4800, #2875, #1567,
  // #3540 — only happens on Android, iOS is unaffected.
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

  // Binary stream — NOT wrapped in CommonResponse. RN: arraybuffer (Blob support is limited).
  // Note: for rendering images, prefer <Image> + useAuthImageHeaders; this method is for downloading non-image files.
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
