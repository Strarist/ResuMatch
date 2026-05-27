import { jwtDecode } from "jwt-decode";

export type User = {
  sub: string;
  email: string;
  provider: string;
  name?: string;
  profile_img?: string;
  exp: number;
};

const TOKEN_KEY = "access_token";

export function login(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode<User>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(): boolean {
  const user = getUser();
  if (!user) return true;
  return user.exp * 1000 < Date.now();
}

export function isAuthenticated(): boolean {
  return !isTokenExpired();
}
