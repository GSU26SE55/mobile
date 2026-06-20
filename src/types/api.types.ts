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

export interface PaginationResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
