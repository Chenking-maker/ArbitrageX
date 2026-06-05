// ============ 认证相关 ============
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  balance: number;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  inviteCode?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============ 仪表盘统计 ============
export interface DashboardStats {
  todayProfit: number;
  todayProfitChange: number; // 百分比变化
  totalBalance: number;
  activeStrategies: number;
  todayOpportunities: number;
}

// ============ 收益曲线 ============
export interface ProfitDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
}

// ============ 预测市场套利 ============
export interface ArbitrageOpportunity {
  id: string;
  market: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  profit: number;
  profitPercent: number;
  volume: number;
  expiresAt: string;
}

// ============ 资金费率 ============
export interface FundingRate {
  id: string;
  exchange: string;
  symbol: string;
  rate: number;
  nextFundingTime: string;
  direction: 'long' | 'short'; // 做多收费 or 做空收费
  annualizedRate: number;
}

// ============ 交易记录 ============
export interface Trade {
  id: string;
  time: string;
  strategy: 'prediction_arbitrage' | 'funding_rate' | 'ai_trend';
  market: string;
  direction: 'buy' | 'sell' | 'long' | 'short';
  amount: number;
  profit: number;
  status: 'success' | 'pending' | 'failed';
  details?: string;
}

// ============ 策略 ============
export type StrategyType = 'prediction_arbitrage' | 'funding_rate' | 'ai_trend';

export interface Strategy {
  id: string;
  type: StrategyType;
  name: string;
  description: string;
  enabled: boolean;
  totalProfit: number;
  todayProfit: number;
  tradeCount: number;
  config: PredictionArbitrageConfig | FundingRateConfig | AiTrendConfig;
}

export interface PredictionArbitrageConfig {
  minProfitThreshold: number;
  maxPosition: number;
  autoExecute: boolean;
}

export interface FundingRateConfig {
  rateThreshold: number;
  exchanges: string[];
  autoExecute: boolean;
}

export interface AiTrendConfig {
  riskLevel: 'low' | 'medium' | 'high';
  model: string;
  autoExecute: boolean;
}

// ============ 邀请分佣 ============
export interface ReferralStats {
  inviteCode: string;
  inviteLink: string;
  totalInvited: number;
  activeUsers: number;
  totalCommission: number;
  withdrawableCommission: number;
}

export interface CommissionRecord {
  id: string;
  time: string;
  fromUser: string;
  amount: number;
  type: 'direct' | 'indirect';
  status: 'pending' | 'settled';
}

export interface ReferralRanking {
  rank: number;
  username: string;
  inviteCount: number;
  commission: number;
}

// ============ 设置 ============
export interface ApiKeyConfig {
  polymarket: { apiKey: string; secret: string };
  binance: { apiKey: string; secret: string };
  okx: { apiKey: string; secret: string; passphrase: string };
  gateio: { apiKey: string; secret: string };
}

export interface NotificationConfig {
  telegram: { enabled: boolean; botToken: string; chatId: string };
  email: { enabled: boolean; address: string };
}

export interface RiskConfig {
  maxPosition: number;
  stopLossPercent: number;
  dailyLossLimit: number;
}

export type TradingMode = 'paper' | 'live';

// ============ WebSocket 消息 ============
export interface WSMessage {
  type: 'arbitrage' | 'funding' | 'trade' | 'stats' | 'ping';
  data: unknown;
}
