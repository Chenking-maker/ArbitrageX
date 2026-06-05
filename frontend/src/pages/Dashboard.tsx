import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import SmartMoneyTracker from '../components/SmartMoneyTracker';
import MarketAnomalyDetector from '../components/MarketAnomalyDetector';

/* ================================================================
   Mock Data - 模拟真实交易数据
   ================================================================ */

const MOCK_STATS = {
  totalProfit: 48732.56,
  todayPnl: 1247.83,
  winRate: 73.6,
  activeStrategies: 5,
  totalBalance: 156280.42,
  todayOpportunities: 23,
  todayTrades: 18,
  weeklyChange: 8.4,
};

const MOCK_PROFIT_DATA = [
  { date: '05-27', value: 42100 },
  { date: '05-28', value: 43200 },
  { date: '05-29', value: 42800 },
  { date: '05-30', value: 44100 },
  { date: '05-31', value: 45600 },
  { date: '06-01', value: 46900 },
  { date: '06-02', value: 48732 },
];

const MOCK_TRADES = [
  { id: 1, pair: 'BTC/USDT', type: '资金费率套利', exchange: 'Binance <-> OKX', pnl: +342.50, time: '14:32:18', status: 'completed' },
  { id: 2, pair: 'ETH/USDT', type: '预测市场套利', exchange: 'Polymarket <-> Kalshi', pnl: +128.75, time: '13:58:42', status: 'completed' },
  { id: 3, pair: 'SOL/USDT', type: 'AI趋势跟踪', exchange: 'Binance -> Bybit', pnl: -45.20, time: '12:15:03', status: 'completed' },
  { id: 4, pair: 'ARB/USDT', type: '资金费率套利', exchange: 'OKX <-> Bybit', pnl: +89.30, time: '11:42:55', status: 'completed' },
  { id: 5, pair: 'DOGE/USDT', type: 'AI趋势跟踪', exchange: 'Binance -> OKX', pnl: +67.18, time: '10:28:11', status: 'completed' },
  { id: 6, pair: 'MATIC/USDT', type: '预测市场套利', exchange: 'Polymarket <-> Metaculus', pnl: +215.60, time: '09:55:33', status: 'completed' },
  { id: 7, pair: 'AVAX/USDT', type: '资金费率套利', exchange: 'Bybit <-> Binance', pnl: +156.90, time: '08:12:07', status: 'completed' },
];

const MOCK_STRATEGIES = [
  {
    id: 1,
    name: '预测市场套利',
    description: '跨平台预测市场价差捕捉，利用 Polymarket 与 Kalshi 之间的定价偏差进行无风险套利',
    icon: 'crystal-ball',
    pnl24h: +543.35,
    pnl7d: +2847.20,
    winRate: 78.2,
    trades: 42,
    status: 'active',
    color: '#FD742D',
  },
  {
    id: 2,
    name: '资金费率套利',
    description: '永续合约资金费率套利，做多现货同时做空永续合约，收取正费率收益',
    icon: 'rate',
    pnl24h: +412.48,
    pnl7d: +2156.80,
    winRate: 82.1,
    trades: 67,
    status: 'active',
    color: '#22c55e',
  },
  {
    id: 3,
    name: 'AI 趋势跟踪',
    description: '基于机器学习模型的多时间框架趋势分析，自动识别入场和出场信号',
    icon: 'ai',
    pnl24h: +292.00,
    pnl7d: +1528.56,
    winRate: 68.4,
    trades: 31,
    status: 'active',
    color: '#3b82f6',
  },
];

/* ================================================================
   CSS-in-JS Keyframes & Styles
   ================================================================ */

const keyframes = `
@keyframes dash-fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dash-glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(18,99,82,0.15); }
  50% { box-shadow: 0 0 24px rgba(18,99,82,0.35), 0 0 48px rgba(18,99,82,0.1); }
}
@keyframes dash-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes dash-number-tick {
  0% { opacity: 0.4; transform: translateY(4px); }
  50% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0.4; transform: translateY(-4px); }
}
@keyframes dash-chart-draw {
  from { stroke-dashoffset: 800; }
  to { stroke-dashoffset: 0; }
}
@keyframes dash-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
`;

const styles = `
.ax-dash-root {
  --ax-primary: #126352;
  --ax-primary-light: #1a8a73;
  --ax-primary-dark: #0d4a3d;
  --ax-accent: #FD742D;
  --ax-accent-light: #ff8f57;
  --ax-bg: #0a1f1a;
  --ax-bg2: #11382e;
  --ax-card: rgba(18, 99, 82, 0.07);
  --ax-card-hover: rgba(18, 99, 82, 0.13);
  --ax-border: rgba(18, 99, 82, 0.22);
  --ax-border-hover: rgba(18, 99, 82, 0.45);
  --ax-text: #ffffff;
  --ax-text2: rgba(255,255,255,0.72);
  --ax-text3: rgba(255,255,255,0.45);
  --ax-success: #22c55e;
  --ax-danger: #ef4444;
  --ax-warning: #f59e0b;

  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  color: var(--ax-text);
}

/* --- Stat Cards --- */
.ax-stat-card {
  background: linear-gradient(135deg, rgba(18,99,82,0.12) 0%, rgba(18,99,82,0.04) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--ax-border);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: dash-fade-in-up 0.6s ease both;
}
.ax-stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--ax-primary-light), transparent);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.ax-stat-card:hover {
  background: linear-gradient(135deg, rgba(18,99,82,0.18) 0%, rgba(18,99,82,0.06) 100%);
  border-color: var(--ax-border-hover);
  transform: translateY(-3px);
  animation: dash-glow-pulse 2s ease-in-out infinite;
}
.ax-stat-card:hover::before {
  opacity: 1;
}

/* --- Glass Panel --- */
.ax-glass-panel {
  background: linear-gradient(135deg, rgba(18,99,82,0.10) 0%, rgba(10,31,26,0.6) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--ax-border);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: dash-fade-in-up 0.6s ease both;
}
.ax-glass-panel:hover {
  border-color: var(--ax-border-hover);
  box-shadow: 0 0 30px rgba(18,99,82,0.12), 0 8px 32px rgba(0,0,0,0.3);
}

/* --- Strategy Card --- */
.ax-strategy-card {
  background: linear-gradient(160deg, rgba(18,99,82,0.10) 0%, rgba(10,31,26,0.5) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--ax-border);
  border-radius: 18px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: dash-fade-in-up 0.6s ease both;
}
.ax-strategy-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  padding: 1px;
  background: linear-gradient(135deg, transparent 40%, var(--ax-primary-light) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.ax-strategy-card:hover {
  transform: translateY(-4px);
  border-color: var(--ax-border-hover);
  box-shadow: 0 12px 40px rgba(0,0,0,0.35), 0 0 20px rgba(18,99,82,0.15);
}
.ax-strategy-card:hover::after {
  opacity: 1;
}

/* --- Trade Row --- */
.ax-trade-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.5fr 0.8fr 0.8fr;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(18,99,82,0.1);
  transition: background 0.2s ease;
  font-size: 13px;
}
.ax-trade-row:hover {
  background: rgba(18,99,82,0.08);
}
.ax-trade-row:last-child {
  border-bottom: none;
}

/* --- Chart Area --- */
.ax-chart-area {
  position: relative;
  height: 260px;
  width: 100%;
  overflow: hidden;
}
.ax-chart-area svg {
  width: 100%;
  height: 100%;
}

/* --- Badge --- */
.ax-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* --- Refresh Button --- */
.ax-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ax-primary-light);
  background: rgba(18,99,82,0.1);
  border: 1px solid rgba(18,99,82,0.25);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}
.ax-refresh-btn:hover {
  background: rgba(18,99,82,0.18);
  border-color: rgba(18,99,82,0.4);
  box-shadow: 0 0 16px rgba(18,99,82,0.15);
}

/* --- Status Dot --- */
.ax-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  animation: dash-number-tick 2s ease-in-out infinite;
}

/* --- Scrollbar --- */
.ax-scroll::-webkit-scrollbar { width: 4px; }
.ax-scroll::-webkit-scrollbar-track { background: transparent; }
.ax-scroll::-webkit-scrollbar-thumb { background: rgba(18,99,82,0.3); border-radius: 2px; }
`;

/* ================================================================
   Helper Components
   ================================================================ */

function injectStyles() {
  if (typeof document === 'undefined') return;
  const id = 'ax-dash-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = keyframes + styles;
  document.head.appendChild(style);
}

function formatCurrency(val: number, prefix = '+') {
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return val >= 0 ? `${prefix}$${formatted}` : `-$${formatted}`;
}

function formatCompact(val: number) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

/* Strategy Icon SVGs */
function StrategyIcon({ type, color }: { type: string; color: string }) {
  if (type === 'crystal-ball') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="16" r="10" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <circle cx="18" cy="16" r="10" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />
        <circle cx="18" cy="16" r="6" fill={`${color}20`} />
        <circle cx="15" cy="14" r="1.5" fill={color} opacity="0.8" />
        <circle cx="21" cy="15" r="1" fill={color} opacity="0.6" />
        <circle cx="18" cy="18" r="1.2" fill={color} opacity="0.7" />
        <path d="M12 28 L18 26 L24 28" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="18" y1="26" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }
  if (type === 'rate') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="6" y="8" width="24" height="20" rx="3" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <path d="M10 22 L14 16 L18 19 L22 12 L26 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="16" r="2" fill={color} opacity="0.8" />
        <circle cx="22" cy="12" r="2" fill={color} opacity="0.8" />
        <path d="M10 28 L14 24 L18 26 L22 20 L26 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" opacity="0.4" />
      </svg>
    );
  }
  // AI icon
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="12" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <circle cx="18" cy="18" r="8" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <circle cx="18" cy="18" r="3" fill={`${color}30`} />
      <circle cx="18" cy="18" r="1.5" fill={color} />
      <line x1="18" y1="6" x2="18" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="18" y1="26" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="6" y1="18" x2="10" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="26" y1="18" x2="30" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="9.5" y1="9.5" x2="12.3" y2="12.3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <line x1="23.7" y1="23.7" x2="26.5" y2="26.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/* ================================================================
   Profit Chart (Pure CSS + SVG, no chart library)
   ================================================================ */

function ProfitChart() {
  const data = MOCK_PROFIT_DATA;
  const minVal = Math.min(...data.map(d => d.value)) * 0.98;
  const maxVal = Math.max(...data.map(d => d.value)) * 1.02;
  const range = maxVal - minVal;
  const w = 700;
  const h = 240;
  const padX = 50;
  const padY = 30;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - ((d.value - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  // Grid lines
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padY + (i / 4) * chartH;
    const val = maxVal - (i / 4) * range;
    gridLines.push({ y, val });
  }

  return (
    <div className="ax-chart-area">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ax-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#126352" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#126352" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#126352" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ax-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#126352" />
            <stop offset="50%" stopColor="#1a8a73" />
            <stop offset="100%" stopColor="#FD742D" />
          </linearGradient>
          <filter id="ax-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padX} y1={g.y} x2={w - padX} y2={g.y} stroke="rgba(18,99,82,0.12)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padX - 8} y={g.y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="DM Sans">
              {formatCompact(g.val)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#ax-area-grad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#ax-line-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ax-glow)"
          strokeDasharray="800"
          style={{ animation: 'dash-chart-draw 2s ease forwards' }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#0a1f1a" stroke="#126352" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="1.5" fill="#1a8a73" />
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={points[i].x}
            y={h - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="10"
            fontFamily="DM Sans"
          >
            {d.date}
          </text>
        ))}
      </svg>

      {/* Tooltip highlight on last point */}
      <div
        style={{
          position: 'absolute',
          right: `${padX / w * 100 + 2}%`,
          top: `${(points[points.length - 1].y / h) * 100 - 4}%`,
          background: 'rgba(18,99,82,0.9)',
          backdropFilter: 'blur(8px)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#fff',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(26,138,115,0.4)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          animation: 'dash-float 3s ease-in-out infinite',
        }}
      >
        ${data[data.length - 1].value.toLocaleString()}
      </div>
    </div>
  );
}

/* ================================================================
   Main Dashboard Component
   ================================================================ */

export function Dashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    injectStyles();
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  if (!mounted) return null;

  const s = MOCK_STATS;

  return (
    <div className="ax-dash-root" style={{ padding: '0', maxWidth: '100%' }}>
      {/* ====== Header ====== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px',
        animation: 'dash-fade-in-up 0.5s ease both',
      }}>
        <div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#fff',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {user ? `Welcome back, ${user.username}` : 'Dashboard'}
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            marginTop: '6px',
            letterSpacing: '0.01em',
          }}>
            Real-time arbitrage monitoring &middot; Last sync just now
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Connection status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            fontSize: '12px',
            color: '#22c55e',
            fontWeight: 500,
          }}>
            <div className="ax-status-dot" style={{ background: '#22c55e' }} />
            System Online
          </div>

          {/* Refresh */}
          <button className="ax-refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', transition: 'all 0.3s' }}
            >
              <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ====== Stat Cards ====== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Total Profit */}
        <div className="ax-stat-card" style={{ animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Profit
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {formatCurrency(s.totalProfit, '')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            <span className="ax-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>
              {s.weeklyChange}%
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>this week</span>
          </div>
        </div>

        {/* Today PnL */}
        <div className="ax-stat-card" style={{ animationDelay: '0.12s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Today P&L
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(253,116,45,0.15), rgba(253,116,45,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FD742D" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#FD742D', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {formatCurrency(s.todayPnl)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            <span className="ax-badge" style={{ background: 'rgba(253,116,45,0.1)', color: '#FD742D' }}>
              {s.todayTrades} trades
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>today</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="ax-stat-card" style={{ animationDelay: '0.19s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Win Rate
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {s.winRate}%
          </div>
          {/* Win rate bar */}
          <div style={{ marginTop: '12px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              width: `${s.winRate}%`,
              height: '100%',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #126352, #1a8a73)',
              transition: 'width 1.5s ease',
            }} />
          </div>
        </div>

        {/* Active Strategies */}
        <div className="ax-stat-card" style={{ animationDelay: '0.26s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Strategies
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {s.activeStrategies}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            <span className="ax-badge" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
              {s.todayOpportunities} opportunities
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>scanning</span>
          </div>
        </div>
      </div>

      {/* ====== Middle Section: Chart + Trades ====== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Profit Chart */}
        <div className="ax-glass-panel" style={{ padding: '28px', animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Profit Trend</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Cumulative P&L over 7 days</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['7D', '30D', '90D'].map((label, i) => (
                <button key={label} style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: i === 0 ? 'rgba(18,99,82,0.5)' : 'rgba(18,99,82,0.15)',
                  background: i === 0 ? 'rgba(18,99,82,0.15)' : 'transparent',
                  color: i === 0 ? '#1a8a73' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ProfitChart />
        </div>

        {/* Recent Trades */}
        <div className="ax-glass-panel" style={{ padding: '0', animationDelay: '0.38s', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Recent Trades</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Latest executed arbitrage trades</p>
            </div>
            <a href="/trades" style={{ fontSize: '12px', color: '#1a8a73', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>
              View All &rarr;
            </a>
          </div>

          {/* Table header */}
          <div className="ax-trade-row" style={{ borderBottom: '1px solid rgba(18,99,82,0.15)', fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Pair</span>
            <span>Type</span>
            <span>Exchange</span>
            <span>P&L</span>
            <span>Time</span>
          </div>

          {/* Trade rows */}
          <div className="ax-scroll" style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
            {MOCK_TRADES.map((trade) => (
              <div className="ax-trade-row" key={trade.id}>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{trade.pair}</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>{trade.type}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{trade.exchange}</span>
                <span style={{
                  fontWeight: 600,
                  color: trade.pnl >= 0 ? '#22c55e' : '#ef4444',
                  fontSize: '13px',
                }}>
                  {formatCurrency(trade.pnl)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>{trade.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== Smart Money & Anomaly Detection ====== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Smart Money Tracker */}
        <div className="ax-glass-panel" style={{ padding: '24px', animationDelay: '0.45s' }}>
          <SmartMoneyTracker />
        </div>

        {/* Market Anomaly Detector */}
        <div className="ax-glass-panel" style={{ padding: '24px', animationDelay: '0.5s' }}>
          <MarketAnomalyDetector />
        </div>
      </div>

      {/* ====== Strategy Cards ====== */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Active Strategies</h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Performance overview of running strategies</p>
          </div>
          <a href="/strategies" style={{ fontSize: '12px', color: '#1a8a73', textDecoration: 'none', fontWeight: 500 }}>
            Manage Strategies &rarr;
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
        }}>
          {MOCK_STRATEGIES.map((strategy, idx) => (
            <div className="ax-strategy-card" key={strategy.id} style={{ animationDelay: `${0.42 + idx * 0.08}s` }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `linear-gradient(135deg, ${strategy.color}18, ${strategy.color}08)`,
                    border: `1px solid ${strategy.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <StrategyIcon type={strategy.icon} color={strategy.color} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>{strategy.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <div className="ax-status-dot" style={{ background: '#22c55e', width: '5px', height: '5px' }} />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Running</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 20px' }}>
                {strategy.description}
              </p>

              {/* Stats row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(18,99,82,0.12)',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>24h P&L</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: strategy.pnl24h >= 0 ? '#22c55e' : '#ef4444' }}>
                    {formatCurrency(strategy.pnl24h)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Win Rate</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                    {strategy.winRate}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>7d P&L</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: strategy.pnl7d >= 0 ? '#22c55e' : '#ef4444' }}>
                    {formatCurrency(strategy.pnl7d)}
                  </div>
                </div>
              </div>

              {/* Mini progress bar */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${strategy.winRate}%`,
                    height: '100%',
                    borderRadius: '2px',
                    background: `linear-gradient(90deg, ${strategy.color}80, ${strategy.color})`,
                    transition: 'width 1.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                  {strategy.trades} trades
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ====== Footer ====== */}
      <div style={{
        marginTop: '32px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(18,99,82,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'dash-fade-in-up 0.6s ease both',
        animationDelay: '0.7s',
      }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
          ArbitrageX v1.0.0 &middot; Powered by poly_data + Polymarket CLOB API
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
          Data refreshes every 30s &middot; All times in UTC+8
        </span>
      </div>
    </div>
  );
}
