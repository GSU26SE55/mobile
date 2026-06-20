import { FilePurposeEnum } from '../enums/file-storage.enum';

// BE giới hạn 20 MB cho mọi purpose (api-filestorage.md). Lọt qua client → BE trả 413.
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Extension whitelist theo FilePurposeEnum — đồng bộ với BE (api-filestorage.md).
export const EXTENSION_WHITELIST: Record<FilePurposeEnum, readonly string[]> = {
  [FilePurposeEnum.Other]: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
  [FilePurposeEnum.Avatar]: ['jpg', 'jpeg', 'png', 'webp'],
  [FilePurposeEnum.TicketAttachment]: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
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
 * Validate file phía client trước khi upload — fail nhanh, không tốn round-trip.
 * - size > 20 MB → lỗi (BE trả 413). Bỏ qua check size nếu `size` undefined (không biết bytes).
 * - extension không thuộc whitelist của purpose → lỗi (BE trả 400)
 */
export function validateFile(
  name: string,
  size: number | undefined,
  purpose: FilePurposeEnum = FilePurposeEnum.Other,
): FileValidationResult {
  if (size !== undefined && size > MAX_FILE_SIZE) {
    return { valid: false, message: 'Kích thước file tối đa là 20 MB.' };
  }

  const ext = getExtension(name);
  const allowed = EXTENSION_WHITELIST[purpose];
  if (!ext || !allowed.includes(ext)) {
    return {
      valid: false,
      message: `Định dạng không hợp lệ. Cho phép: ${allowed.map((e) => `.${e}`).join(', ')}`,
    };
  }

  return { valid: true };
}
