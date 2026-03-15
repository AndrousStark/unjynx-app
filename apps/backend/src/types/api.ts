export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: PaginationMeta;
}

export interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export function ok<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, error: null, meta };
}

export function err<T = never>(message: string): ApiResponse<T> {
  return { success: false, data: null, error: message };
}

export function paginated<T>(
  data: T,
  total: number,
  page: number,
  limit: number,
): ApiResponse<T> {
  return ok(data, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
