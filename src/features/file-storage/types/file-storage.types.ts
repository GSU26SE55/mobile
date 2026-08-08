import type { FilePurposeEnum, FileStatusEnum } from '../enums/file-storage.enum';
export { FilePurposeEnum, FileStatusEnum } from '../enums/file-storage.enum';

export interface FileUploadResponse {
  fileId: string;          // UUID — store in the domain service for reference
  objectKey: string;       // key in object storage — used for the legacy endpoint
  fileName: string;        // original filename sent by the client
  contentType: string;     // MIME type (e.g. "image/png")
  size: number;            // bytes
  publicUrl: string | null; // set when PublicBaseUrl is configured — fallback to GET /{id}/download when null
}

export interface FileMetadataResponse {
  fileId: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  size: number;
  folderName: string;
  purpose: FilePurposeEnum;
  status: FileStatusEnum;
  publicUrl: string | null;
  createdAt: string;       // ISO 8601 UTC
  updatedAt: string | null;
}

// RN: use { uri, name, type } instead of the browser's File when appending to FormData.
export interface UploadFilePayload {
  uri: string;
  name: string;
  type: string;
  size?: number;           // bytes — if present, validate ≤20MB before upload (ImagePicker asset.fileSize)
  folderName?: string;
  purpose?: FilePurposeEnum;
}

export interface PresignedUrlOptions {
  expiresInMinutes?: number; // 1–1440, BE default 15
}
