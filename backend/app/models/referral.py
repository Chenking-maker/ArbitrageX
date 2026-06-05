# ============================================================
# 邀请分佣模型
# ============================================================
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Float, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReferralStatus(str, PyEnum):
    """邀请状态"""
    ACTIVE = "active"      # 有效
    INACTIVE = "inactive"  # 无效
    PAID = "paid"          # 已结算


class Referral(Base):
    """邀请关系表"""

    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    referrer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, comment="推荐人ID"
    )
    invitee_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, comment="被邀请人ID"
    )
    commission: Mapped[float] = mapped_column(Float, default=0.0, comment="累计佣金（USDT）")
    status: Mapped[str] = mapped_column(
        Enum(ReferralStatus), default=ReferralStatus.ACTIVE, comment="状态"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), comment="创建时间"
    )

    # 关系
    referrer: Mapped["User"] = relationship(
        foreign_keys=[referrer_id], back_populates="referrals_made"
    )
    invitee: Mapped["User"] = relationship(
        foreign_keys=[invitee_id], back_populates="referral_received"
    )
