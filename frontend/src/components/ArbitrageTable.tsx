import type { ArbitrageOpportunity } from '../types';
import { formatPrice, formatPercent, formatMoney } from '../utils/format';
import { EmptyState } from './EmptyState';
import { Loading } from './Loading';

interface ArbitrageTableProps {
  data?: ArbitrageOpportunity[];
  loading?: boolean;
  onExecute?: (id: string) => void;
}

export function ArbitrageTable({ data, loading, onExecute }: ArbitrageTableProps) {
  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white">实时套利机会</h3>
        </div>
        <Loading text="获取套利机会中..." size="sm" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">实时套利机会</h3>
          <span className="text-xs text-[#10B981] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            持续监控中
          </span>
        </div>
        <EmptyState
          title="当前无套利机会"
          description="系统正在持续监控 Polymarket 等预测市场，发现套利机会时会自动显示。"
        />
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">实时套利机会</h3>
        <span className="text-xs text-[#10B981] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          实时更新
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-dark-border">
              <th className="text-left px-6 py-3 font-medium">市场</th>
              <th className="text-left px-4 py-3 font-medium">问题</th>
              <th className="text-right px-4 py-3 font-medium">Yes 价格</th>
              <th className="text-right px-4 py-3 font-medium">No 价格</th>
              <th className="text-right px-4 py-3 font-medium">套利利润</th>
              <th className="text-right px-4 py-3 font-medium">成交量</th>
              <th className="text-center px-6 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors"
              >
                <td className="px-6 py-3.5">
                  <span className="text-sm font-medium text-white">{item.market}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-gray-400">{item.question}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm text-[#10B981] font-mono">
                    {formatPrice(item.yesPrice)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm text-blue-400 font-mono">
                    {formatPrice(item.noPrice)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm text-[#F59E0B] font-semibold">
                    {formatPercent(item.profitPercent)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm text-gray-400">{formatMoney(item.volume)}</span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <button
                    onClick={() => onExecute?.(item.id)}
                    className="px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] text-xs font-medium rounded-lg hover:bg-[#10B981]/20 transition-colors border border-[#10B981]/20"
                  >
                    执行套利
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
