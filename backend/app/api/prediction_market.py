# ============================================================
# 预测市场套利 API
# ============================================================
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.database import get_db
from app.engines.prediction_market import prediction_market_engine
from app.models.user import User
from app.schemas.arbitrage import ArbitrageOpportunityResponse, PredictionMarketInfo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prediction", tags=["预测市场套利"])


@router.get("/opportunities", response_model=list[ArbitrageOpportunityResponse], summary="当前套利机会")
async def get_opportunities(
    user: User = Depends(get_current_user),
):
    """
    获取当前发现的预测市场套利机会

    返回最近一次扫描的结果，按利润率排序
    """
    opportunities = prediction_market_engine.get_latest_opportunities()
    return [ArbitrageOpportunityResponse(**opp) for opp in opportunities]


@router.get("/markets", response_model=list[PredictionMarketInfo], summary="所有活跃市场")
async def get_markets(
    user: User = Depends(get_current_user),
):
    """获取所有活跃的预测市场信息"""
    from app.services.market_data import market_data_service

    markets = await market_data_service.fetch_polymarket_markets()
    return [PredictionMarketInfo(**m) for m in markets]


@router.post("/scan", response_model=list[ArbitrageOpportunityResponse], summary="手动触发扫描")
async def trigger_scan(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    手动触发预测市场套利扫描

    扫描所有活跃市场，返回发现的套利机会
    """
    opportunities = await prediction_market_engine.scan()

    # 保存到数据库
    from app.models.arbitrage_opportunity import ArbitrageOpportunity

    for opp in opportunities:
        record = ArbitrageOpportunity(
            strategy_type="prediction_market",
            market=opp["market"],
            yes_price=opp["yes_price"],
            no_price=opp["no_price"],
            spread=opp["spread"],
            profit_rate=opp["profit_rate"],
            details=f"slug={opp.get('market_slug', '')}",
        )
        db.add(record)

    await db.commit()

    return [ArbitrageOpportunityResponse(**opp) for opp in opportunities]
