# ============================================================
# 交易记录 API
# ============================================================
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.trade import Trade, TradeStatus, StrategyType
from app.models.user import User
from app.schemas.trade import TradeResponse, TradeStats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trades", tags=["交易记录"])


@router.get("", response_model=list[TradeResponse], summary="交易记录")
async def get_trades(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    strategy: Optional[str] = Query(None, description="策略类型过滤"),
    status: Optional[str] = Query(None, description="状态过滤"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的交易记录（分页）
    """
    query = select(Trade).where(Trade.user_id == user.id)

    # 策略过滤
    if strategy:
        query = query.where(Trade.strategy_type == strategy)

    # 状态过滤
    if status:
        query = query.where(Trade.status == status)

    # 按时间倒序
    query = query.order_by(Trade.created_at.desc())

    # 分页
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    trades = result.scalars().all()

    return [TradeResponse.model_validate(t) for t in trades]


@router.get("/stats", response_model=TradeStats, summary="交易统计")
async def get_trade_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的交易统计数据

    包括总交易次数、总利润、胜率、平均利润等
    """
    # 总交易次数
    result = await db.execute(
        select(func.count()).select_from(Trade).where(Trade.user_id == user.id)
    )
    total_trades = result.scalar() or 0

    # 总利润
    result = await db.execute(
        select(func.coalesce(func.sum(Trade.profit), 0)).where(Trade.user_id == user.id)
    )
    total_profit = result.scalar() or 0

    # 盈利交易次数
    result = await db.execute(
        select(func.count()).select_from(Trade).where(
            Trade.user_id == user.id,
            Trade.profit > 0,
        )
    )
    win_trades = result.scalar() or 0

    # 胜率
    win_rate = (win_trades / total_trades * 100) if total_trades > 0 else 0

    # 平均利润
    avg_profit = (total_profit / total_trades) if total_trades > 0 else 0

    # 当前持仓数
    result = await db.execute(
        select(func.count()).select_from(Trade).where(
            Trade.user_id == user.id,
            Trade.status == TradeStatus.OPEN,
        )
    )
    open_positions = result.scalar() or 0

    # 各策略交易次数
    result = await db.execute(
        select(func.count()).select_from(Trade).where(
            Trade.user_id == user.id,
            Trade.strategy_type == StrategyType.PREDICTION_MARKET,
        )
    )
    prediction_market_trades = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Trade).where(
            Trade.user_id == user.id,
            Trade.strategy_type == StrategyType.FUNDING_RATE,
        )
    )
    funding_rate_trades = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Trade).where(
            Trade.user_id == user.id,
            Trade.strategy_type == StrategyType.TREND_FOLLOWING,
        )
    )
    trend_following_trades = result.scalar() or 0

    return TradeStats(
        total_trades=total_trades,
        total_profit=total_profit,
        win_rate=win_rate,
        avg_profit=avg_profit,
        open_positions=open_positions,
        prediction_market_trades=prediction_market_trades,
        funding_rate_trades=funding_rate_trades,
        trend_following_trades=trend_following_trades,
    )
