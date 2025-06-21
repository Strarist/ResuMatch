import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Test token for development (REMOVE IN PRODUCTION!)
const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTA0ODMzOTgsInN1YiI6IjIifQ.STJDCtxfqPt18VU8yniAWPAAOkNUPnCz6YQnBA6_RxQ";

// Function to initialize token (call this in your app)
export const initializeAuth = () => {
  if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
    localStorage.setItem('token', TEST_TOKEN);
    console.log('🔑 Test token added to localStorage for development');
  }
};

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
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  title: string;
  filename: string;
  upload_date: string;
  updated_at: string;
  created_at: string;
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
  recent_activity: unknown[];
}

// API functions
export const auth = {
  login: async (email: string, password: string) => {
    // OAuth2PasswordRequestForm expects form data with username and password fields
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 expects 'username' field
    formData.append('password', password);
    
    const response = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { access_token, user } = response.data;
    if (access_token) {
      localStorage.setItem('token', access_token);
      return {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name || '',
          is_active: user.is_active ?? true,
          created_at: user.created_at || '',
          updated_at: user.updated_at || '',
        },
        access_token,
      };
    }
    throw new Error('Login failed: No access token received');
  },
  register: async (userData: { email: string; password: string; full_name: string }) => {
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
    const response = await api.get<{ items: Resume[]; total: number }>("/resumes/");
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
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ id: string; status: string; message: string }>('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
    const response = await api.get<Job[]>('/jobs/');
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
    const response = await api.get<DashboardData>('/dashboard/');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/dashboard/analytics/');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getRecentActivity: async () => {
    const response = await api.get<any[]>('/dashboard/recent-activity/');
    return response.data;
  },
};

export const matching = {
  matchResumeToJob: async (resumeId: string, jobId: string) => {
    const response = await api.post(`/matching/resume/${resumeId}/job/${jobId}`);
    return response.data;
  },
  
  batchMatch: async (request: { resume_ids: string[]; job_ids: string[]; strategy?: string; include_details?: boolean }) => {
    const response = await api.post('/matching/batch', request);
    return response.data;
  },
  
  getResumeMatches: async (resumeId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/matching/resume/${resumeId}/matches${params}`);
    return response.data;
  },
  
  getJobMatches: async (jobId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/matching/job/${jobId}/matches${params}`);
    return response.data;
  },
  
  getAnalytics: async () => {
    const response = await api.get('/matching/analytics');
    return response.data;
  },
};

export default api; 