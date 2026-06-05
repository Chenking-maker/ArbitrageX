import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { loginWithGitHub, loginWithWechat } from '../api/client';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('请输入邮箱地址', 'warning');
      return;
    }
    if (!password.trim()) {
      showToast('请输入密码', 'warning');
      return;
    }

    setLoading(true);

    try {
      const result = await login({ username: email, password });
      if (result.success) {
        showToast('登录成功，欢迎回来！', 'success');
        navigate(from, { replace: true });
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '登录失败，请检查邮箱和密码', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    showToast('正在跳转到 GitHub 登录...', 'info');
    loginWithGitHub();
  };

  const handleWechatLogin = () => {
    showToast('正在跳转到微信登录...', 'info');
    loginWithWechat();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0a1f1a 0%, #0d2b23 50%, #11382e 100%)' }}>
      
      {/* 动态背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 大圆形渐变 */}
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-30"
             style={{ background: 'radial-gradient(circle, rgba(18,99,82,0.4) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, rgba(253,116,45,0.3) 0%, transparent 70%)' }} />
        
        {/* 网格背景 */}
        <div className="absolute inset-0 opacity-5"
             style={{ 
               backgroundImage: `linear-gradient(rgba(18,99,82,0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(18,99,82,0.3) 1px, transparent 1px)`,
               backgroundSize: '50px 50px'
             }} />
        
        {/* 浮动元素 */}
        <div className="absolute top-20 left-10 w-20 h-20 rounded-lg opacity-10 animate-pulse"
             style={{ background: 'linear-gradient(135deg, #126352, #1a8a73)' }} />
        <div className="absolute bottom-32 right-20 w-16 h-16 rounded-full opacity-10 animate-pulse"
             style={{ background: 'linear-gradient(135deg, #FD742D, #ff8f57)', animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg"
                 style={{ 
                   background: 'linear-gradient(135deg, #126352 0%, #1a8a73 50%, #FD742D 100%)',
                   boxShadow: '0 8px 32px rgba(18,99,82,0.4)'
                 }}>
              AX
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white tracking-tight">ArbitrageX</h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>AI驱动的智能套利交易平台</p>
            </div>
          </div>
        </div>

        {/* 登录卡片 */}
        <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden"
             style={{ 
               background: 'rgba(18,99,82,0.1)',
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(18,99,82,0.3)'
             }}>
          
          {/* 卡片顶部装饰线 */}
          <div className="absolute top-0 left-0 right-0 h-1"
               style={{ background: 'linear-gradient(90deg, #126352, #FD742D, #126352)' }} />
          
          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white">欢迎回来</h2>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>选择以下方式登录您的账户</p>
          </div>

          {/* OAuth登录按钮 */}
          <div className="space-y-3 mb-8">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{ 
                background: 'rgba(255,255,255,0.95)',
                color: '#333'
              }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(18,99,82,0.1), transparent)' }} />
              <svg className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="relative z-10">使用 GitHub 登录</span>
            </button>

            <button
              onClick={handleWechatLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 text-white text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{ 
                background: 'linear-gradient(135deg, #07C160 0%, #06ad56 100%)'
              }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
              <svg className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.164 4.508c-2.09-.001-4.07.688-5.544 1.976-1.685 1.471-2.525 3.554-2.083 5.695.442 2.14 1.998 3.896 4.086 4.742a8.376 8.376 0 002.748.484c.758 0 1.497-.104 2.197-.298a.622.622 0 01.516.07l1.368.8a.233.233 0 00.12.039.212.212 0 00.208-.212c0-.052-.02-.103-.034-.153l-.28-1.06a.424.424 0 01.153-.477c1.26-.927 2.07-2.348 2.07-3.922 0-3.324-3.07-5.678-5.525-5.678v.004zm-2.09 2.932c.46 0 .833.38.833.848a.84.84 0 01-.833.847.84.84 0 01-.833-.847c0-.468.373-.848.833-.848zm4.181 0c.46 0 .833.38.833.848a.84.84 0 01-.833.847.84.84 0 01-.833-.847c0-.468.373-.848.833-.848z"/>
              </svg>
              <span className="relative z-10">使用微信登录</span>
            </button>
          </div>

          {/* 分隔线 */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid rgba(18,99,82,0.3)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ background: 'rgba(18,99,82,0.1)', color: 'rgba(255,255,255,0.5)' }}>或使用邮箱登录</span>
            </div>
          </div>

          {/* 邮箱登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>邮箱地址</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none"
                  style={{ 
                    background: 'rgba(10,31,26,0.8)',
                    border: '1px solid rgba(18,99,82,0.3)'
                  }}
                  placeholder="请输入邮箱地址"
                  disabled={loading}
                  onFocus={(e) => e.target.style.borderColor = '#FD742D'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(18,99,82,0.3)'}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>密码</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none"
                  style={{ 
                    background: 'rgba(10,31,26,0.8)',
                    border: '1px solid rgba(18,99,82,0.3)'
                  }}
                  placeholder="请输入密码"
                  disabled={loading}
                  onFocus={(e) => e.target.style.borderColor = '#FD742D'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(18,99,82,0.3)'}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                       style={{ accentColor: '#126352' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>记住我</span>
              </label>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                忘记密码？
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, #126352 0%, #1a8a73 50%, #FD742D 100%)',
                boxShadow: '0 4px 20px rgba(18,99,82,0.3)'
              }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
              {loading ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </span>
              ) : (
                <span className="relative z-10">登录</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              还没有账号？{' '}
              <Link to="/register" className="font-medium transition-colors hover:opacity-80"
                    style={{ color: '#FD742D' }}>
                立即注册
              </Link>
            </span>
          </div>
        </div>

        {/* 底部版权 */}
        <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
