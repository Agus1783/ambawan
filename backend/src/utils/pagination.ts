/**
 * Helper pagination (spec v2 §19): query `?page=1&limit=10`.
 * Default page 1, limit 10, limit maksimal 100.
 */
export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(query: unknown): PaginationQuery {
  const raw = query as Record<string, unknown>;
  const page = Math.max(
    1,
    Number.parseInt(String(raw.page ?? '1'), 10) || 1,
  );
  const limitRaw = Number.parseInt(String(raw.limit ?? '10'), 10) || 10;
  const limit = Math.min(100, Math.max(1, limitRaw));
  return { page, limit };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function offsetOf(page: number, limit: number): number {
  return (page - 1) * limit;
}
