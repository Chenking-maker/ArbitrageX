import { useState, useEffect } from 'react';
import client from '../api/client';

interface DataSourceStatus {
  name: string;
  connected: boolean;
  lastUpdate?: string;
}

const DEFAULT_SOURCES: DataSourceStatus[] = [
  { name: 'Binance API', connected: false },
  { name: 'OKX API', connected: false },
  { name: 'Gate.io API', connected: false },
  { name: 'Polymarket API', connected: false },
];

export function ConnectionStatus() {
  const [sources, setSources] = useState<DataSourceStatus[]>(DEFAULT_SOURCES);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await client.get<{ sources: DataSourceStatus[] }>('/status/connections');
      if (res.data.sources) {
        setSources(res.data.sources);
      }
      setLastCheck(new Date().toLocaleTimeString('zh-CN'));
    } catch {
      setSources(DEFAULT_SOURCES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">数据源状态</h3>
        {lastCheck && (
          <span className="text-xs text-gray-500">{lastCheck} 检查</span>
        )}
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-emerald-primary bg-emerald-primary/10 rounded-lg hover:bg-emerald-primary/20 transition-colors border border-emerald-primary/20 disabled:opacity-50"
        >
          {loading ? '检查中...' : '刷新'}
        </button>
      </div>

      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.name} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  source.connected
                    ? 'bg-emerald-primary shadow-sm shadow-emerald-primary/50'
                    : 'bg-danger shadow-sm shadow-danger/50'
                }`}
              />
              <span className="text-sm text-gray-300">{source.name}</span>
            </div>
            <span className={`text-xs font-medium ${source.connected ? 'text-emerald-primary' : 'text-danger'}`}>
              {source.connected ? '已连接' : '未连接'}
            </span>
          </div>
        ))}
      </div>

      {sources.every((s) => !s.connected) && !loading && (
        <div className="mt-4 p-3 bg-gold/10 border border-gold/20 rounded-lg text-sm text-gold">
          所有数据源均未连接，请在设置中配置 API 密钥。
        </div>
      )}
    </div>
  );
}
