import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  title: string;
  filename: string;
  upload_date: string;
  status: string;
  analysis?: unknown;
  skills?: string[];
  experience?: number;
  matchScore?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  salary_range?: string;
  posted_date: string;
  status: string;
  type?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  matchScore?: number;
}

export interface DashboardData {
  total_resumes: number;
  total_jobs: number;
  recent_matches: number;
  average_score: number;
  recent_activity: any[];
}

// API functions
export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post<{ access_token: string; user: User }>('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData: { email: string; password: string; first_name: string; last_name: string }) => {
    const response = await api.post<{ access_token: string; user: User }>('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  refresh: async () => {
    const response = await api.post<{ access_token: string }>('/auth/refresh');
    return response.data;
  },
  me: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export const resumes = {
  list: async () => {
    const response = await api.get<Resume[]>('/resumes');
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get<Resume>(`/resumes/${id}`);
    return response.data;
  },
  create: async (data: FormData) => {
    const response = await api.post<Resume>('/resumes', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },
  analyze: async (id: string) => {
    const response = await api.post(`/resumes/${id}/analyze`);
    return response.data;
  },
};

export const jobs = {
  list: async () => {
    const response = await api.get<Job[]>('/jobs');
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get<Job>(`/jobs/${id}`);
    return response.data;
  },
  create: async (data: Partial<Job>) => {
    const response = await api.post<Job>('/jobs', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Job>) => {
    const response = await api.put<Job>(`/jobs/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },
};

export const dashboard = {
  get: async () => {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/dashboard/analytics');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },
};

export default api; 