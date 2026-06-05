# ============================================================
# 用户相关 Schema
# ============================================================
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """用户注册请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=6, max_length=100, description="密码")
    referral_code: Optional[str] = Field(None, description="推荐人邀请码")


class UserLogin(BaseModel):
    """用户登录请求"""
    username: str = Field(..., description="用户名或邮箱")
    password: str = Field(..., description="密码")


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    username: str
    email: Optional[str] = None
    referral_code: str
    balance: float
    commission_balance: float
    avatar: Optional[str] = None
    login_method: str = "email"
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """令牌响应"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ReferralCodeResponse(BaseModel):
    """邀请码响应"""
    referral_code: str
    referral_link: str


class ReferralStats(BaseModel):
    """邀请统计"""
    total_referrals: int = Field(0, description="邀请总人数")
    total_commission: float = Field(0.0, description="累计佣金")
    active_referrals: int = Field(0, description="有效邀请人数")
    commission_balance: float = Field(0.0, description="可提现佣金余额")


class ReferralLeaderboardItem(BaseModel):
    """邀请排行榜项"""
    username: str
    total_referrals: int
    total_commission: float
