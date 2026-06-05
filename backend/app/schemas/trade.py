# ============================================================
# 交易相关 Schema
# ============================================================
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TradeCreate(BaseModel):
    """创建交易请求"""
    strategy_type: str = Field(..., description="策略类型")
    market: str = Field(..., description="市场/标的")
    direction: str = Field(..., description="交易方向")
    amount: float = Field(..., gt=0, description="交易金额")


class TradeResponse(BaseModel):
    """交易记录响应"""
    id: int
    user_id: int
    strategy_type: str
    market: str
    direction: str
    amount: float
    price: float
    profit: float
    status: str
    details: Optional[str] = None
    created_at: datetime
    closed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TradeStats(BaseModel):
    """交易统计"""
    total_trades: int = Field(0, description="总交易次数")
    total_profit: float = Field(0.0, description="总利润")
    win_rate: float = Field(0.0, description="胜率")
    avg_profit: float = Field(0.0, description="平均利润")
    open_positions: int = Field(0, description="当前持仓数")
    prediction_market_trades: int = Field(0, description="预测市场交易次数")
    funding_rate_trades: int = Field(0, description="资金费率交易次数")
    trend_following_trades: int = Field(0, description="趋势跟踪交易次数")


class FundingRateOpenRequest(BaseModel):
    """资金费率开仓请求"""
    symbol: str = Field(..., description="交易对，如 BTC/USDT")
    amount: float = Field(..., gt=0, description="开仓金额")


class FundingRateCloseRequest(BaseModel):
    """资金费率平仓请求"""
    trade_id: int = Field(..., description="交易ID")
