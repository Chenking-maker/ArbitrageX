# ============================================================
# 定时任务调度器
# 使用 APScheduler 管理定期扫描任务
# ============================================================
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import get_settings
from app.engines.prediction_market import prediction_market_engine
from app.engines.funding_rate import funding_rate_engine
from app.engines.trend_following import trend_following_engine
from app.services.notification import notification_service
from app.api.websocket import (
    broadcast_arbitrage_opportunity,
    broadcast_funding_rate_update,
    broadcast_trend_signal,
)

logger = logging.getLogger(__name__)

# 全局调度器实例
scheduler = AsyncIOScheduler()


async def scan_prediction_markets():
    """定时扫描预测市场套利机会"""
    logger.info("定时任务: 扫描预测市场套利机会")
    try:
        opportunities = await prediction_market_engine.scan()

        if opportunities:
            # 广播通知
            for opp in opportunities[:5]:  # 只广播前5个最佳机会
                await broadcast_arbitrage_opportunity(opp)
                await notification_service.notify_arbitrage_opportunity(
                    strategy="prediction_market",
                    market=opp["market"],
                    profit_rate=opp["profit_rate"],
                    details={
                        "yes_price": opp["yes_price"],
                        "no_price": opp["no_price"],
                    },
                )

    except Exception as e:
        logger.error(f"预测市场扫描任务失败: {e}")
        await notification_service.notify_error(
            f"预测市场扫描失败: {e}", "scheduler"
        )


async def scan_funding_rates():
    """定时扫描资金费率"""
    logger.info("定时任务: 扫描资金费率")
    try:
        rates = await funding_rate_engine.scan()

        if rates:
            await broadcast_funding_rate_update(rates)

            # 通知高费率机会
            settings = get_settings()
            for r in rates[:3]:
                if abs(r["funding_rate"]) > settings.FUNDING_RATE_THRESHOLD * 2:
                    await notification_service.notify_arbitrage_opportunity(
                        strategy="funding_rate",
                        market=r["symbol"],
                        profit_rate=r["funding_rate"] * 3 * 365,
                        details={
                            "exchange": r["exchange"],
                            "funding_rate": r["funding_rate"],
                        },
                    )

    except Exception as e:
        logger.error(f"资金费率扫描任务失败: {e}")
        await notification_service.notify_error(
            f"资金费率扫描失败: {e}", "scheduler"
        )


async def scan_trend_signals():
    """定时扫描趋势信号"""
    logger.info("定时任务: 扫描趋势信号")
    try:
        signals = await trend_following_engine.scan()

        if signals:
            await broadcast_trend_signal(signals)

    except Exception as e:
        logger.error(f"趋势信号扫描任务失败: {e}")
        await notification_service.notify_error(
            f"趋势信号扫描失败: {e}", "scheduler"
        )


def setup_scheduler():
    """
    配置并启动定时任务调度器

    - 预测市场扫描: 每 5 分钟
    - 资金费率扫描: 每 1 分钟
    - 趋势信号扫描: 每 15 分钟
    """
    # 预测市场套利扫描（每5分钟）
    scheduler.add_job(
        scan_prediction_markets,
        trigger=IntervalTrigger(minutes=5),
        id="scan_prediction_markets",
        name="预测市场套利扫描",
        replace_existing=True,
    )

    # 资金费率扫描（每1分钟）
    scheduler.add_job(
        scan_funding_rates,
        trigger=IntervalTrigger(minutes=1),
        id="scan_funding_rates",
        name="资金费率扫描",
        replace_existing=True,
    )

    # 趋势信号扫描（每15分钟）
    scheduler.add_job(
        scan_trend_signals,
        trigger=IntervalTrigger(minutes=15),
        id="scan_trend_signals",
        name="趋势信号扫描",
        replace_existing=True,
    )

    logger.info("定时任务调度器配置完成")
    scheduler.start()
    logger.info("定时任务调度器已启动")
