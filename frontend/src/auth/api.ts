const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  message: string;
  user: {
    id: string;
    email: string;
    name?: string;
    profile_img?: string;
    provider: string;
  };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const method = options.method || 'GET';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {};
    if (options.body || (method !== 'GET' && method !== 'HEAD')) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const config: RequestInit = {
      headers,
      credentials: 'include',
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let message = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          if (data && data.detail) message = data.detail;
        } catch { /* ignored */ }
        throw new ApiError(message, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      // If the error is network-related (fetch failed) or timeout, we handle it
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('Network'))) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[auth] backend unavailable - running in local mode (${endpoint})`);
        }
        throw new Error('BACKEND_OFFLINE');
      }

      // Re-throw other API application errors
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: RegisterRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/v1/auth/logout', { method: 'POST' });
  }

  async refreshToken(): Promise<{ access_token: string }> {
    return this.request<{ access_token: string }>('/v1/auth/refresh', { method: 'POST' });
  }

  async getProfile(): Promise<{ user: LoginResponse['user'] | null; offline?: boolean; state?: string; access_token?: string }> {
    try {
      return await this.request<{ user: LoginResponse['user'] | null; state?: string; access_token?: string }>('/v1/auth/profile');
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'BACKEND_OFFLINE') {
        return { user: null, offline: true, state: 'ANONYMOUS' };
      }
      throw error;
    }
  }

  getOAuthUrl(provider: 'google'): string {
    return `${this.baseUrl}/v1/auth/${provider}/login`;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
