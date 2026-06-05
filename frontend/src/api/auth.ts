import client from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function getCurrentUser(): Promise<User> {
  const res = await client.get<User>('/auth/me');
  return res.data;
}

export async function updatePassword(oldPassword: string, newPassword: string): Promise<void> {
  await client.put('/auth/password', { oldPassword, newPassword });
}
