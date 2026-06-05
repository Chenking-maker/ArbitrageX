import { useState, useEffect } from 'react';

/* ================================================================
   Smart Money Tracker - 聪明钱追踪面板
   灵感来源: polymarket-insider-tracker (pselamy)
   检测异常交易模式，识别可能的内幕交易信号
   ================================================================ */

interface SmartMoneySignal {
  id: string;
  wallet: string;
  walletAge: string;
  market: string;
  action: 'BUY' | 'SELL';
  price: number;
  size: number;
  marketVolume24h: number;
  impact: number;
  signals: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  fundingSource?: string;
}

const MOCK_SIGNALS: SmartMoneySignal[] = [
  {
    id: '1',
    wallet: '0x7a3...f91',
    walletAge: '2小时',
    market: 'Will BTC hit $100K by June?',
    action: 'BUY',
    price: 0.075,
    size: 15000,
    marketVolume24h: 185000,
    impact: 8.2,
    signals: ['新钱包', '大额交易', '小众市场'],
    confidence: 'HIGH',
    timestamp: '2分钟前',
    fundingSource: 'Binance Hot Wallet',
  },
  {
    id: '2',
    wallet: '0x9d8...ce1',
    walletAge: '3天',
    market: 'Trump 2026 Impeachment?',
    action: 'SELL',
    price: 0.32,
    size: 8200,
    marketVolume24h: 42000,
    impact: 19.5,
    signals: ['流动性冲击', '逆向操作'],
    confidence: 'HIGH',
    timestamp: '5分钟前',
    fundingSource: 'OKX',
  },
  {
    id: '3',
    wallet: '0x3cf...7b3',
    walletAge: '1年',
    market: 'ETH ETF Approval in Q3?',
    action: 'BUY',
    price: 0.68,
    size: 45000,
    marketVolume24h: 890000,
    impact: 5.1,
    signals: ['老钱包回归', '主流市场'],
    confidence: 'MEDIUM',
    timestamp: '12分钟前',
  },
  {
    id: '4',
    wallet: '0xdef...789',
    walletAge: '6个月',
    market: 'Fed Rate Cut in July?',
    action: 'BUY',
    price: 0.45,
    size: 28000,
    marketVolume24h: 320000,
    impact: 8.8,
    signals: ['狙击集群', '新闻前建仓'],
    confidence: 'HIGH',
    timestamp: '18分钟前',
    fundingSource: 'Coinbase',
  },
];

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'HIGH': return '#FD742D';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW': return '#10B981';
    default: return '#6B7280';
  }
};

const getConfidenceBg = (confidence: string) => {
  switch (confidence) {
    case 'HIGH': return 'rgba(253, 116, 45, 0.15)';
    case 'MEDIUM': return 'rgba(245, 158, 11, 0.15)';
    case 'LOW': return 'rgba(16, 185, 129, 0.15)';
    default: return 'rgba(107, 114, 128, 0.15)';
  }
};

const getActionColor = (action: string) => {
  return action === 'BUY' ? '#10B981' : '#EF4444';
};

export default function SmartMoneyTracker() {
  const [signals, setSignals] = useState<SmartMoneySignal[]>(MOCK_SIGNALS);
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [isLive, setIsLive] = useState(true);

  // 模拟实时数据更新
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      // 随机更新某个信号的时间戳
      setSignals(prev => prev.map(s => ({
        ...s,
        timestamp: Math.random() > 0.7 ? '刚刚' : s.timestamp,
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filteredSignals = filter === 'ALL' 
    ? signals 
    : signals.filter(s => s.confidence === filter);

  return (
    <div className="w-full">
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FD742D] animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#FD742D] animate-ping opacity-40" />
          </div>
          <h3 className="text-white font-semibold text-base tracking-wide">
            聪明钱追踪
          </h3>
          <span className="text-xs text-white/40 font-mono">
            实时检测异常交易模式
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === 'ALL' 
                ? 'bg-[#126352] text-white' 
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('HIGH')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === 'HIGH' 
                ? 'bg-[#FD742D]/20 text-[#FD742D]' 
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            高风险
          </button>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`ml-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isLive 
                ? 'bg-[#126352]/30 text-[#4ADE80]' 
                : 'bg-white/5 text-white/30'
            }`}
          >
            {isLive ? '● 实时监控中' : '○ 已暂停'}
          </button>
        </div>
      </div>

      {/* 信号列表 */}
      <div className="space-y-3">
        {filteredSignals.map((signal) => (
          <div
            key={signal.id}
            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#FD742D]/20 rounded-xl p-4 transition-all duration-300 cursor-pointer"
          >
            {/* 顶部信息行 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* 钱包图标 */}
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#126352] to-[#0a3d2e] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">{signal.wallet}</span>
                    <span className="text-xs text-white/30">· {signal.walletAge}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span 
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ 
                        color: getActionColor(signal.action),
                        backgroundColor: `${getActionColor(signal.action)}15`,
                      }}
                    >
                      {signal.action}
                    </span>
                    <span className="text-xs text-white/50">@ ${signal.price.toFixed(3)}</span>
                    <span className="text-xs text-white/30">|</span>
                    <span className="text-xs text-white/50">${signal.size.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ 
                    color: getConfidenceColor(signal.confidence),
                    backgroundColor: getConfidenceBg(signal.confidence),
                  }}
                >
                  {signal.confidence === 'HIGH' ? '高风险' : signal.confidence === 'MEDIUM' ? '中风险' : '低风险'}
                </span>
                <span className="text-xs text-white/30">{signal.timestamp}</span>
              </div>
            </div>

            {/* 市场信息 */}
            <div className="mb-3">
              <p className="text-sm text-white/70 font-medium">{signal.market}</p>
            </div>

            {/* 检测信号标签 */}
            <div className="flex items-center gap-2 flex-wrap">
              {signal.signals.map((sig, idx) => (
                <span 
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10"
                >
                  {sig}
                </span>
              ))}
              <span className="text-xs text-white/30 ml-auto">
                冲击: {signal.impact}% 日成交量
              </span>
            </div>

            {/* 资金来源（如果有） */}
            {signal.fundingSource && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs text-white/30">资金来源: {signal.fundingSource}</span>
                </div>
              </div>
            )}

            {/* 悬停时的操作按钮 */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="px-3 py-1.5 bg-[#126352] hover:bg-[#1a8a6e] text-white text-xs rounded-lg transition-colors">
                查看详情
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部统计 */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
        <span>过去24小时检测到 <span className="text-[#FD742D] font-bold">{signals.length}</span> 个异常信号</span>
        <span>数据源: Polymarket CLOB API + Polygon 链上分析</span>
      </div>
    </div>
  );
}
