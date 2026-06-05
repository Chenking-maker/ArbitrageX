# ============================================================
# 风控管理服务
# 管理最大仓位、止损、日亏损限制等风控规则
# ============================================================
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.trade import Trade, TradeStatus, StrategyType

logger = logging.getLogger(__name__)


class RiskManager:
    """风控管理服务"""

    def __init__(self):
        self.settings = get_settings()

    async def check_position_limit(
        self, db: AsyncSession, user_id: int, strategy_type: StrategyType | None = None
    ) -> bool:
        """
        检查用户持仓数量是否超过限制

        Args:
            db: 数据库会话
            user_id: 用户ID
            strategy_type: 策略类型（可选，不指定则检查所有策略）

        Returns:
            True 表示可以开仓，False 表示已达上限
        """
        query = select(func.count()).select_from(Trade).where(
            Trade.user_id == user_id,
            Trade.status == TradeStatus.OPEN,
        )
        if strategy_type:
            query = query.where(Trade.strategy_type == strategy_type)

        result = await db.execute(query)
        count = result.scalar() or 0

        if count >= self.settings.MAX_OPEN_POSITIONS:
            logger.warning(f"用户 {user_id} 持仓数量已达上限: {count}")
            return False

        return True

    async def check_amount_limit(self, amount: float) -> bool:
        """
        检查单笔交易金额是否超过限制

        Args:
            amount: 交易金额

        Returns:
            True 表示金额合规
        """
        if amount > self.settings.MAX_POSITION_SIZE:
            logger.warning(f"交易金额 {amount} 超过限制 {self.settings.MAX_POSITION_SIZE}")
            return False
        return True

    async def check_daily_loss_limit(
        self, db: AsyncSession, user_id: int, max_daily_loss: float = 100.0
    ) -> bool:
        """
        检查用户当日亏损是否超过限制

        Args:
            db: 数据库会话
            user_id: 用户ID
            max_daily_loss: 最大日亏损金额

        Returns:
            True 表示未超过限制
        """
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        query = select(func.coalesce(func.sum(Trade.profit), 0)).where(
            Trade.user_id == user_id,
            Trade.status == TradeStatus.CLOSED,
            Trade.closed_at >= today_start,
        )

        result = await db.execute(query)
        daily_profit = result.scalar() or 0

        if daily_profit < -max_daily_loss:
            logger.warning(
                f"用户 {user_id} 当日亏损 {daily_profit} 已超过限制 {max_daily_loss}"
            )
            return False

        return True

    async def check_balance_sufficient(
        self, db: AsyncSession, user_id: int, amount: float
    ) -> bool:
        """
        检查用户余额是否充足

        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 需要的金额

        Returns:
            True 表示余额充足
        """
        from app.models.user import User

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user is None or user.balance < amount:
            logger.warning(f"用户 {user_id} 余额不足: 需要 {amount}")
            return False

        return True

    async def validate_trade(
        self,
        db: AsyncSession,
        user_id: int,
        amount: float,
        strategy_type: StrategyType | None = None,
    ) -> tuple[bool, str]:
        """
        综合风控检查

        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 交易金额
            strategy_type: 策略类型

        Returns:
            (是否通过, 失败原因)
        """
        # 检查金额限制
        if not await self.check_amount_limit(amount):
            return False, f"交易金额超过限制（最大 {self.settings.MAX_POSITION_SIZE} USDT）"

        # 检查持仓数量
        if not await self.check_position_limit(db, user_id, strategy_type):
            return False, f"持仓数量已达上限（最大 {self.settings.MAX_OPEN_POSITIONS} 笔）"

        # 检查余额
        if not await self.check_balance_sufficient(db, user_id, amount):
            return False, "账户余额不足"

        # 检查日亏损限制
        if not await self.check_daily_loss_limit(db, user_id):
            return False, "当日亏损已达上限，请明日再试"

        return True, ""


# 全局服务实例
risk_manager = RiskManager()
