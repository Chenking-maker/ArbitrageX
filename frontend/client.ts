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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ OAuth 登录跳转 ============

/**
 * 跳转到 GitHub 登录
 */
export function loginWithGitHub() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/github/callback`);
  if (clientId) {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  } else {
    // 如果没有配置 Client ID，直接跳转到后端 OAuth 端点
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  }
}

/**
 * 跳转到微信登录
 */
export function loginWithWechat() {
  const appId = import.meta.env.VITE_WECHAT_APP_ID;
  const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/wechat/callback`);
  if (appId) {
    window.location.href = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login#wechat_redirect`;
  } else {
    // 如果没有配置 App ID，直接跳转到后端 OAuth 端点
    window.location.href = `${API_BASE_URL}/api/auth/wechat`;
  }
}

export default client;
