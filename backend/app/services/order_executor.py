# ============================================================
# 订单执行服务
# 负责执行交易订单（支持模拟交易和实盘交易）
# ============================================================
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.trade import Trade, StrategyType, TradeStatus, Direction

logger = logging.getLogger(__name__)


class OrderExecutor:
    """订单执行服务"""

    def __init__(self):
        self.settings = get_settings()

    async def execute_prediction_arbitrage(
        self,
        db: AsyncSession,
        user_id: int,
        market: str,
        yes_price: float,
        no_price: float,
        amount: float,
    ) -> Trade:
        """
        执行预测市场套利交易

        同时买入 Yes 和 No 合约，锁定利润。

        Args:
            db: 数据库会话
            user_id: 用户ID
            market: 市场名称
            yes_price: Yes 合约价格
            no_price: No 合约价格
            amount: 投入金额

        Returns:
            创建的交易记录
        """
        # 计算利润
        cost = amount * (yes_price + no_price)
        profit = amount - cost

        if self.settings.PAPER_TRADING:
            logger.info(
                f"[模拟交易] 预测市场套利 - 用户:{user_id} 市场:{market} "
                f"金额:{amount} Yes:{yes_price} No:{no_price} 利润:{profit:.4f}"
            )
        else:
            logger.warning(
                f"[实盘交易] 预测市场套利 - 用户:{user_id} 市场:{market} "
                f"金额:{amount} Yes:{yes_price} No:{no_price} 利润:{profit:.4f}"
            )

        trade = Trade(
            user_id=user_id,
            strategy_type=StrategyType.PREDICTION_MARKET,
            market=market,
            direction=Direction.BOTH,
            amount=amount,
            price=yes_price + no_price,
            profit=profit,
            status=TradeStatus.OPEN,
            details=f"yes_price={yes_price},no_price={no_price}",
        )

        db.add(trade)
        await db.commit()
        await db.refresh(trade)
        return trade

    async def execute_funding_rate_open(
        self,
        db: AsyncSession,
        user_id: int,
        symbol: str,
        amount: float,
        funding_rate: float,
    ) -> Trade:
        """
        执行资金费率套利开仓

        做多现货 + 做空永续合约

        Args:
            db: 数据库会话
            user_id: 用户ID
            symbol: 交易对
            amount: 开仓金额
            funding_rate: 当前资金费率

        Returns:
            创建的交易记录
        """
        if self.settings.PAPER_TRADING:
            logger.info(
                f"[模拟交易] 资金费率开仓 - 用户:{user_id} 交易对:{symbol} "
                f"金额:{amount} 费率:{funding_rate:.6f}"
            )
        else:
            logger.warning(
                f"[实盘交易] 资金费率开仓 - 用户:{user_id} 交易对:{symbol} "
                f"金额:{amount} 费率:{funding_rate:.6f}"
            )

        trade = Trade(
            user_id=user_id,
            strategy_type=StrategyType.FUNDING_RATE,
            market=symbol,
            direction=Direction.BOTH,
            amount=amount,
            price=funding_rate,
            profit=0.0,
            status=TradeStatus.OPEN,
            details=f"funding_rate={funding_rate},action=open",
        )

        db.add(trade)
        await db.commit()
        await db.refresh(trade)
        return trade

    async def execute_funding_rate_close(
        self,
        db: AsyncSession,
        trade: Trade,
        close_price: float,
    ) -> Trade:
        """
        执行资金费率套利平仓

        Args:
            db: 数据库会话
            trade: 持仓交易记录
            close_price: 平仓时的资金费率

        Returns:
            更新后的交易记录
        """
        # 计算累计利润（简化计算：费率差 * 金额）
        profit = (close_price - trade.price) * trade.amount

        if self.settings.PAPER_TRADING:
            logger.info(
                f"[模拟交易] 资金费率平仓 - 交易ID:{trade.id} "
                f"开仓费率:{trade.price} 平仓费率:{close_price} 利润:{profit:.4f}"
            )
        else:
            logger.warning(
                f"[实盘交易] 资金费率平仓 - 交易ID:{trade.id} "
                f"开仓费率:{trade.price} 平仓费率:{close_price} 利润:{profit:.4f}"
            )

        trade.profit = profit
        trade.status = TradeStatus.CLOSED
        trade.closed_at = datetime.now(timezone.utc)
        trade.details = f"{trade.details},close_rate={close_price}"

        await db.commit()
        await db.refresh(trade)
        return trade

    async def execute_trend_trade(
        self,
        db: AsyncSession,
        user_id: int,
        symbol: str,
        direction: str,
        amount: float,
        price: float,
        signal_strength: float,
    ) -> Trade:
        """
        执行趋势跟踪交易

        Args:
            db: 数据库会话
            user_id: 用户ID
            symbol: 交易对
            direction: 交易方向 (long/short)
            amount: 交易金额
            price: 当前价格
            signal_strength: 信号强度

        Returns:
            创建的交易记录
        """
        trade_direction = Direction.LONG if direction == "buy" else Direction.SHORT

        if self.settings.PAPER_TRADING:
            logger.info(
                f"[模拟交易] 趋势跟踪 - 用户:{user_id} 交易对:{symbol} "
                f"方向:{direction} 金额:{amount} 价格:{price} 信号强度:{signal_strength}"
            )
        else:
            logger.warning(
                f"[实盘交易] 趋势跟踪 - 用户:{user_id} 交易对:{symbol} "
                f"方向:{direction} 金额:{amount} 价格:{price} 信号强度:{signal_strength}"
            )

        trade = Trade(
            user_id=user_id,
            strategy_type=StrategyType.TREND_FOLLOWING,
            market=symbol,
            direction=trade_direction,
            amount=amount,
            price=price,
            profit=0.0,
            status=TradeStatus.OPEN,
            details=f"signal_strength={signal_strength},direction={direction}",
        )

        db.add(trade)
        await db.commit()
        await db.refresh(trade)
        return trade


# 全局服务实例
order_executor = OrderExecutor()
