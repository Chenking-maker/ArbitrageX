import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import client from '../api/client';

// ============ 类型定义 ============

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: (forceClear?: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  forceClearAuth: () => void;
  validateToken: () => Promise<boolean>;
}

// ============ Context 创建 ============

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  forceClearAuth: () => {},
  validateToken: async () => false,
});

// ============ Provider 组件 ============

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * 强制清除所有认证数据
   * 用于处理登录状态异常或用户主动退出
   */
  const forceClearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_timestamp');
    // 清除可能存在的其他相关数据
    sessionStorage.removeItem('temp_auth');
  }, []);

  /**
   * 验证 token 是否有效
   */
  const validateToken = useCallback(async (): Promise<boolean> => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      return false;
    }

    try {
      // 尝试调用验证接口
      const response = await client.get('/auth/validate', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      return response.status === 200;
    } catch {
      // 如果后端不可用，检查 token 格式和过期时间
      try {
        // 简单 JWT 验证：检查是否包含三个部分
        const parts = currentToken.split('.');
        if (parts.length !== 3) {
          return false;
        }

        // 检查 payload 中的过期时间
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
    }
  }, []);

  /**
   * 初始化：从 localStorage 恢复登录状态
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const authTimestamp = localStorage.getItem('auth_timestamp');

        // 检查是否有保存的认证数据
        if (!savedToken || !savedUser) {
          forceClearAuth();
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        // 检查认证是否过期（7天）
        if (authTimestamp) {
          const authTime = parseInt(authTimestamp, 10);
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - authTime > sevenDays) {
            forceClearAuth();
            setIsLoading(false);
            setIsInitialized(true);
            return;
          }
        }

        // 验证 token 有效性
        const isValid = await validateToken();
        if (!isValid) {
          forceClearAuth();
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        // 解析用户数据
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          
          // 验证用户数据完整性
          if (!parsedUser.id || !parsedUser.username || !parsedUser.email) {
            throw new Error('Invalid user data');
          }

          setToken(savedToken);
          setUser(parsedUser);
        } catch {
          forceClearAuth();
        }
      } catch {
        forceClearAuth();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [forceClearAuth, validateToken]);

  /**
   * 登录
   */
  const login = useCallback((newToken: string, newUser: User) => {
    // 先清除旧数据
    forceClearAuth();

    // 设置新数据
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('auth_timestamp', Date.now().toString());
  }, [forceClearAuth]);

  /**
   * 登出
   */
  const logout = useCallback((forceClear = false) => {
    if (forceClear) {
      forceClearAuth();
    } else {
      // 正常登出，可以尝试通知后端
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        client.post('/auth/logout').catch(() => {
          // 忽略后端错误
        });
      }
      forceClearAuth();
    }
  }, [forceClearAuth]);

  /**
   * 更新用户信息
   */
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * 监听认证过期事件（由 API 401 拦截器触发）
   */
  useEffect(() => {
    const handleAuthExpired = () => {
      forceClearAuth();
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [forceClearAuth]);

  // 在初始化完成前不渲染任何内容，防止闪烁
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #0a1f1a 0%, #0d2b23 50%, #11382e 100%)' }}>
        <div className="w-12 h-12 border-2 border-[#126352]/30 border-t-[#126352] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
        forceClearAuth,
        validateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
