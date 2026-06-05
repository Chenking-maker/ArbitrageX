import { useState, useEffect } from 'react';
import type { Strategy, PredictionArbitrageConfig, FundingRateConfig, AiTrendConfig, StrategyType } from '../types';
import { formatMoney } from '../utils/format';
import { Badge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import client from '../api/client';

function getConfig<T>(strategy: Strategy, _type: Strategy['type']): T {
  return strategy.config as T;
}

const strategyIconMap: Record<StrategyType, string> = {
  prediction_arbitrage: '🎯',
  funding_rate: '💰',
  ai_trend: '🤖',
};

interface StrategyCardProps {
  strategy: Strategy;
  hasApiKeys: boolean;
}

function StrategyCard({ strategy, hasApiKeys }: StrategyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmModeSwitch, setConfirmModeSwitch] = useState(false);

  const handleToggle = async () => {
    if (!confirmToggle) {
      setConfirmToggle(true);
      return;
    }
    setConfirmToggle(false);
    try {
      await client.put(`/strategies/${strategy.id}`, { enabled: !strategy.enabled });
    } catch {
      // 错误处理
    }
  };

  const colorClass = strategy.type === 'prediction_arbitrage' ? 'emerald' : strategy.type === 'funding_rate' ? 'gold' : 'blue';

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
          <div className="relative">
            <button
              onClick={handleToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                strategy.enabled ? 'bg-[#10B981]' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  strategy.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            {confirmToggle && (
              <div className="absolute right-0 top-8 z-10 bg-[#111827] border border-[#1F2937] rounded-lg p-3 shadow-xl min-w-[200px]">
                <p className="text-xs text-gray-300 mb-2">
                  确认{strategy.enabled ? '暂停' : '启用'}策略「{strategy.name}」？
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmToggle(false)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleToggle}
                    className="flex-1 px-2 py-1 text-xs bg-[#10B981] text-white rounded hover:bg-[#059669]"
                  >
                    确认
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 状态 */}
        <div className="flex items-center gap-2 mb-4">
          <Badge
            text={strategy.enabled ? '运行中' : '已暂停'}
            variant={strategy.enabled ? 'success' : 'default'}
          />
          {!hasApiKeys && (
            <Badge text="未配置API" variant="warning" />
          )}
        </div>

        {/* 未配置 API 提示 */}
        {!hasApiKeys && (
          <div className="mb-4 p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg text-sm text-[#F59E0B]">
            请先在设置中配置 API 密钥，策略才能正常运行。
          </div>
        )}

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">累计收益</div>
            <div className="text-lg font-bold text-[#10B981]">
              {formatMoney(strategy.totalProfit)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">今日收益</div>
            <div className={`text-lg font-bold ${
              strategy.todayProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
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
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-[#10B981] focus:outline-none"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">最大仓位 ($)</label>
                  <input
                    type="number"
                    defaultValue={getConfig<PredictionArbitrageConfig>(strategy, 'prediction_arbitrage').maxPosition}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-[#10B981] focus:outline-none"
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
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-[#10B981] focus:outline-none"
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
                          className="rounded border-dark-border bg-dark-bg text-[#10B981] focus:ring-[#10B981]"
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
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-[#10B981] focus:outline-none"
                >
                  <option value="low">低风险</option>
                  <option value="medium">中风险</option>
                  <option value="high">高风险</option>
                </select>
              </div>
            )}
            <button className="w-full py-2 bg-[#10B981]/10 text-[#10B981] text-sm font-medium rounded-lg hover:bg-[#10B981]/20 transition-colors border border-[#10B981]/20">
              保存配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Strategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApiKeys, setHasApiKeys] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [strategiesRes, statusRes] = await Promise.allSettled([
          client.get<Strategy[]>('/strategies'),
          client.get<{ sources: Array<{ name: string; connected: boolean }> }>('/status/connections'),
        ]);

        if (strategiesRes.status === 'fulfilled') {
          setStrategies(strategiesRes.value.data);
        }

        if (statusRes.status === 'fulfilled') {
          const connected = statusRes.value.data.sources?.filter(s => s.connected).length || 0;
          setHasApiKeys(connected > 0);
        }
      } catch {
        // 后端不可用
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">策略管理</h1>
          <p className="text-sm text-gray-500 mt-1">配置和管理您的套利策略</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${strategies.some(s => s.enabled) ? 'bg-[#10B981] animate-pulse' : 'bg-gray-600'}`} />
          {strategies.some(s => s.enabled) ? '系统运行中' : '系统待机中'}
        </div>
      </div>

      {loading ? (
        <Loading text="获取策略列表中..." />
      ) : strategies.length === 0 ? (
        <EmptyState
          title="暂无策略"
          description="请先配置 API 密钥，系统将自动创建默认策略。"
          action={{
            label: '前往设置',
            onClick: () => { window.location.href = '/settings'; },
          }}
        />
      ) : (
        <div className="space-y-6">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} hasApiKeys={hasApiKeys} />
          ))}
        </div>
      )}
    </div>
  );
}
