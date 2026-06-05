/**
 * 格式化金额为美元
 */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, showSign = true): string {
  const prefix = showSign && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

/**
 * 格式化价格（预测市场 0-1）
 */
export function formatPrice(value: number): string {
  return value.toFixed(4);
}

/**
 * 格式化资金费率
 */
export function formatFundingRate(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${(value * 100).toFixed(4)}%`;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/**
 * 格式化日期（短格式）
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date().getTime();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatDateTime(dateStr);
}

/**
 * 截断文本
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 策略类型中文映射
 */
export function getStrategyLabel(type: string): string {
  const map: Record<string, string> = {
    prediction_arbitrage: '预测市场套利',
    funding_rate: '资金费率套利',
    ai_trend: 'AI趋势跟踪',
  };
  return map[type] || type;
}

/**
 * 交易方向中文映射
 */
export function getDirectionLabel(direction: string): string {
  const map: Record<string, string> = {
    buy: '买入',
    sell: '卖出',
    long: '做多',
    short: '做空',
  };
  return map[direction] || direction;
}

/**
 * 交易状态中文映射
 */
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    success: '成功',
    pending: '进行中',
    failed: '失败',
    settled: '已结算',
  };
  return map[status] || status;
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
