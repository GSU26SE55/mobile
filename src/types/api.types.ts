export interface ErrorEntity {
  field: string;
  detail: string;
}

export interface CommonResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message?: string;
  data: T | null;
  listErrors: ErrorEntity[];
}
