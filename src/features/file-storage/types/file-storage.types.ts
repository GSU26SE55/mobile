import type { FilePurposeEnum, FileStatusEnum } from '../enums/file-storage.enum';
export { FilePurposeEnum, FileStatusEnum } from '../enums/file-storage.enum';

export interface FileUploadResponse {
  fileId: string;          // UUID — lưu vào domain service để tham chiếu
  objectKey: string;       // khóa trong object storage — dùng cho endpoint legacy
  fileName: string;        // tên file gốc client gửi lên
  contentType: string;     // MIME type (e.g. "image/png")
  size: number;            // bytes
  publicUrl: string | null; // có giá trị nếu PublicBaseUrl được cấu hình — fallback GET /{id}/download khi null
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

// RN: dùng { uri, name, type } thay cho File của browser khi append vào FormData.
export interface UploadFilePayload {
  uri: string;
  name: string;
  type: string;
  size?: number;           // bytes — nếu có, validate ≤20MB trước upload (ImagePicker asset.fileSize)
  folderName?: string;
  purpose?: FilePurposeEnum;
}

export interface PresignedUrlOptions {
  expiresInMinutes?: number; // 1–1440, mặc định BE 15
}
