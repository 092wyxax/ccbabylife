export const PAGE_SIZE = 20

export interface PageParams {
  page: number
  pageSize: number
  offset: number
}

export interface Paged<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function parsePage(input: string | undefined, pageSize = PAGE_SIZE): PageParams {
  const page = Math.max(1, Number(input ?? 1) || 1)
  return { page, pageSize, offset: (page - 1) * pageSize }
}

export function paged<T>(rows: T[], total: number, p: PageParams): Paged<T> {
  return {
    rows,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.max(1, Math.ceil(total / p.pageSize)),
  }
}
