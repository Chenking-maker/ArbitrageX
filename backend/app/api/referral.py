# ============================================================
# 邀请分佣 API
# ============================================================
import logging

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models.referral import Referral
from app.models.user import User
from app.schemas.user import ReferralLeaderboardItem

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/referral", tags=["邀请分佣"])


@router.get("/leaderboard", response_model=list[ReferralLeaderboardItem], summary="邀请排行榜")
async def get_leaderboard(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """
    获取邀请排行榜

    按邀请人数排序，返回前 N 名
    """
    # 查询每个用户的邀请人数和总佣金
    query = (
        select(
            User.username,
            func.count(Referral.id).label("total_referrals"),
            func.coalesce(func.sum(Referral.commission), 0).label("total_commission"),
        )
        .join(Referral, Referral.referrer_id == User.id)
        .group_by(User.id, User.username)
        .order_by(func.count(Referral.id).desc())
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        ReferralLeaderboardItem(
            username=row.username,
            total_referrals=row.total_referrals,
            total_commission=row.total_commission,
        )
        for row in rows
    ]


@router.get("/commissions", summary="佣金记录")
async def get_commissions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的佣金记录

    返回所有由被邀请人交易产生的佣金记录
    """
    query = (
        select(Referral)
        .where(Referral.referrer_id == user.id)
        .order_by(Referral.created_at.desc())
    )

    result = await db.execute(query)
    referrals = result.scalars().all()

    return [
        {
            "id": r.id,
            "invitee_id": r.invitee_id,
            "commission": r.commission,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in referrals
    ]
