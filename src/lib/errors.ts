import { Alert } from 'react-native';
import { CommonResponse } from '../types/api.types';

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
  constructor(payload: CommonResponse<unknown>) {
    super(422, payload);
  }
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
    Alert.alert('Lỗi', error.message);
    return;
  }

  if (error instanceof Error && error.message !== 'CANCELLED') {
    Alert.alert('Lỗi', error.message);
  }
}

