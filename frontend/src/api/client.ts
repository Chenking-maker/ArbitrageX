import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动附加 token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除所有认证相关数据
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_timestamp');
      // 使用自定义事件通知应用层处理登出，避免整页刷新
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// ============ OAuth 登录跳转 ============

/**
 * 跳转到 GitHub 登录
 * 
 * 直接调用后端 OAuth 端点，由后端处理 GitHub 授权流程
 * 前端不需要知道 GitHub Client ID
 */
export function loginWithGitHub() {
  // 跳转到后端 OAuth 端点，后端会处理回调并重定向回前端
  window.location.href = `${API_BASE_URL}/api/auth/github`;
}

/**
 * 跳转到微信登录
 * 
 * 直接调用后端 OAuth 端点，由后端处理微信授权流程
 */
export function loginWithWechat() {
  // 跳转到后端 OAuth 端点，后端会处理回调并重定向回前端
  window.location.href = `${API_BASE_URL}/api/auth/wechat`;
}

export default client;
