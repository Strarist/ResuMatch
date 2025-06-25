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