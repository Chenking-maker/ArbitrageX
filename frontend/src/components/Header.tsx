import { useAuth } from '../hooks/useAuth';
import { formatMoney } from '../utils/format';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-dark-card border-b border-dark-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm text-gray-400">
          欢迎回来，<span className="text-white font-medium">{user?.username || '用户'}</span>
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* 余额 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">账户余额</span>
          <span className="text-sm font-semibold text-emerald-primary">
            {formatMoney(user?.balance || 0)}
          </span>
        </div>

        {/* 通知 */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* 用户菜单 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-primary/20 flex items-center justify-center text-emerald-primary text-sm font-medium">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            onClick={() => logout()}
            className="text-xs text-gray-500 hover:text-danger transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </header>
  );
}
