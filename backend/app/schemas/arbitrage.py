# ============================================================
# 套利机会 Schema
# ============================================================
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ArbitrageOpportunityResponse(BaseModel):
    """套利机会响应"""
    id: Optional[int] = None
    strategy_type: str
    market: str
    yes_price: Optional[float] = None
    no_price: Optional[float] = None
    spread: float
    profit_rate: float
    exchange: Optional[str] = None
    symbol: Optional[str] = None
    funding_rate: Optional[float] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PredictionMarketInfo(BaseModel):
    """预测市场信息"""
    question: str
    market_slug: str
    yes_price: float
    no_price: float
    spread: float
    volume: Optional[float] = None
    end_date: Optional[str] = None


class FundingRateInfo(BaseModel):
    """资金费率信息"""
    exchange: str
    symbol: str
    funding_rate: float
    next_funding_time: Optional[str] = None
    predicted_rate: Optional[float] = None
    annualized_rate: Optional[float] = None


class TrendSignal(BaseModel):
    """趋势信号"""
    symbol: str
    direction: str = Field(..., description="信号方向：buy/sell/hold")
    strength: float = Field(..., description="信号强度 0-100")
    strategy: str = Field(..., description="使用的策略")
    indicators: dict = Field(default_factory=dict, description="指标详情")
    timestamp: Optional[str] = None
