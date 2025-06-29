const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://resumatch-7nr2.onrender.com';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name?: string;
    profile_img?: string;
    provider: string;
  };
}

export interface OAuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name?: string;
    profile_img?: string;
    provider: string;
  };
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/v1/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<{ access_token: string }> {
    return this.request<{ access_token: string }>('/v1/auth/refresh', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<{ user: LoginResponse['user'] }> {
    return this.request<{ user: LoginResponse['user'] }>('/v1/auth/profile', {
      method: 'GET',
    });
  }

  getOAuthUrl(provider: 'google' | 'linkedin'): string {
    return `${this.baseUrl}/v1/auth/${provider}/login`;
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 