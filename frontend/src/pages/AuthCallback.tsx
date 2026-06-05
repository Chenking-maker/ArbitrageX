import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import client from '../api/client';

/**
 * OAuth 回调处理页面
 * 处理 GitHub/微信登录后的回调，获取用户信息并完成登录
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('正在处理登录...');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('user_id');

      if (!token || !userId) {
        setStatus('error');
        setMessage('登录失败：缺少必要的参数');
        showToast('登录失败：缺少必要的参数', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // 使用 token 获取用户信息
        const response = await client.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          const user = response.data;
          
          // 使用 loginWithToken 直接设置 token 和用户信息
          loginWithToken(token, user);
          
          setStatus('success');
          setMessage('登录成功！正在跳转...');
          showToast(`欢迎回来，${user.username}！`, 'success');
          
          // 跳转到首页
          setTimeout(() => navigate('/', { replace: true }), 1000);
        } else {
          throw new Error('获取用户信息失败');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('登录失败：无法获取用户信息');
        showToast('登录失败，请重试', 'error');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithToken, showToast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="w-16 h-16 border-4 border-[#126352]/30 border-t-[#126352] rounded-full animate-spin" />
        );
      case 'success':
        return (
          <div className="w-16 h-16 bg-[#126352]/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#126352]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-gray-300';
      case 'success':
        return 'text-[#126352]';
      case 'error':
        return 'text-red-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0a1f1a 0%, #0d2b23 50%, #11382e 100%)' }}>
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full opacity-30"
             style={{ background: 'radial-gradient(circle, rgba(18,99,82,0.4) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, rgba(253,116,45,0.3) 0%, transparent 70%)' }} />
      </div>

      <div className="relative text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg"
                 style={{ 
                   background: 'linear-gradient(135deg, #126352 0%, #1a8a73 50%, #FD742D 100%)',
                   boxShadow: '0 8px 32px rgba(18,99,82,0.4)'
                 }}>
              AX
            </div>
            <span className="text-2xl font-bold text-white">ArbitrageX</span>
          </div>
        </div>

        {/* 状态图标 */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* 状态文字 */}
        <h2 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
          {status === 'processing' && '正在登录'}
          {status === 'success' && '登录成功'}
          {status === 'error' && '登录失败'}
        </h2>
        <p className="text-gray-400">{message}</p>

        {/* 进度条（处理中） */}
        {status === 'processing' && (
          <div className="mt-8 w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full animate-pulse" 
                 style={{ width: '60%', background: 'linear-gradient(90deg, #126352, #FD742D)' }} />
          </div>
        )}

        {/* 重试按钮（错误时） */}
        {status === 'error' && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-2 text-white rounded-lg transition-colors"
            style={{ background: 'linear-gradient(135deg, #126352, #1a8a73)' }}
          >
            返回登录页
          </button>
        )}
      </div>
    </div>
  );
}
