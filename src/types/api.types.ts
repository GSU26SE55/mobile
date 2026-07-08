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

// GH-68 — cursor-based pagination (chat cursor). BE `CursorPaginationResponse.cs`
// CHỈ có 3 field này — KHÔNG có totalItems (khác PaginationResponse).
export interface CursorPaginationResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
