# ============================================================
# 套利机会记录模型
# ============================================================
from datetime import datetime, timezone

from sqlalchemy import Float, String, Integer, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ArbitrageOpportunity(Base):
    """套利机会记录表"""

    __tablename__ = "arbitrage_opportunities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    strategy_type: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="策略类型"
    )
    market: Mapped[str] = mapped_column(String(200), nullable=False, comment="市场名称")
    yes_price: Mapped[float] = mapped_column(Float, nullable=True, comment="Yes合约价格")
    no_price: Mapped[float] = mapped_column(Float, nullable=True, comment="No合约价格")
    spread: Mapped[float] = mapped_column(Float, nullable=False, comment="价差/利润")
    profit_rate: Mapped[float] = mapped_column(Float, nullable=False, comment="利润率")
    is_executed: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否已执行")
    executed_amount: Mapped[float] = mapped_column(Float, default=0.0, comment="执行金额")
    realized_profit: Mapped[float] = mapped_column(Float, default=0.0, comment="实际利润")
    exchange: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="交易所")
    symbol: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="交易对")
    funding_rate: Mapped[float | None] = mapped_column(Float, nullable=True, comment="资金费率")
    details: Mapped[str | None] = mapped_column(String(1000), nullable=True, comment="详情JSON")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), comment="发现时间"
    )
