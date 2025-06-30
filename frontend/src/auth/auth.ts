import { jwtDecode } from "jwt-decode";
import { apiClient } from "./api";

export type User = {
  sub: string;
  email: string;
  provider: string;
  name?: string;
  profile_img?: string;
  exp: number;
  created_at?: string;
};

const TOKEN_KEY = "access_token";
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export function login(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  const token = getToken();
  if (!token) return null;
  try {
    const user = jwtDecode<User>(token);
    return user;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const user = getUser();
  if (!user) return false;
  // Check expiry
  return user.exp * 1000 > Date.now();
}

export function isTokenExpired(): boolean {
  const user = getUser();
  if (!user) return true;
  return user.exp * 1000 < Date.now();
}

export function shouldRefreshToken(): boolean {
  const user = getUser();
  if (!user) return false;
  const now = Date.now();
  const exp = user.exp * 1000;
  return exp - now < REFRESH_THRESHOLD;
}

export async function refreshTokenIfNeeded(): Promise<string | null> {
  if (!shouldRefreshToken()) {
    return getToken();
  }

  try {
    const response = await apiClient.refreshToken();
    login(response.access_token);
    return response.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    logout();
    return null;
  }
}

export async function getValidToken(): Promise<string | null> {
  if (isTokenExpired()) {
    return null;
  }
  
  if (shouldRefreshToken()) {
    return await refreshTokenIfNeeded();
  }
  
  return getToken();
}

// Enhanced token validation with automatic refresh
export async function validateAndRefreshToken(): Promise<boolean> {
  const token = await getValidToken();
  return token !== null;
} 