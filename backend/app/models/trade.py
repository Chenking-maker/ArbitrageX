# ============================================================
# 交易记录模型
# ============================================================
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Float, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StrategyType(str, PyEnum):
    """交易策略类型"""
    PREDICTION_MARKET = "prediction_market"  # 预测市场套利
    FUNDING_RATE = "funding_rate"            # 资金费率套利
    TREND_FOLLOWING = "trend_following"      # AI趋势跟踪


class TradeStatus(str, PyEnum):
    """交易状态"""
    PENDING = "pending"      # 待执行
    OPEN = "open"            # 持仓中
    CLOSED = "closed"        # 已平仓
    FAILED = "failed"        # 失败
    CANCELLED = "cancelled"  # 已取消


class Direction(str, PyEnum):
    """交易方向"""
    LONG = "long"    # 做多
    SHORT = "short"  # 做空
    BOTH = "both"   # 双向（套利）


class Trade(Base):
    """交易记录表"""

    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    strategy_type: Mapped[str] = mapped_column(
        Enum(StrategyType), nullable=False, comment="策略类型"
    )
    market: Mapped[str] = mapped_column(String(100), nullable=False, comment="市场/标的")
    direction: Mapped[str] = mapped_column(
        Enum(Direction), nullable=False, comment="交易方向"
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False, comment="交易金额（USDT）")
    price: Mapped[float] = mapped_column(Float, nullable=False, comment="成交价格")
    profit: Mapped[float] = mapped_column(Float, default=0.0, comment="利润（USDT）")
    status: Mapped[str] = mapped_column(
        Enum(TradeStatus), default=TradeStatus.PENDING, comment="交易状态"
    )
    details: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="交易详情JSON")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), comment="创建时间"
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="平仓时间"
    )

    # 关系
    user: Mapped["User"] = relationship(back_populates="trades")
