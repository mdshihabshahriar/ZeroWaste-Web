export function paginated<T>(data: T[], total: number, q: { page: number; limit: number }) {
  return {
    data,
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
  };
}