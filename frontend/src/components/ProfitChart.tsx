import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ProfitDataPoint } from '../types';
import { formatMoney } from '../utils/format';
import { EmptyState } from './EmptyState';
import { Loading } from './Loading';

interface ProfitChartProps {
  data?: ProfitDataPoint[];
  loading?: boolean;
}

export function ProfitChart({ data, loading }: ProfitChartProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">收益曲线</h3>
        </div>
        <Loading text="获取收益数据中..." size="sm" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">收益曲线</h3>
          <div className="flex items-center gap-1 bg-dark-bg rounded-lg p-1">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium text-gray-400 cursor-default`}
            >
              近7天
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium text-gray-400 cursor-default`}
            >
              近30天
            </button>
          </div>
        </div>
        <EmptyState
          title="暂无数据"
          description="请先配置 API 密钥并启动策略，收益数据将自动记录。"
          action={{
            label: '前往设置',
            onClick: () => { window.location.href = '/settings'; },
          }}
        />
      </div>
    );
  }

  // 根据范围过滤数据
  const chartData = range === '7d' ? data.slice(-7) : data.slice(-30);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">收益曲线</h3>
        <div className="flex items-center gap-1 bg-dark-bg rounded-lg p-1">
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              range === '7d'
                ? 'bg-[#10B981] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            近7天
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              range === '30d'
                ? 'bg-[#10B981] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            近30天
          </button>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#1F2937' }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#1F2937' }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #1F2937',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatMoney(value), '累计收益']}
            />
            <Area
              type="monotone"
              dataKey="cumulativeProfit"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#profitGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
