import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const handleLogin = async (data: LoginRequest) => {
    try {
      const res: AuthResponse = await apiLogin(data);
      context.login(res.token, res.user);
      return { success: true };
    } catch {
      // 如果后端不可用，使用 mock 数据（仅用于开发测试）
      if (import.meta.env.DEV) {
        const mockUser = {
          id: '1',
          username: data.username,
          email: `${data.username}@arbitragex.com`,
          balance: 12580.50,
          role: 'user' as const,
          createdAt: new Date().toISOString(),
        };
        context.login('mock_token_' + Date.now(), mockUser);
        return { success: true };
      }
      throw new Error('登录失败，请检查邮箱和密码');
    }
  };

  const handleRegister = async (data: RegisterRequest) => {
    try {
      const res: AuthResponse = await apiRegister(data);
      context.login(res.token, res.user);
      return { success: true };
    } catch {
      // 如果后端不可用，使用 mock 数据（仅用于开发测试）
      if (import.meta.env.DEV) {
        const mockUser = {
          id: '1',
          username: data.username,
          email: data.email,
          balance: 0,
          role: 'user' as const,
          createdAt: new Date().toISOString(),
        };
        context.login('mock_token_' + Date.now(), mockUser);
        return { success: true };
      }
      throw new Error('注册失败，请稍后重试');
    }
  };

  return {
    ...context,
    login: handleLogin,
    loginWithToken: context.login, // 暴露原始的 token 登录方法（供 OAuth 回调使用）
    register: handleRegister,
  };
}
