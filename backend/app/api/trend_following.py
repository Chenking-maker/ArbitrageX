# ============================================================
# AI 趋势跟踪 API
# ============================================================
import logging

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.engines.trend_following import trend_following_engine
from app.models.user import User
from app.schemas.arbitrage import TrendSignal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trend", tags=["AI趋势跟踪"])


@router.get("/signals", response_model=list[TrendSignal], summary="AI趋势信号")
async def get_trend_signals(
    user: User = Depends(get_current_user),
):
    """
    获取 AI 趋势跟踪信号

    返回基于技术指标分析的交易信号
    """
    signals = trend_following_engine.get_latest_signals()

    if not signals:
        # 如果没有缓存数据，触发一次扫描
        signals = await trend_following_engine.scan()

    return [TrendSignal(**s) for s in signals]
