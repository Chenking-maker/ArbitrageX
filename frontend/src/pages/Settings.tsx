import { useState, useEffect } from 'react';
import type { TradingMode } from '../types';
import { Badge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { useToast } from '../components/Toast';
import client from '../api/client';

// ============ 类型定义 ============

interface ApiKeyState {
  apiKey: string;
  secret: string;
  passphrase?: string;
}

interface ApiKeysState {
  polymarket: ApiKeyState;
  binance: ApiKeyState;
  okx: ApiKeyState & { passphrase: string };
  gateio: ApiKeyState;
}

interface NotificationState {
  telegram: { enabled: boolean; botToken: string; chatId: string };
  email: { enabled: boolean; address: string };
}

interface RiskState {
  maxPosition: number;
  stopLossPercent: number;
  dailyLossLimit: number;
}

// ============ 密钥输入框组件 ============

function SecretInput({
  label,
  placeholder,
  value,
  onChange,
  showTestButton,
  onTest,
  testing,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  showTestButton?: boolean;
  onTest?: () => void;
  testing?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 pr-24 text-sm text-white placeholder-gray-500 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {showTestButton && onTest && (
          <button
            type="button"
            onClick={onTest}
            disabled={testing || !value}
            className="px-2 py-1 text-xs bg-[#10B981]/10 text-[#10B981] rounded hover:bg-[#10B981]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? '测试中...' : '测试'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="p-1.5 text-gray-500 hover:text-gray-400 transition-colors"
          tabIndex={-1}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ============ 设置卡片组件 ============

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ============ 主组件 ============

export function Settings() {
  const { showToast } = useToast();
  const [tradingMode, setTradingMode] = useState<TradingMode>('paper');
  const [saving, setSaving] = useState(false);
  const [confirmLiveMode, setConfirmLiveMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingApi, setTestingApi] = useState<string | null>(null);

  // API 密钥状态
  const [apiKeys, setApiKeys] = useState<ApiKeysState>({
    polymarket: { apiKey: '', secret: '' },
    binance: { apiKey: '', secret: '' },
    okx: { apiKey: '', secret: '', passphrase: '' },
    gateio: { apiKey: '', secret: '' },
  });

  // 通知设置
  const [notifications, setNotifications] = useState<NotificationState>({
    telegram: { enabled: false, botToken: '', chatId: '' },
    email: { enabled: false, address: '' },
  });

  // 风控设置
  const [risk, setRisk] = useState<RiskState>({
    maxPosition: 5000,
    stopLossPercent: 5,
    dailyLossLimit: 1000,
  });

  // 加载已有设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await client.get('/settings');
        const data = res.data;
        if (data.tradingMode) setTradingMode(data.tradingMode);
        if (data.apiKeys) setApiKeys(data.apiKeys);
        if (data.notifications) setNotifications(data.notifications);
        if (data.risk) setRisk(data.risk);
      } catch {
        // 后端不可用时使用默认值，不显示错误
        showToast('无法连接到服务器，使用本地默认设置', 'warning');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  // 保存设置
  const handleSave = async () => {
    // 表单验证
    if (tradingMode === 'live') {
      // 实盘模式需要检查API配置
      const hasApiKey = Object.values(apiKeys).some(
        (key) => key.apiKey && key.secret
      );
      if (!hasApiKey) {
        showToast('实盘交易模式需要至少配置一个交易所API', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      await client.put('/settings', {
        tradingMode,
        apiKeys,
        notifications,
        risk,
      });
      showToast('设置保存成功', 'success');
    } catch {
      // 如果后端不可用，只保存到本地状态
      showToast('无法连接到服务器，设置仅保存在本地', 'warning');
    } finally {
      setSaving(false);
    }
  };

  // 测试API连接
  const handleTestApi = async (exchange: string) => {
    setTestingApi(exchange);
    try {
      const keyData = apiKeys[exchange as keyof ApiKeysState];
      const res = await client.post(`/settings/test-api/${exchange}`, keyData);
      if (res.data.success) {
        showToast(`${exchange.toUpperCase()} API 连接成功`, 'success');
      } else {
        showToast(`${exchange.toUpperCase()} API 连接失败: ${res.data.message}`, 'error');
      }
    } catch {
      showToast(`${exchange.toUpperCase()} API 测试失败，请检查配置`, 'error');
    } finally {
      setTestingApi(null);
    }
  };

  // 测试通知
  const handleTestNotification = async (type: 'telegram' | 'email') => {
    try {
      if (type === 'telegram') {
        const telegramConfig = notifications.telegram;
        if (!telegramConfig.botToken || !telegramConfig.chatId) {
          showToast('请先配置 Telegram Bot Token 和 Chat ID', 'warning');
          return;
        }
        await client.post(`/settings/test-notification/${type}`, telegramConfig);
      } else {
        const emailConfig = notifications.email;
        if (!emailConfig.address) {
          showToast('请先配置邮箱地址', 'warning');
          return;
        }
        await client.post(`/settings/test-notification/${type}`, emailConfig);
      }
      showToast('测试通知已发送，请查收', 'success');
    } catch {
      showToast('测试通知发送失败，请检查配置', 'error');
    }
  };

  // 切换交易模式
  const handleTradingModeSwitch = (mode: TradingMode) => {
    if (mode === 'live' && tradingMode !== 'live') {
      setConfirmLiveMode(true);
      return;
    }
    setTradingMode(mode);
    showToast(`已切换到${mode === 'paper' ? '模拟' : '实盘'}交易模式`, 'info');
  };

  const confirmLiveSwitch = () => {
    setTradingMode('live');
    setConfirmLiveMode(false);
    showToast('已切换到实盘交易模式，请谨慎操作', 'warning');
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold text-white">系统设置</h1>
          <p className="text-sm text-gray-500 mt-1">管理 API 密钥、通知和风控参数</p>
        </div>
        <Loading text="加载设置中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">系统设置</h1>
          <p className="text-sm text-gray-500 mt-1">管理 API 密钥、通知和风控参数</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-medium rounded-xl hover:from-[#059669] hover:to-[#047857] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#10B981]/20"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              保存中...
            </span>
          ) : (
            '保存设置'
          )}
        </button>
      </div>

      {/* 交易模式 */}
      <SettingsCard title="交易模式" description="选择模拟交易或实盘交易">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleTradingModeSwitch('paper')}
            className={`flex-1 py-5 rounded-xl border-2 text-center transition-all ${
              tradingMode === 'paper'
                ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="text-3xl mb-2">🧪</div>
            <div className="text-sm font-semibold">模拟交易</div>
            <div className="text-xs mt-1 opacity-70">使用虚拟资金进行测试</div>
          </button>
          <button
            onClick={() => handleTradingModeSwitch('live')}
            className={`flex-1 py-5 rounded-xl border-2 text-center transition-all ${
              tradingMode === 'live'
                ? 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
                : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-sm font-semibold">实盘交易</div>
            <div className="text-xs mt-1 opacity-70">使用真实资金进行交易</div>
          </button>
        </div>

        {/* 实盘确认弹窗 */}
        {confirmLiveMode && (
          <div className="mt-4 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#EF4444] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm text-[#EF4444] font-medium">风险提示</p>
                <p className="text-sm text-[#EF4444]/80 mt-1">
                  切换到实盘交易模式将使用真实资金，存在真实资金风险。请确保已充分测试策略后再启用。
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setConfirmLiveMode(false)}
                className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmLiveSwitch}
                className="px-4 py-2 text-sm bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors"
              >
                确认切换到实盘
              </button>
            </div>
          </div>
        )}

        {tradingMode === 'live' && !confirmLiveMode && (
          <div className="mt-4 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-[#EF4444] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-[#EF4444]">
              当前为实盘交易模式，所有交易将使用真实资金执行。
            </p>
          </div>
        )}
      </SettingsCard>

      {/* API 密钥配置 */}
      <SettingsCard title="API 密钥配置" description="配置交易所 API 密钥以进行交易">
        {/* Binance */}
        <div className="mb-6 pb-6 border-b border-gray-700/50 last:border-0 last:pb-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-white">Binance</span>
            <Badge text="交易所" variant="warning" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecretInput
              label="API Key"
              placeholder="输入 Binance API Key"
              value={apiKeys.binance.apiKey}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, binance: { ...prev.binance, apiKey: v } }))}
              showTestButton
              onTest={() => handleTestApi('binance')}
              testing={testingApi === 'binance'}
            />
            <SecretInput
              label="Secret Key"
              placeholder="输入 Binance Secret Key"
              value={apiKeys.binance.secret}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, binance: { ...prev.binance, secret: v } }))}
            />
          </div>
        </div>

        {/* OKX */}
        <div className="mb-6 pb-6 border-b border-gray-700/50 last:border-0 last:pb-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-white">OKX</span>
            <Badge text="交易所" variant="warning" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SecretInput
              label="API Key"
              placeholder="输入 OKX API Key"
              value={apiKeys.okx.apiKey}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, okx: { ...prev.okx, apiKey: v } }))}
              showTestButton
              onTest={() => handleTestApi('okx')}
              testing={testingApi === 'okx'}
            />
            <SecretInput
              label="Secret Key"
              placeholder="输入 OKX Secret Key"
              value={apiKeys.okx.secret}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, okx: { ...prev.okx, secret: v } }))}
            />
            <SecretInput
              label="Passphrase"
              placeholder="输入 OKX Passphrase"
              value={apiKeys.okx.passphrase}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, okx: { ...prev.okx, passphrase: v } }))}
            />
          </div>
        </div>

        {/* Gate.io */}
        <div className="mb-6 pb-6 border-b border-gray-700/50 last:border-0 last:pb-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-white">Gate.io</span>
            <Badge text="交易所" variant="warning" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecretInput
              label="API Key"
              placeholder="输入 Gate.io API Key"
              value={apiKeys.gateio.apiKey}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, gateio: { ...prev.gateio, apiKey: v } }))}
              showTestButton
              onTest={() => handleTestApi('gateio')}
              testing={testingApi === 'gateio'}
            />
            <SecretInput
              label="Secret Key"
              placeholder="输入 Gate.io Secret Key"
              value={apiKeys.gateio.secret}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, gateio: { ...prev.gateio, secret: v } }))}
            />
          </div>
        </div>

        {/* Polymarket */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-white">Polymarket</span>
            <Badge text="预测市场" variant="info" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecretInput
              label="API Key"
              placeholder="输入 Polymarket API Key"
              value={apiKeys.polymarket.apiKey}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, polymarket: { ...prev.polymarket, apiKey: v } }))}
              showTestButton
              onTest={() => handleTestApi('polymarket')}
              testing={testingApi === 'polymarket'}
            />
            <SecretInput
              label="Secret"
              placeholder="输入 Polymarket Secret"
              value={apiKeys.polymarket.secret}
              onChange={(v) => setApiKeys((prev) => ({ ...prev, polymarket: { ...prev.polymarket, secret: v } }))}
            />
          </div>
        </div>
      </SettingsCard>

      {/* 通知设置 */}
      <SettingsCard title="通知设置" description="配置交易通知和告警">
        {/* Telegram */}
        <div className="mb-6 pb-6 border-b border-gray-700/50 last:border-0 last:pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-sm font-semibold text-white">Telegram 通知</span>
            </div>
            <button
              onClick={() => setNotifications((prev) => ({ ...prev, telegram: { ...prev.telegram, enabled: !prev.telegram.enabled } }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications.telegram.enabled ? 'bg-[#10B981]' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.telegram.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {notifications.telegram.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Bot Token"
                  value={notifications.telegram.botToken}
                  onChange={(e) => setNotifications((prev) => ({ ...prev, telegram: { ...prev.telegram, botToken: e.target.value } }))}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                />
                <input
                  type="text"
                  placeholder="Chat ID"
                  value={notifications.telegram.chatId}
                  onChange={(e) => setNotifications((prev) => ({ ...prev, telegram: { ...prev.telegram, chatId: e.target.value } }))}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                />
              </div>
              <button
                onClick={() => handleTestNotification('telegram')}
                className="px-4 py-2 text-sm bg-[#10B981]/10 text-[#10B981] rounded-lg hover:bg-[#10B981]/20 transition-colors"
              >
                发送测试消息
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold text-white">邮件通知</span>
            </div>
            <button
              onClick={() => setNotifications((prev) => ({ ...prev, email: { ...prev.email, enabled: !prev.email.enabled } }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications.email.enabled ? 'bg-[#10B981]' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.email.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {notifications.email.enabled && (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="邮箱地址"
                value={notifications.email.address}
                onChange={(e) => setNotifications((prev) => ({ ...prev, email: { ...prev.email, address: e.target.value } }))}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
              />
              <button
                onClick={() => handleTestNotification('email')}
                className="px-4 py-2 text-sm bg-[#10B981]/10 text-[#10B981] rounded-lg hover:bg-[#10B981]/20 transition-colors"
              >
                发送测试邮件
              </button>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* 风控设置 */}
      <SettingsCard title="风控设置" description="设置交易风险控制参数">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              最大仓位 (USDT)
            </label>
            <input
              type="number"
              value={risk.maxPosition}
              onChange={(e) => setRisk((prev) => ({ ...prev, maxPosition: Number(e.target.value) }))}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
              step="100"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">单笔交易最大投入金额</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              止损比例 (%)
            </label>
            <input
              type="number"
              value={risk.stopLossPercent}
              onChange={(e) => setRisk((prev) => ({ ...prev, stopLossPercent: Number(e.target.value) }))}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
              step="0.5"
              min="0"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">亏损达到此比例自动止损</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              每日亏损上限 (USDT)
            </label>
            <input
              type="number"
              value={risk.dailyLossLimit}
              onChange={(e) => setRisk((prev) => ({ ...prev, dailyLossLimit: Number(e.target.value) }))}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
              step="100"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">达到上限后停止当日交易</p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
