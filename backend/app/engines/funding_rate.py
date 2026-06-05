# ============================================================
# 资金费率套利引擎
# 核心逻辑：
# 1. 监控多个交易所的永续合约资金费率
# 2. 当费率为正且较高时：做多现货 + 做空永续合约
# 3. 收取资金费率作为收益
# 4. 当费率回归正常时平仓
# ============================================================
import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.engines.base import AbstractArbitrageEngine
from app.models.arbitrage_opportunity import ArbitrageOpportunity
from app.models.trade import Trade, StrategyType, TradeStatus
from app.services.market_data import market_data_service
from app.services.order_executor import order_executor
from app.services.risk_manager import risk_manager
from app.services.notification import notification_service

logger = logging.getLogger(__name__)


class FundingRateEngine(AbstractArbitrageEngine):
    """资金费率套利引擎"""

    def __init__(self):
        self.settings = get_settings()
        self._latest_rates: list[dict[str, Any]] = []

    def get_name(self) -> str:
        return "funding_rate"

    def get_description(self) -> str:
        return "资金费率套利 - 利用永续合约资金费率获利"

    async def scan(self) -> list[dict[str, Any]]:
        """
        扫描各交易所的资金费率

        Returns:
            高费率机会列表
        """
        logger.info("开始扫描资金费率...")

        opportunities = []

        # 获取 Binance 资金费率
        binance_rates = await market_data_service.fetch_binance_funding_rates()
        opportunities.extend(binance_rates)

        # 获取 OKX 资金费率
        okx_rates = await market_data_service.fetch_okx_funding_rates()
        opportunities.extend(okx_rates)

        # 过滤高费率机会
        high_rate_opportunities = []
        for rate in opportunities:
            fr = abs(rate.get("funding_rate", 0))
            if fr >= self.settings.FUNDING_RATE_THRESHOLD:
                # 计算年化收益率（每8小时收一次费）
                annualized = fr * 3 * 365 * 100
                rate["annualized_rate"] = annualized
                high_rate_opportunities.append(rate)

                logger.info(
                    f"高费率机会: {rate['exchange']} {rate['symbol']} "
                    f"费率={rate['funding_rate']:.6f} 年化={annualized:.1f}%"
                )

        # 按费率排序
        high_rate_opportunities.sort(
            key=lambda x: abs(x.get("funding_rate", 0)), reverse=True
        )
        self._latest_rates = high_rate_opportunities

        logger.info(f"扫描完成，发现 {len(high_rate_opportunities)} 个高费率机会")
        return high_rate_opportunities

    async def execute(
        self,
        db: AsyncSession,
        user_id: int,
        opportunity: dict[str, Any],
        amount: float,
    ) -> dict[str, Any]:
        """
        执行资金费率套利开仓

        做多现货 + 做空永续合约

        Args:
            db: 数据库会话
            user_id: 用户ID
            opportunity: 费率数据
            amount: 开仓金额

        Returns:
            交易结果
        """
        # 风控检查
        passed, reason = await risk_manager.validate_trade(
            db, user_id, amount, StrategyType.FUNDING_RATE
        )
        if not passed:
            return {"success": False, "reason": reason}

        symbol = opportunity.get("symbol", "")
        funding_rate = opportunity.get("funding_rate", 0)

        # 执行开仓
        trade = await order_executor.execute_funding_rate_open(
            db=db,
            user_id=user_id,
            symbol=symbol,
            amount=amount,
            funding_rate=funding_rate,
        )

        # 记录套利机会
        arb_record = ArbitrageOpportunity(
            strategy_type="funding_rate",
            market=symbol,
            spread=funding_rate,
            profit_rate=funding_rate * 3 * 365,  # 年化
            is_executed=True,
            executed_amount=amount,
            exchange=opportunity.get("exchange", ""),
            symbol=symbol,
            funding_rate=funding_rate,
            details=f"trade_id={trade.id}",
        )
        db.add(arb_record)
        await db.commit()

        # 发送通知
        await notification_service.notify_trade_executed(
            strategy="funding_rate",
            market=symbol,
            direction="both (spot long + futures short)",
            amount=amount,
        )

        return {
            "success": True,
            "trade_id": trade.id,
            "symbol": symbol,
            "funding_rate": funding_rate,
            "annualized_rate": funding_rate * 3 * 365 * 100,
        }

    async def close_position(
        self,
        db: AsyncSession,
        user_id: int,
        trade_id: int,
    ) -> dict[str, Any]:
        """
        平仓资金费率套利头寸

        Args:
            db: 数据库会话
            user_id: 用户ID
            trade_id: 交易ID

        Returns:
            平仓结果
        """
        # 查询交易记录
        result = await db.execute(
            select(Trade).where(
                Trade.id == trade_id,
                Trade.user_id == user_id,
                Trade.status == TradeStatus.OPEN,
            )
        )
        trade = result.scalar_one_or_none()

        if trade is None:
            return {"success": False, "reason": "交易不存在或已平仓"}

        # 获取当前资金费率
        rates = await market_data_service.fetch_binance_funding_rates()
        current_rate = 0.0
        for r in rates:
            if r["symbol"] == trade.market:
                current_rate = r["funding_rate"]
                break

        # 执行平仓
        updated_trade = await order_executor.execute_funding_rate_close(
            db=db, trade=trade, close_price=current_rate
        )

        # 发送通知
        await notification_service.notify_trade_executed(
            strategy="funding_rate",
            market=trade.market,
            direction="close",
            amount=trade.amount,
            profit=updated_trade.profit,
        )

        return {
            "success": True,
            "trade_id": updated_trade.id,
            "profit": updated_trade.profit,
            "close_rate": current_rate,
        }

    def get_latest_rates(self) -> list[dict[str, Any]]:
        """获取最近一次扫描的费率数据"""
        return self._latest_rates


# 全局引擎实例
funding_rate_engine = FundingRateEngine()
