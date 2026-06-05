# ============================================================
# 用户模型
# 支持邮箱、GitHub、微信三种登录方式
# ============================================================
import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """用户表"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="用户名")
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=True, comment="邮箱（OAuth登录用户可为空）")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True, comment="密码哈希（OAuth登录用户可为空）")
    referral_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, default=lambda: uuid.uuid4().hex[:8],
        comment="唯一邀请码"
    )
    referred_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, comment="推荐人ID"
    )
    balance: Mapped[float] = mapped_column(Float, default=0.0, comment="账户余额（USDT）")
    commission_balance: Mapped[float] = mapped_column(
        Float, default=0.0, comment="佣金余额（USDT）"
    )

    # ---- OAuth 相关字段 ----
    github_id: Mapped[int | None] = mapped_column(
        Integer, unique=True, nullable=True, comment="GitHub 用户ID"
    )
    wechat_openid: Mapped[str | None] = mapped_column(
        String(128), unique=True, nullable=True, comment="微信 OpenID"
    )
    avatar: Mapped[str | None] = mapped_column(
        String(500), nullable=True, comment="头像 URL"
    )
    login_method: Mapped[str] = mapped_column(
        String(20), nullable=False, default="email",
        comment="登录方式: email / github / wechat"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), comment="创建时间"
    )

    # 关系
    trades: Mapped[list["Trade"]] = relationship(back_populates="user", lazy="selectin")
    referrals_made: Mapped[list["Referral"]] = relationship(
        foreign_keys="[Referral.referrer_id]", back_populates="referrer", lazy="selectin"
    )
    referral_received: Mapped[list["Referral"]] = relationship(
        foreign_keys="[Referral.invitee_id]", back_populates="invitee", lazy="selectin"
    )
