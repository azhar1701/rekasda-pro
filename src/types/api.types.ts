// Standardized API Response Wrapper
export interface ApiResponse<T> {
 data: T | null;
 error: ApiError | null;
 status: 'success' | 'error' | 'loading';
 timestamp: string;
}

export interface ApiError {
 code: string;
 message: string;
 details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
 items: T[];
 total: number;
 page: number;
 pageSize: number;
 hasMore: boolean;
}
