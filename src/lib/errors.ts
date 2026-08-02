import { Alert } from 'react-native';
import { CommonResponse } from '@/src/types/api.types';

export class HttpError extends Error {
  statusCode: number;
  payload: CommonResponse<unknown>;

  constructor(statusCode: number, payload: CommonResponse<unknown>) {
    super(payload.message ?? 'Lỗi không xác định');
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  constructor(payload: CommonResponse<unknown>, statusCode: number = 422) {
    super(statusCode, payload);
  }
}

/**
 * Mã lỗi nghiệp vụ BE trả trong `message` (không có field errorCode riêng).
 * Hiện thẳng mã lên Alert thì user đọc ra "CHAT_DUPLICATE_MESSAGE_LIMIT".
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  CHAT_DUPLICATE_MESSAGE_LIMIT:
    'Bạn đã gửi tin nhắn này quá nhiều lần. Vui lòng đổi nội dung.',
  CHAT_SPAM_CHECK_IN_PROGRESS:
    'Hệ thống đang kiểm tra tin trước. Vui lòng thử lại sau giây lát.',
};

/** Đổi mã lỗi BE sang câu tiếng Việt; không phải mã thì giữ nguyên message. */
export function toUserMessage(message: string): string {
  return ERROR_CODE_MESSAGES[message] ?? message;
}

type SetFieldError = (field: string, message: string) => void;

interface HandleErrorApiOptions {
  error: unknown;
  setFieldError?: SetFieldError;
}

/**
 * Xử lý lỗi API cho form — giống pattern Web nhưng dùng Alert thay toast.
 *
 * - EntityError (BE validation):  map lỗi xuống từng field qua setFieldError
 * - HttpError (lỗi chung):        hiện Alert
 * - Error khác:                   hiện Alert generic
 */
export function handleErrorApi({ error, setFieldError }: HandleErrorApiOptions) {
  if (error instanceof EntityError && setFieldError) {
    const { listErrors } = error.payload;
    if (listErrors?.length) {
      listErrors.forEach(({ field, detail }) => {
        // field từ BE là PascalCase (e.g. "FullName") — normalize sang camelCase
        const key = field.charAt(0).toLowerCase() + field.slice(1);
        setFieldError(key, detail);
      });
      return;
    }
  }

  if (error instanceof HttpError) {
    Alert.alert('Lỗi', toUserMessage(error.message));
    return;
  }

  if (error instanceof Error && error.message !== 'CANCELLED') {
    Alert.alert('Lỗi', error.message);
  }
}

