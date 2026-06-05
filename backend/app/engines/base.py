# ============================================================
# 套利引擎基类
# 定义所有套利引擎的通用接口
# ============================================================
import logging
from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class AbstractArbitrageEngine(ABC):
    """套利引擎抽象基类"""

    @abstractmethod
    async def scan(self) -> list[dict[str, Any]]:
        """
        扫描套利机会

        Returns:
            发现的套利机会列表
        """
        raise NotImplementedError

    @abstractmethod
    async def execute(
        self,
        db: AsyncSession,
        user_id: int,
        opportunity: dict[str, Any],
        amount: float,
    ) -> dict[str, Any]:
        """
        执行套利交易

        Args:
            db: 数据库会话
            user_id: 用户ID
            opportunity: 套利机会数据
            amount: 交易金额

        Returns:
            交易结果
        """
        raise NotImplementedError

    @abstractmethod
    def get_name(self) -> str:
        """获取引擎名称"""
        raise NotImplementedError

    @abstractmethod
    def get_description(self) -> str:
        """获取引擎描述"""
        raise NotImplementedError
