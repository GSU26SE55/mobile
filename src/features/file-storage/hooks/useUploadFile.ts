import { useMutation } from '@tanstack/react-query';
import { fileStorageService } from '../services/file-storage.service';
import { validateFile } from '../utils/fileValidation';
import { FilePurposeEnum } from '../enums/file-storage.enum';
import type { FileUploadResponse, UploadFilePayload } from '../types/file-storage.types';

/**
 * Upload a single file to FileStorageService.
 * Validates size (≤20MB if bytes are known) + extension whitelist per purpose on the client before calling the API.
 * Returns FileUploadResponse; throws Error if validation fails or the BE returns isSuccess=false.
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: async (payload: UploadFilePayload): Promise<FileUploadResponse> => {
      const purpose = payload.purpose ?? FilePurposeEnum.Other;
      const check = validateFile(payload.name, payload.size, purpose);
      if (!check.valid) {
        throw new Error(check.message ?? 'Invalid file');
      }

      const res = await fileStorageService.uploadFile(payload);
      const data = res.data.data;
      if (!res.data.isSuccess || !data) {
        throw new Error(res.data.message ?? 'Upload failed');
      }
      return data;
    },
  });
}
