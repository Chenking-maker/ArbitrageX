# ============================================================
# 预测市场套利引擎
# 核心逻辑：
# 1. 监控 Polymarket 等预测市场的"是/否"合约
# 2. 检测 yes_price + no_price < 1.0 的套利机会
# 3. 计算套利利润 = 1.0 - (yes_price + no_price)
# 4. 利润 > 阈值时自动下单（同时买入yes和no）
# 5. 事件结算后自动获利
# ============================================================
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.engines.base import AbstractArbitrageEngine
from app.models.arbitrage_opportunity import ArbitrageOpportunity
from app.models.trade import StrategyType
from app.services.market_data import market_data_service
from app.services.order_executor import order_executor
from app.services.risk_manager import risk_manager
from app.services.notification import notification_service

logger = logging.getLogger(__name__)


class PredictionMarketEngine(AbstractArbitrageEngine):
    """预测市场套利引擎"""

    def __init__(self):
        self.settings = get_settings()
        self._latest_opportunities: list[dict[str, Any]] = []

    def get_name(self) -> str:
        return "prediction_market"

    def get_description(self) -> str:
        return "预测市场套利 - 利用 Yes/No 合约价差获利"

    async def scan(self) -> list[dict[str, Any]]:
        """
        扫描预测市场套利机会

        遍历所有活跃市场，找出 yes_price + no_price < threshold 的机会

        Returns:
            套利机会列表，每个包含 market, yes_price, no_price, spread, profit_rate
        """
        logger.info("开始扫描预测市场套利机会...")

        # 获取所有活跃市场
        markets = await market_data_service.fetch_polymarket_markets()
        opportunities = []

        # 计算手续费（Polymarket 约 0-2%）
        fee_rate = self.settings.FUNDING_RATE_FEE
        threshold = 1.0 - self.settings.MIN_ARBITRAGE_PROFIT - fee_rate

        for market in markets:
            yes_price = market.get("yes_price", 0)
            no_price = market.get("no_price", 0)
            total_cost = yes_price + no_price

            # 检查是否存在套利空间
            if total_cost < threshold:
                spread = 1.0 - total_cost
                profit_rate = spread - fee_rate

                if profit_rate > 0:
                    opportunity = {
                        "strategy_type": "prediction_market",
                        "market": market.get("question", ""),
                        "market_slug": market.get("market_slug", ""),
                        "condition_id": market.get("condition_id", ""),
                        "yes_price": yes_price,
                        "no_price": no_price,
                        "spread": spread,
                        "profit_rate": profit_rate,
                        "volume": market.get("volume", 0),
                        "end_date": market.get("end_date", ""),
                    }
                    opportunities.append(opportunity)

                    logger.info(
                        f"发现套利机会: {market.get('question', '')[:50]}... "
                        f"Yes={yes_price:.4f} No={no_price:.4f} "
                        f"利润率={profit_rate:.2%}"
                    )

        # 按利润率排序
        opportunities.sort(key=lambda x: x["profit_rate"], reverse=True)
        self._latest_opportunities = opportunities

        logger.info(f"扫描完成，发现 {len(opportunities)} 个套利机会")
        return opportunities

    async def execute(
        self,
        db: AsyncSession,
        user_id: int,
        opportunity: dict[str, Any],
        amount: float,
    ) -> dict[str, Any]:
        """
        执行预测市场套利交易

        同时买入 Yes 和 No 合约，锁定无风险利润

        Args:
            db: 数据库会话
            user_id: 用户ID
            opportunity: 套利机会
            amount: 交易金额

        Returns:
            交易结果
        """
        # 风控检查
        passed, reason = await risk_manager.validate_trade(
            db, user_id, amount, StrategyType.PREDICTION_MARKET
        )
        if not passed:
            return {"success": False, "reason": reason}

        # 执行交易
        trade = await order_executor.execute_prediction_arbitrage(
            db=db,
            user_id=user_id,
            market=opportunity["market"],
            yes_price=opportunity["yes_price"],
            no_price=opportunity["no_price"],
            amount=amount,
        )

        # 记录套利机会
        arb_record = ArbitrageOpportunity(
            strategy_type="prediction_market",
            market=opportunity["market"],
            yes_price=opportunity["yes_price"],
            no_price=opportunity["no_price"],
            spread=opportunity["spread"],
            profit_rate=opportunity["profit_rate"],
            is_executed=True,
            executed_amount=amount,
            details=f"trade_id={trade.id},market_slug={opportunity.get('market_slug', '')}",
        )
        db.add(arb_record)
        await db.commit()

        # 发送通知
        await notification_service.notify_trade_executed(
            strategy="prediction_market",
            market=opportunity["market"],
            direction="both",
            amount=amount,
            profit=trade.profit,
        )

        return {
            "success": True,
            "trade_id": trade.id,
            "profit": trade.profit,
            "profit_rate": opportunity["profit_rate"],
        }

    def get_latest_opportunities(self) -> list[dict[str, Any]]:
        """获取最近一次扫描的套利机会"""
        return self._latest_opportunities


# 全局引擎实例
prediction_market_engine = PredictionMarketEngine()
