# ============================================================
# 资金费率套利 API
# ============================================================
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.engines.funding_rate import funding_rate_engine
from app.models.user import User
from app.schemas.arbitrage import FundingRateInfo
from app.schemas.trade import FundingRateOpenRequest, FundingRateCloseRequest, TradeResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/funding-rate", tags=["资金费率套利"])


@router.get("/rates", response_model=list[FundingRateInfo], summary="当前资金费率")
async def get_funding_rates(
    user: User = Depends(get_current_user),
):
    """
    获取各交易所当前的资金费率

    返回 Binance 和 OKX 的主流币对资金费率
    """
    rates = funding_rate_engine.get_latest_rates()

    if not rates:
        # 如果没有缓存数据，触发一次扫描
        rates = await funding_rate_engine.scan()

    return [FundingRateInfo(**r) for r in rates]


@router.post("/open", response_model=TradeResponse, summary="开仓")
async def open_position(
    request: FundingRateOpenRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    资金费率套利开仓

    做多现货 + 做空永续合约
    """
    # 获取最新费率数据
    rates = await funding_rate_engine.scan()
    opportunity = None
    for r in rates:
        if r["symbol"] == request.symbol.replace("/", ""):
            opportunity = r
            break

    if opportunity is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"未找到 {request.symbol} 的费率数据")

    result = await funding_rate_engine.execute(
        db=db,
        user_id=user.id,
        opportunity=opportunity,
        amount=request.amount,
    )

    if not result["success"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=result["reason"])

    # 查询交易记录
    from app.models.trade import Trade
    from sqlalchemy import select
    trade_result = await db.execute(select(Trade).where(Trade.id == result["trade_id"]))
    trade = trade_result.scalar_one()

    return TradeResponse.model_validate(trade)


@router.post("/close", response_model=TradeResponse, summary="平仓")
async def close_position(
    request: FundingRateCloseRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    资金费率套利平仓

    关闭指定的持仓
    """
    result = await funding_rate_engine.close_position(
        db=db,
        user_id=user.id,
        trade_id=request.trade_id,
    )

    if not result["success"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=result["reason"])

    # 查询更新后的交易记录
    from app.models.trade import Trade
    from sqlalchemy import select
    trade_result = await db.execute(select(Trade).where(Trade.id == result["trade_id"]))
    trade = trade_result.scalar_one()

    return TradeResponse.model_validate(trade)
