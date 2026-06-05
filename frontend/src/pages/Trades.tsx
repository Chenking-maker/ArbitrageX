import { useState } from 'react';
import type { Trade } from '../types';
import { formatMoney, formatDateTime, getStrategyLabel, getDirectionLabel } from '../utils/format';
import { Badge } from '../components/Badge';

// Mock 数据 - 更多记录
const MOCK_TRADES: Trade[] = [
  {
    id: '1', time: '2024-06-01T14:23:00Z', strategy: 'prediction_arbitrage', market: '2024美国大选', direction: 'buy', amount: 500, profit: 15.2, status: 'success',
  },
  {
    id: '2', time: '2024-06-01T13:45:00Z', strategy: 'funding_rate', market: 'BTC/USDT', direction: 'long', amount: 2000, profit: 8.5, status: 'success',
  },
  {
    id: '3', time: '2024-06-01T12:30:00Z', strategy: 'ai_trend', market: 'ETH/USDT', direction: 'long', amount: 1000, profit: -5.3, status: 'success',
  },
  {
    id: '4', time: '2024-06-01T11:15:00Z', strategy: 'prediction_arbitrage', market: 'BTC价格预测', direction: 'buy', amount: 300, profit: 9.0, status: 'success',
  },
  {
    id: '5', time: '2024-06-01T10:00:00Z', strategy: 'funding_rate', market: 'SOL/USDT', direction: 'short', amount: 800, profit: 3.2, status: 'pending',
  },
  {
    id: '6', time: '2024-05-31T22:30:00Z', strategy: 'prediction_arbitrage', market: '美联储利率', direction: 'buy', amount: 400, profit: 12.8, status: 'success',
  },
  {
    id: '7', time: '2024-05-31T20:15:00Z', strategy: 'ai_trend', market: 'DOGE/USDT', direction: 'short', amount: 600, profit: -2.1, status: 'failed',
  },
  {
    id: '8', time: '2024-05-31T18:00:00Z', strategy: 'funding_rate', market: 'ARB/USDT', direction: 'long', amount: 1500, profit: 6.7, status: 'success',
  },
  {
    id: '9', time: '2024-05-31T16:45:00Z', strategy: 'prediction_arbitrage', market: '以太坊ETF', direction: 'buy', amount: 700, profit: 21.3, status: 'success',
  },
  {
    id: '10', time: '2024-05-31T14:30:00Z', strategy: 'ai_trend', market: 'BTC/USDT', direction: 'long', amount: 2500, profit: 45.6, status: 'success',
  },
  {
    id: '11', time: '2024-05-30T22:00:00Z', strategy: 'prediction_arbitrage', market: 'AI发展', direction: 'buy', amount: 350, profit: 11.2, status: 'success',
  },
  {
    id: '12', time: '2024-05-30T18:30:00Z', strategy: 'funding_rate', market: 'BTC/USDT', direction: 'short', amount: 3000, profit: 15.8, status: 'success',
  },
  {
    id: '13', time: '2024-05-30T15:00:00Z', strategy: 'ai_trend', market: 'SOL/USDT', direction: 'long', amount: 1200, profit: -8.4, status: 'failed',
  },
  {
    id: '14', time: '2024-05-30T12:00:00Z', strategy: 'prediction_arbitrage', market: '2024美国大选', direction: 'buy', amount: 450, profit: 18.6, status: 'success',
  },
  {
    id: '15', time: '2024-05-29T20:00:00Z', strategy: 'funding_rate', market: 'ETH/USDT', direction: 'long', amount: 1800, profit: 9.3, status: 'success',
  },
];

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

const PAGE_SIZE = 10;

export function Trades() {
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // 筛选
  const filtered = MOCK_TRADES.filter((trade) => {
    if (strategyFilter !== 'all' && trade.strategy !== strategyFilter) return false;
    if (statusFilter !== 'all' && trade.status !== statusFilter) return false;
    return true;
  });

  // 分页
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-white">交易记录</h1>
        <p className="text-sm text-gray-500 mt-1">查看所有交易历史和收益详情</p>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">策略类型</label>
          <select
            value={strategyFilter}
            onChange={(e) => { setStrategyFilter(e.target.value); setPage(1); }}
            className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-primary focus:outline-none"
          >
            <option value="all">全部策略</option>
            <option value="prediction_arbitrage">预测市场套利</option>
            <option value="funding_rate">资金费率套利</option>
            <option value="ai_trend">AI趋势跟踪</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">状态</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-primary focus:outline-none"
          >
            <option value="all">全部状态</option>
            <option value="success">成功</option>
            <option value="pending">进行中</option>
            <option value="failed">失败</option>
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          共 {filtered.length} 条记录
        </div>
      </div>

      {/* 交易表格 */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
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
              {paged.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-gray-400">{formatDateTime(trade.time)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-300">{getStrategyLabel(trade.strategy)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-white font-medium">{trade.market}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`text-xs font-medium ${
                        trade.direction === 'buy' || trade.direction === 'long'
                          ? 'text-emerald-primary'
                          : 'text-danger'
                      }`}
                    >
                      {getDirectionLabel(trade.direction)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm text-gray-300 font-mono">{formatMoney(trade.amount)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`text-sm font-semibold font-mono ${
                        trade.profit >= 0 ? 'text-emerald-primary' : 'text-danger'
                      }`}
                    >
                      {trade.profit >= 0 ? '+' : ''}{formatMoney(trade.profit)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <Badge text={statusLabelMap[trade.status]} variant={statusVariantMap[trade.status]} />
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    暂无交易记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-dark-border flex items-center justify-between">
            <span className="text-sm text-gray-500">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm text-gray-400 bg-dark-bg border border-dark-border rounded-lg hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm text-gray-400 bg-dark-bg border border-dark-border rounded-lg hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
