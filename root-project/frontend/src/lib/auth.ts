import { apiRequest, clearToken, setToken } from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

async function authenticate(path: string, body: RegisterInput | LoginInput): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>(path, {
    method: 'POST',
    body,
    auth: false,
  });

  setToken(response.token);

  return response.user;
}

export const auth = {
  register(input: RegisterInput): Promise<AuthUser> {
    return authenticate('/register', input);
  },

  login(input: LoginInput): Promise<AuthUser> {
    return authenticate('/login', input);
  },

  async me(): Promise<AuthUser> {
    return apiRequest<AuthUser>('/user');
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } finally {
      clearToken();
    }
  },
};
