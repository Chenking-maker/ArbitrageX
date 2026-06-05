# ============================================================
# 通知服务
# 支持邮件和 Telegram 通知
# ============================================================
import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class NotificationService:
    """通知服务"""

    def __init__(self):
        self.settings = get_settings()

    async def send_telegram(self, message: str) -> bool:
        """
        发送 Telegram 通知

        Args:
            message: 消息内容

        Returns:
            是否发送成功
        """
        if not self.settings.TELEGRAM_BOT_TOKEN or not self.settings.TELEGRAM_CHAT_ID:
            logger.debug("Telegram 未配置，跳过通知")
            return False

        try:
            url = f"https://api.telegram.org/bot{self.settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            payload = {
                "chat_id": self.settings.TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "Markdown",
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()

            logger.info("Telegram 通知发送成功")
            return True

        except httpx.HTTPError as e:
            logger.error(f"Telegram 通知发送失败: {e}")
            return False

    async def notify_arbitrage_opportunity(
        self,
        strategy: str,
        market: str,
        profit_rate: float,
        details: dict[str, Any] | None = None,
    ):
        """通知发现套利机会"""
        message = (
            f"*{self._get_emoji(strategy)} 套利机会发现*\n\n"
            f"策略: `{strategy}`\n"
            f"市场: `{market}`\n"
            f"预期利润率: `{profit_rate:.2%}`\n"
        )

        if details:
            for k, v in details.items():
                message += f"{k}: `{v}`\n"

        message += f"\n模式: `{'模拟' if self.settings.PAPER_TRADING else '实盘'}`"

        await self.send_telegram(message)

    async def notify_trade_executed(
        self,
        strategy: str,
        market: str,
        direction: str,
        amount: float,
        profit: float | None = None,
    ):
        """通知交易执行"""
        message = (
            f"*{self._get_emoji(strategy)} 交易执行*\n\n"
            f"策略: `{strategy}`\n"
            f"市场: `{market}`\n"
            f"方向: `{direction}`\n"
            f"金额: `{amount:.2f} USDT`\n"
        )

        if profit is not None:
            message += f"利润: `{profit:.4f} USDT`\n"

        await self.send_telegram(message)

    async def notify_error(self, error: str, context: str = ""):
        """通知错误"""
        message = f"*错误通知*\n\n{error}"
        if context:
            message += f"\n上下文: `{context}`"
        await self.send_telegram(message)

    @staticmethod
    def _get_emoji(strategy: str) -> str:
        """获取策略对应的 emoji"""
        mapping = {
            "prediction_market": "Prediction",
            "funding_rate": "Funding",
            "trend_following": "Trend",
        }
        return mapping.get(strategy, "Trade")


# 全局服务实例
notification_service = NotificationService()
