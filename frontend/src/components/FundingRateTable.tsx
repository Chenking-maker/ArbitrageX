import { useMemo } from 'react';
import type { FundingRate } from '../types';
import { formatFundingRate, formatRelativeTime } from '../utils/format';
import { EmptyState } from './EmptyState';
import { Loading } from './Loading';

interface FundingRateTableProps {
  data?: FundingRate[];
  loading?: boolean;
}

export function FundingRateTable({ data, loading }: FundingRateTableProps) {
  // 按年化收益率绝对值排序
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => Math.abs(b.annualizedRate) - Math.abs(a.annualizedRate));
  }, [data]);

  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white">资金费率</h3>
        </div>
        <Loading text="获取资金费率中..." size="sm" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white">资金费率</h3>
        </div>
        <EmptyState
          title="暂无资金费率数据"
          description="请先在设置中配置交易所 API 密钥，系统将自动获取各交易所的资金费率数据。"
          action={{
            label: '前往设置',
            onClick: () => { window.location.href = '/settings'; },
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">资金费率</h3>
        <span className="text-xs text-gray-500">
          {data.length > 0 ? formatRelativeTime(data[0].nextFundingTime) + '更新' : ''}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-dark-border">
              <th className="text-left px-6 py-3 font-medium">交易所</th>
              <th className="text-left px-4 py-3 font-medium">交易对</th>
              <th className="text-right px-4 py-3 font-medium">资金费率</th>
              <th className="text-right px-4 py-3 font-medium">年化收益率</th>
              <th className="text-right px-4 py-3 font-medium">标记价格</th>
              <th className="text-right px-6 py-3 font-medium">下次结算</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr
                key={item.id}
                className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors"
              >
                <td className="px-6 py-3.5">
                  <span className="text-sm font-medium text-white">{item.exchange}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-gray-300 font-mono">{item.symbol}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className={`text-sm font-mono font-semibold ${
                      item.rate > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {formatFundingRate(item.rate)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className={`text-sm font-mono ${
                      item.annualizedRate > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {formatFundingRate(item.annualizedRate)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm text-gray-400 font-mono">
                    {(item as FundingRate & { markPrice?: number }).markPrice?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '--'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-sm text-gray-400">
                    {new Date(item.nextFundingTime).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
