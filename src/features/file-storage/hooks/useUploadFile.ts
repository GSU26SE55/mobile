import { useMutation } from '@tanstack/react-query';
import { fileStorageService } from '../services/file-storage.service';
import { validateFile } from '../utils/fileValidation';
import { FilePurposeEnum } from '../enums/file-storage.enum';
import type { FileUploadResponse, UploadFilePayload } from '../types/file-storage.types';

/**
 * Upload 1 file lên FileStorageService.
 * Validate size (≤20MB nếu biết bytes) + extension whitelist theo purpose ở client trước khi gọi API.
 * Trả về FileUploadResponse; throw Error nếu validate fail hoặc BE trả isSuccess=false.
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: async (payload: UploadFilePayload): Promise<FileUploadResponse> => {
      const purpose = payload.purpose ?? FilePurposeEnum.Other;
      const check = validateFile(payload.name, payload.size, purpose);
      if (!check.valid) {
        throw new Error(check.message ?? 'File không hợp lệ');
      }

      const res = await fileStorageService.uploadFile(payload);
      const data = res.data.data;
      if (!res.data.isSuccess || !data) {
        throw new Error(res.data.message ?? 'Upload thất bại');
      }
      return data;
    },
  });
}
