import type { Trade } from '../types';
import { formatMoney, formatDateTime, getStrategyLabel, getDirectionLabel } from '../utils/format';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';
import { Loading } from './Loading';

interface TradeTableProps {
  data?: Trade[];
  loading?: boolean;
  compact?: boolean;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'danger'> = {
  success: 'success',
  pending: 'warning',
  failed: 'danger',
};

const statusLabelMap: Record<string, string> = {
  success: '成功',
  pending: '进行中',
  failed: '失败',
};

export function TradeTable({ data, loading, compact = false }: TradeTableProps) {
  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white">最近交易记录</h3>
        </div>
        <Loading text="获取交易记录中..." size="sm" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">最近交易记录</h3>
          {!compact && (
            <a href="/trades" className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors">
              查看全部
            </a>
          )}
        </div>
        <EmptyState
          title="暂无交易记录"
          description="开始运行策略后，交易记录将自动显示在此处。"
        />
      </div>
    );
  }

  const displayTrades = compact ? data.slice(0, 5) : data;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">最近交易记录</h3>
        {!compact && (
          <a href="/trades" className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors">
            查看全部
          </a>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-dark-border">
              <th className="text-left px-6 py-3 font-medium">时间</th>
              <th className="text-left px-4 py-3 font-medium">策略</th>
              <th className="text-left px-4 py-3 font-medium">市场</th>
              <th className="text-center px-4 py-3 font-medium">方向</th>
              <th className="text-right px-4 py-3 font-medium">金额</th>
              <th className="text-right px-4 py-3 font-medium">利润</th>
              <th className="text-center px-6 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {displayTrades.map((trade) => (
              <tr
                key={trade.id}
                className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors"
              >
                <td className="px-6 py-3.5">
                  <span className="text-sm text-gray-400">
                    {formatDateTime(trade.time)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-gray-300">
                    {getStrategyLabel(trade.strategy)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-white font-medium">{trade.market}</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`text-xs font-medium ${
                      trade.direction === 'buy' || trade.direction === 'long'
                        ? 'text-[#10B981]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {getDirectionLabel(trade.direction)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm text-gray-300 font-mono">
                    {formatMoney(trade.amount)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className={`text-sm font-semibold font-mono ${
                      trade.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {trade.profit >= 0 ? '+' : ''}{formatMoney(trade.profit)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <Badge
                    text={statusLabelMap[trade.status]}
                    variant={statusVariantMap[trade.status]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
