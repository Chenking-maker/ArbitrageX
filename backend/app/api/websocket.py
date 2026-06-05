# ============================================================
# WebSocket 实时推送
# 推送真实市场数据：资金费率、套利机会、交易通知
# ============================================================
import asyncio
import json
import logging
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import get_settings
from app.services.market_data import market_data_service

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # 活跃连接集合
        self.active_connections: Set[WebSocket] = set()
        # 后台推送任务
        self._push_task: asyncio.Task | None = None
        self._running: bool = False

    async def connect(self, websocket: WebSocket):
        """接受新的 WebSocket 连接"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket 连接建立，当前连接数: {len(self.active_connections)}")

        # 如果是第一个连接，启动后台推送任务
        if len(self.active_connections) == 1:
            self.start_push_task()

    def disconnect(self, websocket: WebSocket):
        """断开 WebSocket 连接"""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket 连接断开，当前连接数: {len(self.active_connections)}")

        # 如果没有连接了，停止后台推送任务
        if len(self.active_connections) == 0:
            self.stop_push_task()

    async def broadcast(self, message: dict):
        """
        广播消息给所有连接

        Args:
            message: 要广播的消息字典
        """
        if not self.active_connections:
            return

        data = json.dumps(message, ensure_ascii=False, default=str)
        disconnected = set()

        for connection in self.active_connections:
            try:
                await connection.send_text(data)
            except Exception:
                disconnected.add(connection)

        # 清理断开的连接
        for conn in disconnected:
            self.disconnect(conn)

    def start_push_task(self):
        """启动后台数据推送任务"""
        if self._push_task is None or self._push_task.done():
            self._running = True
            self._push_task = asyncio.create_task(self._push_loop())
            logger.info("WebSocket 后台推送任务已启动")

    def stop_push_task(self):
        """停止后台数据推送任务"""
        self._running = False
        if self._push_task and not self._push_task.done():
            self._push_task.cancel()
            self._push_task = None
            logger.info("WebSocket 后台推送任务已停止")

    async def _push_loop(self):
        """
        后台推送循环

        - 每60秒推送最新资金费率
        - 每5分钟推送最新套利机会
        """
        settings = get_settings()
        funding_rate_interval = settings.FUNDING_RATE_REFRESH_INTERVAL
        prediction_market_interval = settings.PREDICTION_MARKET_REFRESH_INTERVAL

        # 计数器
        funding_rate_counter = 0
        prediction_market_counter = 0

        try:
            while self._running and self.active_connections:
                await asyncio.sleep(1)  # 每秒检查一次
                funding_rate_counter += 1
                prediction_market_counter += 1

                # 每60秒推送资金费率
                if funding_rate_counter >= funding_rate_interval:
                    funding_rate_counter = 0
                    try:
                        rates = await market_data_service.get_funding_rates(force_refresh=True)
                        if rates:
                            await self.broadcast({
                                "type": "funding_rate",
                                "data": rates,
                                "count": len(rates),
                            })
                    except Exception as e:
                        logger.error(f"推送资金费率失败: {e}")

                # 每5分钟推送套利机会
                if prediction_market_counter >= prediction_market_interval:
                    prediction_market_counter = 0
                    try:
                        markets = await market_data_service.get_prediction_markets(
                            force_refresh=True
                        )
                        # 只推送有套利机会的市场
                        arbitrage_opportunities = [
                            m for m in markets if m.get("arbitrage", False)
                        ]
                        if arbitrage_opportunities:
                            await self.broadcast({
                                "type": "arbitrage",
                                "data": arbitrage_opportunities,
                                "count": len(arbitrage_opportunities),
                            })
                    except Exception as e:
                        logger.error(f"推送套利机会失败: {e}")

        except asyncio.CancelledError:
            logger.info("WebSocket 推送任务被取消")
        except Exception as e:
            logger.error(f"WebSocket 推送循环异常: {e}")


# 全局连接管理器
manager = ConnectionManager()


@router.websocket("/api/ws/realtime")
async def websocket_realtime(websocket: WebSocket):
    """
    WebSocket 实时数据推送端点

    连接后可接收以下类型的实时消息：
    - funding_rate: 资金费率更新（每60秒）
    - arbitrage: 套利机会（每5分钟）
    - trade: 交易执行通知（事件触发）
    """
    await manager.connect(websocket)

    try:
        # 连接建立后，立即推送一次当前缓存数据
        try:
            # 推送当前资金费率
            rates = await market_data_service.get_funding_rates()
            if rates:
                await websocket.send_text(json.dumps({
                    "type": "funding_rate",
                    "data": rates,
                    "count": len(rates),
                }, ensure_ascii=False, default=str))

            # 推送当前套利机会
            markets = await market_data_service.get_prediction_markets()
            arbitrage_opportunities = [
                m for m in markets if m.get("arbitrage", False)
            ]
            if arbitrage_opportunities:
                await websocket.send_text(json.dumps({
                    "type": "arbitrage",
                    "data": arbitrage_opportunities,
                    "count": len(arbitrage_opportunities),
                }, ensure_ascii=False, default=str))
        except Exception as e:
            logger.warning(f"初始数据推送失败: {e}")

        # 保持连接，接收客户端消息（心跳等）
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type", "")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg_type == "subscribe":
                    # 订阅特定频道（预留扩展）
                    channels = message.get("channels", [])
                    await websocket.send_text(
                        json.dumps({
                            "type": "subscribed",
                            "channels": channels,
                        })
                    )

            except json.JSONDecodeError:
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "无效的 JSON 格式"})
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket 异常: {e}")
        manager.disconnect(websocket)


async def broadcast_arbitrage_opportunity(opportunity: dict):
    """广播套利机会"""
    await manager.broadcast({
        "type": "arbitrage",
        "data": opportunity,
    })


async def broadcast_trade_executed(trade_info: dict):
    """广播交易执行通知"""
    await manager.broadcast({
        "type": "trade",
        "data": trade_info,
    })


async def broadcast_funding_rate_update(rates: list):
    """广播资金费率更新"""
    await manager.broadcast({
        "type": "funding_rate",
        "data": rates,
    })


async def broadcast_trend_signal(signals: list):
    """广播趋势信号更新"""
    await manager.broadcast({
        "type": "trade",
        "data": signals,
    })
