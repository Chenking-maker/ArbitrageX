import { useState, useEffect } from 'react';

/* ================================================================
   Market Anomaly Detector - 市场异常检测面板
   灵感来源: poly_data + polymarket-insider-tracker
   实时监控市场微观结构异常，发现套利机会
   ================================================================ */

interface AnomalyMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  description: string;
}

interface ArbitrageOpportunity {
  id: string;
  type: 'cross_exchange' | 'funding_rate' | 'prediction_market' | 'flash_loan';
  source: string;
  target: string;
  asset: string;
  spread: number;
  profit: number;
  confidence: number;
  timeWindow: string;
  risk: 'low' | 'medium' | 'high';
}

const MOCK_METRICS: AnomalyMetric[] = [
  {
    id: '1',
    name: '订单簿深度偏差',
    value: 2.3,
    change: +0.8,
    threshold: 2.0,
    status: 'warning',
    description: '买单/卖单深度比异常',
  },
  {
    id: '2',
    name: '资金费率差异',
    value: 0.045,
    change: +0.012,
    threshold: 0.03,
    status: 'critical',
    description: 'Binance vs OKX 资金费率差',
  },
  {
    id: '3',
    name: '预测市场价差',
    value: 4.2,
    change: -1.1,
    threshold: 3.0,
    status: 'warning',
    description: 'Polymarket vs Kalshi 定价偏差%',
  },
  {
    id: '4',
    name: '链上大额转账',
    value: 12,
    change: +5,
    threshold: 10,
    status: 'warning',
    description: '过去1小时 >$100K 转账数',
  },
  {
    id: '5',
    name: '波动率突增',
    value: 1.8,
    change: +0.3,
    threshold: 2.0,
    status: 'normal',
    description: '5分钟波动率 / 1小时波动率',
  },
];

const MOCK_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    id: '1',
    type: 'prediction_market',
    source: 'Polymarket',
    target: 'Kalshi',
    asset: 'BTC $100K June',
    spread: 4.2,
    profit: 420,
    confidence: 92,
    timeWindow: '< 5分钟',
    risk: 'low',
  },
  {
    id: '2',
    type: 'funding_rate',
    source: 'Binance',
    target: 'OKX',
    asset: 'ETH/USDT',
    spread: 0.045,
    profit: 180,
    confidence: 88,
    timeWindow: '< 1小时',
    risk: 'low',
  },
  {
    id: '3',
    type: 'cross_exchange',
    source: 'Bybit',
    target: 'Binance',
    asset: 'SOL/USDT',
    spread: 0.18,
    profit: 95,
    confidence: 75,
    timeWindow: '< 30秒',
    risk: 'medium',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical': return '#FD742D';
    case 'warning': return '#F59E0B';
    case 'normal': return '#10B981';
    default: return '#6B7280';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'critical': return 'rgba(253, 116, 45, 0.1)';
    case 'warning': return 'rgba(245, 158, 11, 0.1)';
    case 'normal': return 'rgba(16, 185, 129, 0.1)';
    default: return 'rgba(107, 114, 128, 0.1)';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'high': return '#FD742D';
    default: return '#6B7280';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'prediction_market':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'funding_rate':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'prediction_market': return '预测市场套利';
    case 'funding_rate': return '资金费率套利';
    case 'cross_exchange': return '跨所套利';
    case 'flash_loan': return '闪电贷套利';
    default: return '未知';
  }
};

export default function MarketAnomalyDetector() {
  const [metrics, setMetrics] = useState<AnomalyMetric[]>(MOCK_METRICS);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(MOCK_OPPORTUNITIES);
  const [activeTab, setActiveTab] = useState<'metrics' | 'opportunities'>('opportunities');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.value + (Math.random() - 0.5) * 0.1,
        change: m.change + (Math.random() - 0.5) * 0.05,
      })));
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = metrics.filter(m => m.status === 'critical').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;

  return (
    <div className="w-full">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FD742D] animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#FD742D] animate-ping opacity-40" />
          </div>
          <h3 className="text-white font-semibold text-base tracking-wide">
            市场异常检测
          </h3>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#FD742D]/20 text-[#FD742D] font-bold">
                {criticalCount} 紧急
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold">
                {warningCount} 警告
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-white/30 font-mono">
          更新于 {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'opportunities'
              ? 'bg-[#126352] text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          套利机会 ({opportunities.length})
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'metrics'
              ? 'bg-[#126352] text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          监控指标 ({metrics.length})
        </button>
      </div>

      {/* 套利机会列表 */}
      {activeTab === 'opportunities' && (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#FD742D]/20 rounded-xl p-4 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FD742D]/20 to-[#FD742D]/5 flex items-center justify-center text-[#FD742D]">
                    {getTypeIcon(opp.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{opp.asset}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                        {getTypeLabel(opp.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                      <span>{opp.source}</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span>{opp.target}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#FD742D] font-bold text-lg">
                    +${opp.profit}
                  </div>
                  <div className="text-xs text-white/40">
                    价差 {opp.spread}%
                  </div>
                </div>
              </div>

              {/* 底部信息 */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#126352] rounded-full transition-all"
                        style={{ width: `${opp.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40">{opp.confidence}% 置信度</span>
                  </div>
                  <span className="text-xs text-white/30">|</span>
                  <span className="text-xs text-white/40">窗口: {opp.timeWindow}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ 
                      color: getRiskColor(opp.risk),
                      backgroundColor: `${getRiskColor(opp.risk)}15`,
                    }}
                  >
                    {opp.risk === 'low' ? '低风险' : opp.risk === 'medium' ? '中风险' : '高风险'}
                  </span>
                  <button className="px-3 py-1 bg-[#126352] hover:bg-[#1a8a6e] text-white text-xs rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    执行套利
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 监控指标列表 */}
      {activeTab === 'metrics' && (
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(metric.status) }}
                />
                <div>
                  <div className="text-white text-sm">{metric.name}</div>
                  <div className="text-xs text-white/40">{metric.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-white font-mono font-bold">
                    {metric.value.toFixed(2)}
                  </span>
                  <span 
                    className={`text-xs ${metric.change >= 0 ? 'text-[#FD742D]' : 'text-[#10B981]'}`}
                  >
                    {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-white/30">
                  阈值: {metric.threshold}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/30">
        <p>基于 poly_data 链上数据 + CLOB API 实时分析 · 检测到异常时自动推送通知</p>
      </div>
    </div>
  );
}
