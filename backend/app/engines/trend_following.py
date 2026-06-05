# ============================================================
# AI 趋势跟踪引擎
# 核心逻辑：
# 1. 收集价格数据（K线）
# 2. 计算技术指标（MA, RSI, MACD）
# 3. AI模型判断趋势方向
# 4. 生成买入/卖出信号
# ============================================================
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.engines.base import AbstractArbitrageEngine
from app.models.trade import StrategyType
from app.services.market_data import market_data_service
from app.services.order_executor import order_executor
from app.services.risk_manager import risk_manager
from app.services.notification import notification_service

logger = logging.getLogger(__name__)


class TrendFollowingEngine(AbstractArbitrageEngine):
    """AI 趋势跟踪引擎"""

    def __init__(self):
        self.settings = get_settings()
        self._latest_signals: list[dict[str, Any]] = []
        # 监控的交易对
        self._watch_symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]

    def get_name(self) -> str:
        return "trend_following"

    def get_description(self) -> str:
        return "AI 趋势跟踪 - 基于技术指标的趋势交易"

    async def scan(self) -> list[dict[str, Any]]:
        """
        扫描所有监控交易对的趋势信号

        Returns:
            趋势信号列表
        """
        logger.info("开始扫描趋势信号...")

        signals = []

        for symbol in self._watch_symbols:
            try:
                signal = await self._analyze_symbol(symbol)
                if signal:
                    signals.append(signal)
            except Exception as e:
                logger.error(f"分析 {symbol} 趋势失败: {e}")

        self._latest_signals = signals
        logger.info(f"趋势扫描完成，生成 {len(signals)} 个信号")
        return signals

    async def _analyze_symbol(self, symbol: str) -> dict[str, Any] | None:
        """
        分析单个交易对的趋势

        Args:
            symbol: 交易对

        Returns:
            趋势信号或 None
        """
        # 获取 K 线数据
        klines = await market_data_service.fetch_klines(symbol, "1h", 100)
        if len(klines) < 50:
            logger.warning(f"{symbol} K线数据不足: {len(klines)}")
            return None

        closes = [k["close"] for k in klines]

        # 计算技术指标
        ma_short = self._calculate_ma(closes, 7)
        ma_mid = self._calculate_ma(closes, 25)
        ma_long = self._calculate_ma(closes, 50)
        rsi = self._calculate_rsi(closes, 14)
        macd, macd_signal, macd_hist = self._calculate_macd(closes)

        # 生成信号
        direction, strength = self._generate_signal(
            ma_short, ma_mid, ma_long, rsi, macd_hist
        )

        if direction == "hold":
            return None

        signal = {
            "strategy_type": "trend_following",
            "symbol": symbol,
            "direction": direction,
            "strength": strength,
            "current_price": closes[-1],
            "indicators": {
                "ma_7": round(ma_short, 2),
                "ma_25": round(ma_mid, 2),
                "ma_50": round(ma_long, 2),
                "rsi_14": round(rsi, 2),
                "macd": round(macd, 4),
                "macd_signal": round(macd_signal, 4),
                "macd_hist": round(macd_hist, 4),
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(
            f"趋势信号: {symbol} 方向={direction} 强度={strength:.1f} "
            f"RSI={rsi:.1f} MACD_H={macd_hist:.4f}"
        )

        return signal

    @staticmethod
    def _calculate_ma(prices: list[float], period: int) -> float:
        """计算移动平均线"""
        if len(prices) < period:
            return prices[-1]
        return sum(prices[-period:]) / period

    @staticmethod
    def _calculate_rsi(prices: list[float], period: int = 14) -> float:
        """
        计算 RSI（相对强弱指标）

        Args:
            prices: 收盘价列表
            period: RSI 周期

        Returns:
            RSI 值（0-100）
        """
        if len(prices) < period + 1:
            return 50.0

        gains = []
        losses = []

        for i in range(len(prices) - period, len(prices)):
            change = prices[i] - prices[i - 1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))

        avg_gain = sum(gains) / period if gains else 0
        avg_loss = sum(losses) / period if losses else 0.0001

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    @staticmethod
    def _calculate_macd(
        prices: list[float], fast: int = 12, slow: int = 26, signal_period: int = 9
    ) -> tuple[float, float, float]:
        """
        计算 MACD 指标

        Returns:
            (MACD线, 信号线, 柱状图)
        """
        if len(prices) < slow + signal_period:
            return 0.0, 0.0, 0.0

        # 计算 EMA
        def ema(data: list[float], period: int) -> list[float]:
            if len(data) < period:
                return [sum(data) / len(data)] * len(data)

            result = []
            multiplier = 2 / (period + 1)

            # 初始值使用 SMA
            initial = sum(data[:period]) / period
            result.extend([0] * (period - 1))
            result.append(initial)

            for i in range(period, len(data)):
                val = (data[i] - result[-1]) * multiplier + result[-1]
                result.append(val)

            return result

        ema_fast = ema(prices, fast)
        ema_slow = ema(prices, slow)

        # MACD 线
        macd_line = [f - s for f, s in zip(ema_fast, ema_slow)]

        # 信号线
        signal_line = ema(macd_line, signal_period)

        # 柱状图
        macd_hist = macd_line[-1] - signal_line[-1]

        return macd_line[-1], signal_line[-1], macd_hist

    @staticmethod
    def _generate_signal(
        ma_short: float,
        ma_mid: float,
        ma_long: float,
        rsi: float,
        macd_hist: float,
    ) -> tuple[str, float]:
        """
        综合技术指标生成交易信号

        Returns:
            (方向, 强度) 方向为 buy/sell/hold，强度为 0-100
        """
        score = 0
        reasons = []

        # MA 交叉判断
        if ma_short > ma_mid > ma_long:
            score += 30  # 多头排列
            reasons.append("多头排列")
        elif ma_short < ma_mid < ma_long:
            score -= 30  # 空头排列
            reasons.append("空头排列")

        # 短期 MA 与中期 MA 交叉
        if ma_short > ma_mid:
            score += 10
        else:
            score -= 10

        # RSI 判断
        if rsi < 30:
            score += 20  # 超卖
            reasons.append("RSI超卖")
        elif rsi > 70:
            score -= 20  # 超买
            reasons.append("RSI超买")
        elif 40 < rsi < 60:
            score += 5  # 中性偏多

        # MACD 柱状图
        if macd_hist > 0:
            score += 15
        else:
            score -= 15

        # 确定方向
        if score >= 20:
            direction = "buy"
            strength = min(abs(score), 100)
        elif score <= -20:
            direction = "sell"
            strength = min(abs(score), 100)
        else:
            direction = "hold"
            strength = 0

        return direction, strength

    async def execute(
        self,
        db: AsyncSession,
        user_id: int,
        opportunity: dict[str, Any],
        amount: float,
    ) -> dict[str, Any]:
        """
        执行趋势跟踪交易

        Args:
            db: 数据库会话
            user_id: 用户ID
            opportunity: 趋势信号
            amount: 交易金额

        Returns:
            交易结果
        """
        # 风控检查
        passed, reason = await risk_manager.validate_trade(
            db, user_id, amount, StrategyType.TREND_FOLLOWING
        )
        if not passed:
            return {"success": False, "reason": reason}

        symbol = opportunity.get("symbol", "")
        direction = opportunity.get("direction", "buy")
        price = opportunity.get("current_price", 0)
        strength = opportunity.get("strength", 0)

        # 执行交易
        trade = await order_executor.execute_trend_trade(
            db=db,
            user_id=user_id,
            symbol=symbol,
            direction=direction,
            amount=amount,
            price=price,
            signal_strength=strength,
        )

        # 发送通知
        await notification_service.notify_trade_executed(
            strategy="trend_following",
            market=symbol,
            direction=direction,
            amount=amount,
        )

        return {
            "success": True,
            "trade_id": trade.id,
            "symbol": symbol,
            "direction": direction,
            "strength": strength,
        }

    def get_latest_signals(self) -> list[dict[str, Any]]:
        """获取最近一次扫描的趋势信号"""
        return self._latest_signals


# 全局引擎实例
trend_following_engine = TrendFollowingEngine()
