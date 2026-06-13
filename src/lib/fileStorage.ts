import { axiosInstance } from './axios';
import { ENDPOINTS } from './endpoints';
import { CommonResponse } from '../types/api.types';

export interface FileUploadResponse {
  fileId: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  size: number;
  publicUrl: string | null;
}

export const fileStorageLib = {
  uploadAvatar: (uri: string, name: string, type: string) => {
    const form = new FormData();
    form.append('file', { uri, name, type } as unknown as Blob);
    form.append('purpose', '1'); // FilePurposeEnum.Avatar
    return axiosInstance.post<CommonResponse<FileUploadResponse>>(
      ENDPOINTS.FILES.UPLOAD,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  uploadAttachment: (uri: string, name: string, type: string) => {
    const form = new FormData();
    form.append('file', { uri, name, type } as unknown as Blob);
    form.append('purpose', '2'); // FilePurposeEnum.CommentAttachment
    return axiosInstance.post<CommonResponse<FileUploadResponse>>(
      ENDPOINTS.FILES.UPLOAD,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  uploadTicketAttachment: (uri: string, name: string, type: string) => {
    const form = new FormData();
    form.append('file', { uri, name, type } as unknown as Blob);
    form.append('purpose', '2'); // FilePurposeEnum.TicketAttachment
    return axiosInstance.post<CommonResponse<FileUploadResponse>>(
      ENDPOINTS.FILES.UPLOAD,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
