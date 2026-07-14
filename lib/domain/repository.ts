export interface SortOption {
  field: string;
  order: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  limit: number;
}

/**
 * Base Repository Interface contract.
 * Serves as the abstraction layer for database operations in clean architecture.
 */
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
