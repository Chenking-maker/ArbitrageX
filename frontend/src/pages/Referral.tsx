import { ReferralCard } from '../components/ReferralCard';
import { formatMoney, formatDateTime } from '../utils/format';
import { Badge } from '../components/Badge';

// Mock 佣金记录
const MOCK_COMMISSIONS = [
  { id: '1', time: '2024-06-01T10:00:00Z', fromUser: 'user_abc', amount: 25.0, type: 'direct' as const, status: 'settled' as const },
  { id: '2', time: '2024-05-31T15:30:00Z', fromUser: 'user_xyz', amount: 18.5, type: 'direct' as const, status: 'settled' as const },
  { id: '3', time: '2024-05-31T12:00:00Z', fromUser: 'user_123', amount: 12.0, type: 'indirect' as const, status: 'settled' as const },
  { id: '4', time: '2024-05-30T20:00:00Z', fromUser: 'user_def', amount: 30.0, type: 'direct' as const, status: 'settled' as const },
  { id: '5', time: '2024-05-30T08:00:00Z', fromUser: 'user_456', amount: 8.3, type: 'indirect' as const, status: 'pending' as const },
  { id: '6', time: '2024-05-29T16:00:00Z', fromUser: 'user_ghi', amount: 22.0, type: 'direct' as const, status: 'settled' as const },
];

// Mock 排行榜
const MOCK_RANKING = [
  { rank: 1, username: 'crypto_king', inviteCount: 156, commission: 12580.0 },
  { rank: 2, username: 'arb_master', inviteCount: 98, commission: 8900.5 },
  { rank: 3, username: 'profit_hunter', inviteCount: 67, commission: 5620.3 },
  { rank: 4, username: 'defi_whale', inviteCount: 45, commission: 3200.8 },
  { rank: 5, username: 'demo_user', inviteCount: 23, commission: 1250.8 },
  { rank: 6, username: 'trader_99', inviteCount: 18, commission: 980.2 },
  { rank: 7, username: 'blockchain_fan', inviteCount: 12, commission: 650.0 },
  { rank: 8, username: 'moon_shot', inviteCount: 8, commission: 420.5 },
  { rank: 9, username: 'hodler_pro', inviteCount: 5, commission: 210.3 },
  { rank: 10, username: 'newbie_2024', inviteCount: 2, commission: 50.0 },
];

const rankIconMap: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function Referral() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-white">邀请分佣</h1>
        <p className="text-sm text-gray-500 mt-1">邀请好友使用 ArbitrageX，获得交易佣金分成</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：邀请卡片 */}
        <div className="xl:col-span-1">
          <ReferralCard />
        </div>

        {/* 右侧：佣金记录 + 排行榜 */}
        <div className="xl:col-span-2 space-y-6">
          {/* 佣金记录 */}
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-border">
              <h3 className="text-lg font-semibold text-white">佣金记录</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-dark-border">
                    <th className="text-left px-6 py-3 font-medium">时间</th>
                    <th className="text-left px-4 py-3 font-medium">来源用户</th>
                    <th className="text-center px-4 py-3 font-medium">类型</th>
                    <th className="text-right px-4 py-3 font-medium">佣金</th>
                    <th className="text-center px-6 py-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_COMMISSIONS.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-gray-400">{formatDateTime(record.time)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-white font-mono">{record.fromUser}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          text={record.type === 'direct' ? '直接邀请' : '间接邀请'}
                          variant={record.type === 'direct' ? 'success' : 'info'}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-gold font-semibold">{formatMoney(record.amount)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge
                          text={record.status === 'settled' ? '已结算' : '待结算'}
                          variant={record.status === 'settled' ? 'success' : 'warning'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 邀请排行榜 */}
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-border">
              <h3 className="text-lg font-semibold text-white">邀请排行榜</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-dark-border">
                    <th className="text-center px-6 py-3 font-medium">排名</th>
                    <th className="text-left px-4 py-3 font-medium">用户</th>
                    <th className="text-right px-4 py-3 font-medium">邀请人数</th>
                    <th className="text-right px-6 py-3 font-medium">总佣金</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RANKING.map((item) => (
                    <tr
                      key={item.rank}
                      className={`border-b border-dark-border/50 hover:bg-dark-hover transition-colors ${
                        item.username === 'demo_user' ? 'bg-emerald-primary/5' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 text-center">
                        {rankIconMap[item.rank] ? (
                          <span className="text-xl">{rankIconMap[item.rank]}</span>
                        ) : (
                          <span className="text-sm text-gray-500">#{item.rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-medium ${item.username === 'demo_user' ? 'text-emerald-primary' : 'text-white'}`}>
                          {item.username}
                          {item.username === 'demo_user' && (
                            <span className="ml-2 text-xs text-emerald-primary/60">(我)</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-gray-300">{item.inviteCount}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm text-gold font-semibold">{formatMoney(item.commission)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
