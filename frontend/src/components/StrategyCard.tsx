import { useState } from 'react';
import type { Strategy, PredictionArbitrageConfig, FundingRateConfig, AiTrendConfig, StrategyType } from '../types';
import { formatMoney } from '../utils/format';
import { Badge } from './Badge';

function getConfig<T>(strategy: Strategy, _type: Strategy['type']): T {
  return strategy.config as T;
}

// Mock 数据
const MOCK_STRATEGIES: Strategy[] = [
  {
    id: '1',
    type: 'prediction_arbitrage',
    name: '预测市场套利',
    description: '自动发现预测市场中的套利机会，同时买入 Yes 和 No 实现无风险套利',
    enabled: true,
    totalProfit: 2580.50,
    todayProfit: 124.60,
    tradeCount: 156,
    config: {
      minProfitThreshold: 2.0,
      maxPosition: 1000,
      autoExecute: true,
    } as PredictionArbitrageConfig,
  },
  {
    id: '2',
    type: 'funding_rate',
    name: '资金费率套利',
    description: '利用不同交易所间的资金费率差异进行套利',
    enabled: true,
    totalProfit: 1890.30,
    todayProfit: 88.40,
    tradeCount: 89,
    config: {
      rateThreshold: 0.01,
      exchanges: ['Binance', 'OKX', 'Bybit'],
      autoExecute: true,
    } as FundingRateConfig,
  },
  {
    id: '3',
    type: 'ai_trend',
    name: 'AI趋势跟踪',
    description: '基于 AI 模型分析市场趋势，自动进行趋势跟踪交易',
    enabled: false,
    totalProfit: 520.80,
    todayProfit: 0,
    tradeCount: 42,
    config: {
      riskLevel: 'medium',
      model: 'gpt-4-turbo',
      autoExecute: false,
    } as AiTrendConfig,
  },
];

const strategyIconMap: Record<StrategyType, string> = {
  prediction_arbitrage: '🎯',
  funding_rate: '💰',
  ai_trend: '🤖',
};

const strategyColorMap: Record<StrategyType, string> = {
  prediction_arbitrage: 'emerald',
  funding_rate: 'gold',
  ai_trend: 'blue',
};

interface StrategyCardProps {
  strategy?: Strategy;
}

export function StrategyCard({ strategy: initialStrategy }: StrategyCardProps) {
  const [strategy, setStrategy] = useState(initialStrategy || MOCK_STRATEGIES[0]);
  const [expanded, setExpanded] = useState(false);

  const toggleEnabled = () => {
    setStrategy((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const colorClass = strategyColorMap[strategy.type] || 'emerald';

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:border-dark-hover transition-colors">
      {/* 头部 */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{strategyIconMap[strategy.type]}</div>
            <div>
              <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{strategy.description}</p>
            </div>
          </div>
          {/* 开关 */}
          <button
            onClick={toggleEnabled}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              strategy.enabled ? 'bg-emerald-primary' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                strategy.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* 状态 */}
        <div className="flex items-center gap-2 mb-4">
          <Badge
            text={strategy.enabled ? '运行中' : '已暂停'}
            variant={strategy.enabled ? 'success' : 'default'}
          />
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">累计收益</div>
            <div className="text-lg font-bold text-emerald-primary">
              {formatMoney(strategy.totalProfit)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">今日收益</div>
            <div className={`text-lg font-bold ${
              strategy.todayProfit >= 0 ? 'text-emerald-primary' : 'text-danger'
            }`}>
              {strategy.todayProfit >= 0 ? '+' : ''}{formatMoney(strategy.todayProfit)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">交易次数</div>
            <div className="text-lg font-bold text-white">{strategy.tradeCount}</div>
          </div>
        </div>
      </div>

      {/* 配置区域 */}
      <div className="border-t border-dark-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span>策略配置</span>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-6 pb-6 space-y-4">
            {strategy.type === 'prediction_arbitrage' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">最小利润阈值 (%)</label>
                  <input
                    type="number"
                    defaultValue={getConfig<PredictionArbitrageConfig>(strategy, 'prediction_arbitrage').minProfitThreshold}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-primary focus:outline-none"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">最大仓位 ($)</label>
                  <input
                    type="number"
                    defaultValue={getConfig<PredictionArbitrageConfig>(strategy, 'prediction_arbitrage').maxPosition}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-primary focus:outline-none"
                    step="100"
                  />
                </div>
              </>
            )}
            {strategy.type === 'funding_rate' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">费率阈值 (%)</label>
                  <input
                    type="number"
                    defaultValue={getConfig<FundingRateConfig>(strategy, 'funding_rate').rateThreshold * 100}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-primary focus:outline-none"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">支持的交易所</label>
                  <div className="flex gap-2">
                    {['Binance', 'OKX', 'Bybit', 'Bitget'].map((exchange) => (
                      <label key={exchange} className="flex items-center gap-1.5 text-sm text-gray-400">
                        <input
                          type="checkbox"
                          defaultChecked={getConfig<FundingRateConfig>(strategy, 'funding_rate').exchanges.includes(exchange)}
                          className="rounded border-dark-border bg-dark-bg text-emerald-primary focus:ring-emerald-primary"
                        />
                        {exchange}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
            {strategy.type === 'ai_trend' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">风险等级</label>
                <select
                  defaultValue={getConfig<AiTrendConfig>(strategy, 'ai_trend').riskLevel}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-primary focus:outline-none"
                >
                  <option value="low">低风险</option>
                  <option value="medium">中风险</option>
                  <option value="high">高风险</option>
                </select>
              </div>
            )}
            <button className="w-full py-2 bg-emerald-primary/10 text-emerald-primary text-sm font-medium rounded-lg hover:bg-emerald-primary/20 transition-colors border border-emerald-primary/20">
              保存配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function StrategyCardList() {
  return (
    <div className="space-y-6">
      {MOCK_STRATEGIES.map((strategy) => (
        <StrategyCard key={strategy.id} strategy={strategy} />
      ))}
    </div>
  );
}
