// Auth service for REST API
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  // role comes from the backend (e.g. 'student', 'admin', 'coordinator')
  role?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

import api from './api';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const res = await api.post('/users/login', data);
    return res.data as AuthResponse;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await api.post('/users', {
      name: data.name,
      email: data.email,
      password_hash: data.password,
    });

    // After successful registration, login to get the token
    try {
      const loginResult = await this.login({ email: data.email, password: data.password });
      return loginResult;
    } catch (loginError) {
      console.error('Login after registration failed:', loginError);
      throw new Error('Registration successful, but login failed. Please try logging in manually.');
    }
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get('/users/me');
    return res.data as User;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
  }
};

export default authService;
