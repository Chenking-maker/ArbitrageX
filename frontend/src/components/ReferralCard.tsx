import type { ReferralStats } from '../types';
import { formatMoney } from '../utils/format';
import { CopyButton } from './CopyButton';

// Mock 数据
const MOCK_STATS: ReferralStats = {
  inviteCode: 'AX2024DEMO',
  inviteLink: 'https://arbitragex.com/ref/AX2024DEMO',
  totalInvited: 23,
  activeUsers: 15,
  totalCommission: 1250.80,
  withdrawableCommission: 380.50,
};

interface ReferralCardProps {
  stats?: ReferralStats;
}

export function ReferralCard({ stats }: ReferralCardProps) {
  const data = stats || MOCK_STATS;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">邀请链接</h3>

      {/* 邀请码 */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-2">邀请码</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-3 font-mono text-lg text-emerald-primary tracking-wider">
            {data.inviteCode}
          </div>
          <CopyButton text={data.inviteCode} />
        </div>
      </div>

      {/* 邀请链接 */}
      <div className="mb-6">
        <label className="block text-xs text-gray-500 mb-2">邀请链接</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-sm text-gray-300 truncate">
            {data.inviteLink}
          </div>
          <CopyButton text={data.inviteLink} />
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-bg rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">邀请人数</div>
          <div className="text-xl font-bold text-white">{data.totalInvited}</div>
        </div>
        <div className="bg-dark-bg rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">活跃用户</div>
          <div className="text-xl font-bold text-emerald-primary">{data.activeUsers}</div>
        </div>
        <div className="bg-dark-bg rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">总佣金</div>
          <div className="text-xl font-bold text-gold">{formatMoney(data.totalCommission)}</div>
        </div>
        <div className="bg-dark-bg rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">可提现佣金</div>
          <div className="text-xl font-bold text-emerald-primary">{formatMoney(data.withdrawableCommission)}</div>
        </div>
      </div>

      {/* 提现按钮 */}
      <button className="w-full mt-6 py-3 bg-emerald-primary text-white text-sm font-medium rounded-lg hover:bg-emerald-dark transition-colors">
        提现佣金
      </button>
    </div>
  );
}
