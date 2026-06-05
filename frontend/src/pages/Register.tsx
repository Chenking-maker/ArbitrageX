import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 从 URL 参数获取邀请码
  useEffect(() => {
    const code = searchParams.get('ref');
    if (code) {
      setInviteCode(code);
      setShowInviteCode(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少8位');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username,
        email,
        password,
        inviteCode: inviteCode || undefined,
      });
      if (result.success) {
        navigate('/');
      }
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-[#10B981]/20">
              AX
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">创建账号</h2>
          <p className="text-gray-500 text-sm mt-2">注册 ArbitrageX，开始智能套利之旅</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-sm text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                placeholder="请输入邮箱地址"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                placeholder="请输入密码（至少8位）"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                placeholder="请再次输入密码"
                required
              />
            </div>

            {/* 邀请码（可展开） */}
            {!showInviteCode && (
              <button
                type="button"
                onClick={() => setShowInviteCode(true)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-400 transition-colors py-1"
              >
                有邀请码？
              </button>
            )}

            {showInviteCode && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  邀请码 <span className="text-gray-600">（可选）</span>
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                  placeholder="请输入邀请码"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-medium rounded-xl hover:from-[#059669] hover:to-[#047857] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#10B981]/20"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">
              已有账号？{' '}
              <Link to="/login" className="text-[#10B981] hover:text-[#34D399] transition-colors font-medium">
                立即登录
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
