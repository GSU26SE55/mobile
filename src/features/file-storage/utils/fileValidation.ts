import { FilePurposeEnum } from '../enums/file-storage.enum';

// BE limits every purpose to 20 MB (api-filestorage.md). If it slips past the client, BE returns 413.
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Extension whitelist per FilePurposeEnum — kept in sync with BE (api-filestorage.md).
export const EXTENSION_WHITELIST: Record<FilePurposeEnum, readonly string[]> = {
  [FilePurposeEnum.Other]: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
  [FilePurposeEnum.Avatar]: ['jpg', 'jpeg', 'png', 'webp'],
  // Audio nằm trong whitelist của BE (FileUploadPolicy) vì tin nhắn thoại upload dưới dạng
  // .m4a. Thiếu ở đây thì đường gửi nào đi qua validateFile sẽ chặn nhầm file hợp lệ —
  // hiện voice chỉ chạy được nhờ nó gọi thẳng uploadFile, bỏ qua hàm này.
  [FilePurposeEnum.TicketAttachment]: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp3', 'wav', 'ogg', 'webm', 'm4a', 'flac'],
  [FilePurposeEnum.MaintenancePhoto]: ['jpg', 'jpeg', 'png'],
  [FilePurposeEnum.KbImage]: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  [FilePurposeEnum.Firmware]: ['bin', 'hex', 'fw'],
};

const getExtension = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
};

export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validate the file client-side before upload — fail fast, no wasted round-trip.
 * - size > 20 MB → error (BE returns 413). Skip the size check if `size` is undefined (bytes unknown).
 * - extension not in the purpose's whitelist → error (BE returns 400)
 */
export function validateFile(
  name: string,
  size: number | undefined,
  purpose: FilePurposeEnum = FilePurposeEnum.Other,
): FileValidationResult {
  if (size !== undefined && size > MAX_FILE_SIZE) {
    return { valid: false, message: 'Maximum file size is 20 MB.' };
  }

  const ext = getExtension(name);
  const allowed = EXTENSION_WHITELIST[purpose];
  if (!ext || !allowed.includes(ext)) {
    return {
      valid: false,
      message: `Invalid format. Allowed: ${allowed.map((e) => `.${e}`).join(', ')}`,
    };
  }

  return { valid: true };
}
