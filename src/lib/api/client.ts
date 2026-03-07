/**
 * Centralized API Client for RekaSDA Python Engine
 * 
 * - Base URL from `VITE_API_URL` env variable
 * - Typed error handling with `ApiError`
 * - JSON-first request/response handling
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    message?: string,
  ) {
    super(message ?? detail);
    this.name = 'ApiError';
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<TResponse>;
}

export const apiClient = {
  /** Typed POST helper — serializes `payload` as JSON */
  post<TResponse, TPayload = unknown>(path: string, payload: TPayload): Promise<TResponse> {
    return request<TResponse>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Typed GET helper */
  get<TResponse>(path: string): Promise<TResponse> {
    return request<TResponse>(path, { method: 'GET' });
  },

  /** Poll for background task completion */
  async pollTask<TResult>(taskId: string, intervalMs = 1000, timeoutMs = 60000): Promise<TResult> {
    const startTime = Date.now();
    
    while (true) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Task timed out');
      }

      const status: any = await this.get(`/api/v1/tasks/${taskId}`);
      
      if (status.status === 'completed') {
        return status.result as TResult;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Task failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
};
