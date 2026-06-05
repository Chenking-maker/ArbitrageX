# ============================================================
# 市场数据获取服务
# 统一管理各交易所/市场的数据获取
# 对接真实公开 API，无需 API Key
# ============================================================
import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# 全局异步 HTTP 客户端
_http_client: httpx.AsyncClient | None = None


async def get_http_client() -> httpx.AsyncClient:
    """获取全局 HTTP 客户端单例"""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=30.0)
    return _http_client


async def close_http_client():
    """关闭全局 HTTP 客户端"""
    global _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None


# ---- 主流币种列表 ----
MAIN_SYMBOLS = {
    "BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "AVAX", "DOT", "LINK", "MATIC",
}

# ---- 数据缓存 ----
_funding_rate_cache: list[dict[str, Any]] = []
_funding_rate_last_update: float = 0.0

_prediction_market_cache: list[dict[str, Any]] = []
_prediction_market_last_update: float = 0.0

# ---- 数据源连接状态 ----
_data_source_status: dict[str, dict[str, Any]] = {
    "binance": {"connected": False, "last_success": None, "last_error": None},
    "okx": {"connected": False, "last_success": None, "last_error": None},
    "gateio": {"connected": False, "last_success": None, "last_error": None},
    "polymarket": {"connected": False, "last_success": None, "last_error": None},
}


def _update_source_status(source: str, success: bool, error: str | None = None):
    """更新数据源连接状态"""
    _data_source_status[source]["connected"] = success
    _data_source_status[source]["last_success"] = (
        datetime.now(timezone.utc).isoformat() if success else None
    )
    if error:
        _data_source_status[source]["last_error"] = error


def get_data_source_status() -> dict[str, dict[str, Any]]:
    """获取所有数据源的连接状态"""
    return _data_source_status


class MarketDataService:
    """市场数据获取服务"""

    def __init__(self):
        self.settings = get_settings()

    # ============================================================
    # 资金费率 - Binance（公开接口，无需 API Key）
    # ============================================================

    async def fetch_binance_funding_rates(self) -> list[dict[str, Any]]:
        """
        获取 Binance 永续合约资金费率

        API: GET https://fapi.binance.com/fapi/v1/premiumIndex
        公开接口，无需 API Key
        """
        try:
            client = await get_http_client()
            url = f"{self.settings.BINANCE_FUTURES_URL}/fapi/v1/premiumIndex"
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            # 过滤主流币对
            main_symbols_usdt = {f"{s}USDT" for s in MAIN_SYMBOLS}
            result = []
            for item in data:
                symbol = item.get("symbol", "")
                if symbol in main_symbols_usdt:
                    funding_rate = float(item.get("lastFundingRate", 0) or 0)
                    mark_price = float(item.get("markPrice", 0) or 0)
                    next_funding_time_ms = int(item.get("nextFundingTime", 0))

                    # 计算年化费率（资金费率每8小时收取一次，一天3次）
                    annualized_rate = funding_rate * 3 * 365

                    result.append({
                        "exchange": "binance",
                        "symbol": symbol.replace("USDT", "/USDT"),
                        "funding_rate": funding_rate,
                        "next_funding_time": next_funding_time_ms,
                        "next_funding_time_str": (
                            datetime.fromtimestamp(
                                next_funding_time_ms / 1000, tz=timezone.utc
                            ).isoformat()
                            if next_funding_time_ms else ""
                        ),
                        "mark_price": mark_price,
                        "annualized_rate": round(annualized_rate, 6),
                    })

            _update_source_status("binance", True)
            logger.info(f"Binance 资金费率获取成功，共 {len(result)} 个币对")
            return result

        except httpx.HTTPError as e:
            _update_source_status("binance", False, str(e))
            logger.error(f"获取 Binance 资金费率失败: {e}")
            return []
        except Exception as e:
            _update_source_status("binance", False, str(e))
            logger.error(f"Binance 资金费率解析失败: {e}")
            return []

    # ============================================================
    # 资金费率 - OKX（公开接口，无需 API Key）
    # ============================================================

    async def fetch_okx_funding_rates(self) -> list[dict[str, Any]]:
        """
        获取 OKX 永续合约资金费率

        API: GET https://www.okx.com/api/v5/public/funding-rate
        公开接口，无需 API Key
        """
        try:
            client = await get_http_client()
            url = f"{self.settings.OKX_API_URL}/api/v5/public/funding-rate"

            # 构造主流币种的 instId
            main_inst_ids = [f"{s}-USDT-SWAP" for s in MAIN_SYMBOLS]

            result = []
            for inst_id in main_inst_ids:
                try:
                    params = {"instId": inst_id}
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()

                    if data.get("code") == "0" and data.get("data"):
                        item = data["data"][0]
                        funding_rate = float(item.get("fundingRate", 0) or 0)
                        next_funding_time_ms = int(item.get("fundingTime", 0))

                        # 计算年化费率
                        annualized_rate = funding_rate * 3 * 365

                        result.append({
                            "exchange": "okx",
                            "symbol": inst_id.replace("-USDT-SWAP", "/USDT"),
                            "funding_rate": funding_rate,
                            "next_funding_time": next_funding_time_ms,
                            "next_funding_time_str": (
                                datetime.fromtimestamp(
                                    next_funding_time_ms / 1000, tz=timezone.utc
                                ).isoformat()
                                if next_funding_time_ms else ""
                            ),
                            "mark_price": 0,  # OKX 此接口不返回标记价格
                            "annualized_rate": round(annualized_rate, 6),
                        })
                except Exception as e:
                    logger.warning(f"OKX 获取 {inst_id} 资金费率失败: {e}")
                    continue

            _update_source_status("okx", True)
            logger.info(f"OKX 资金费率获取成功，共 {len(result)} 个币对")
            return result

        except httpx.HTTPError as e:
            _update_source_status("okx", False, str(e))
            logger.error(f"获取 OKX 资金费率失败: {e}")
            return []

    # ============================================================
    # 资金费率 - Gate.io（公开接口，无需 API Key）
    # ============================================================

    async def fetch_gateio_funding_rates(self) -> list[dict[str, Any]]:
        """
        获取 Gate.io 永续合约资金费率

        API: GET https://api.gateio.ws/api/v4/futures/usdt/contracts
        公开接口，无需 API Key
        """
        try:
            client = await get_http_client()
            url = f"{self.settings.GATEIO_API_URL}/api/v4/futures/usdt/contracts"
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            # 过滤主流币对
            main_symbols_gate = {f"{s}_USDT" for s in MAIN_SYMBOLS}
            result = []
            for item in data:
                name = item.get("name", "")
                if name in main_symbols_gate:
                    funding_rate = float(item.get("funding_rate", 0) or 0)
                    mark_price = float(item.get("mark_price", 0) or 0)
                    funding_interval = int(item.get("funding_interval", 28800))  # 默认8小时

                    # 计算年化费率
                    periods_per_day = 86400 / funding_interval if funding_interval > 0 else 3
                    annualized_rate = funding_rate * periods_per_day * 365

                    result.append({
                        "exchange": "gateio",
                        "symbol": name.replace("_", "/"),
                        "funding_rate": funding_rate,
                        "next_funding_time": 0,  # Gate.io 此接口不返回下次费率时间
                        "next_funding_time_str": "",
                        "mark_price": mark_price,
                        "annualized_rate": round(annualized_rate, 6),
                    })

            _update_source_status("gateio", True)
            logger.info(f"Gate.io 资金费率获取成功，共 {len(result)} 个币对")
            return result

        except httpx.HTTPError as e:
            _update_source_status("gateio", False, str(e))
            logger.error(f"获取 Gate.io 资金费率失败: {e}")
            return []
        except Exception as e:
            _update_source_status("gateio", False, str(e))
            logger.error(f"Gate.io 资金费率解析失败: {e}")
            return []

    # ============================================================
    # 获取所有交易所的资金费率（统一格式）
    # ============================================================

    async def fetch_all_funding_rates(self) -> list[dict[str, Any]]:
        """
        并行获取所有交易所的资金费率

        返回统一格式：
        exchange, symbol, funding_rate, next_funding_time,
        next_funding_time_str, mark_price, annualized_rate
        """
        # 并行请求三个交易所
        results = await asyncio.gather(
            self.fetch_binance_funding_rates(),
            self.fetch_okx_funding_rates(),
            self.fetch_gateio_funding_rates(),
        )

        all_rates = []
        for rates in results:
            all_rates.extend(rates)

        # 按年化费率绝对值排序（最高的排前面）
        all_rates.sort(key=lambda x: abs(x.get("annualized_rate", 0)), reverse=True)

        return all_rates

    # ============================================================
    # 预测市场 - Polymarket（公开接口，无需 API Key）
    # ============================================================

    async def fetch_polymarket_markets(self) -> list[dict[str, Any]]:
        """
        获取 Polymarket 活跃市场列表

        API: GET https://gamma-api.polymarket.com/markets
        公开接口，无需 API Key

        计算 yes_price + no_price，找出套利机会
        """
        try:
            client = await get_http_client()
            url = f"{self.settings.POLYMARKET_GAMMA_URL}/markets"
            params = {
                "closed": "false",
                "active": "true",
                "limit": 100,
            }
            response = await client.get(url, params=params)
            response.raise_for_status()
            markets = response.json()

            result = []
            for m in markets:
                try:
                    # 解析 outcomePrices: "[0.65,0.35]" 格式
                    prices_str = m.get("outcomePrices", "[0,0]")
                    prices_str = prices_str.strip("[]")
                    price_parts = prices_str.split(",")

                    if len(price_parts) < 2:
                        continue

                    yes_price = float(price_parts[0])
                    no_price = float(price_parts[1])
                    total = yes_price + no_price

                    # 套利机会：yes + no < 1 时存在无风险套利
                    spread = round(1.0 - total, 4)

                    result.append({
                        "question": m.get("question", ""),
                        "market_slug": m.get("slug", ""),
                        "condition_id": m.get("conditionId", ""),
                        "yes_price": yes_price,
                        "no_price": no_price,
                        "total_price": round(total, 4),
                        "spread": spread,
                        "arbitrage": spread > 0.01,  # 价差超过1%视为套利机会
                        "volume": float(m.get("volume", 0) or 0),
                        "end_date": m.get("endDate", ""),
                    })
                except (ValueError, IndexError, TypeError) as e:
                    continue

            # 按套利空间排序
            result.sort(key=lambda x: x.get("spread", 0), reverse=True)

            _update_source_status("polymarket", True)
            logger.info(f"Polymarket 市场获取成功，共 {len(result)} 个市场")
            return result

        except httpx.HTTPError as e:
            _update_source_status("polymarket", False, str(e))
            logger.error(f"获取 Polymarket 市场数据失败: {e}")
            return []
        except Exception as e:
            _update_source_status("polymarket", False, str(e))
            logger.error(f"Polymarket 市场数据解析失败: {e}")
            return []

    # ============================================================
    # K线数据 - Binance（公开接口，无需 API Key）
    # ============================================================

    async def fetch_klines(
        self, symbol: str, interval: str = "1h", limit: int = 100
    ) -> list[dict[str, Any]]:
        """
        获取 K 线数据（用于趋势分析）

        API: GET https://api.binance.com/api/v3/klines
        公开接口，无需 API Key

        Args:
            symbol: 交易对，如 BTCUSDT
            interval: K线周期（1m/5m/15m/1h/4h/1d 等）
            limit: 数据条数（最大1000）

        Returns:
            K线数据列表
        """
        try:
            client = await get_http_client()
            url = f"{self.settings.BINANCE_SPOT_URL}/api/v3/klines"
            params = {"symbol": symbol, "interval": interval, "limit": limit}
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            result = []
            for item in data:
                result.append({
                    "open_time": int(item[0]),
                    "open": float(item[1]),
                    "high": float(item[2]),
                    "low": float(item[3]),
                    "close": float(item[4]),
                    "volume": float(item[5]),
                    "close_time": int(item[6]),
                    "quote_volume": float(item[7]),
                    "trades": int(item[8]),
                })

            return result

        except httpx.HTTPError as e:
            logger.error(f"获取 K 线数据失败 ({symbol}): {e}")
            return []
        except Exception as e:
            logger.error(f"K 线数据解析失败 ({symbol}): {e}")
            return []

    # ============================================================
    # 自动刷新（带缓存）
    # ============================================================

    async def get_funding_rates(self, force_refresh: bool = False) -> list[dict[str, Any]]:
        """
        获取资金费率（带缓存）

        每 FUNDING_RATE_REFRESH_INTERVAL 秒自动刷新一次
        """
        global _funding_rate_cache, _funding_rate_last_update

        now = time.time()
        interval = self.settings.FUNDING_RATE_REFRESH_INTERVAL

        if force_refresh or (now - _funding_rate_last_update) >= interval:
            _funding_rate_cache = await self.fetch_all_funding_rates()
            _funding_rate_last_update = now

        return _funding_rate_cache

    async def get_prediction_markets(self, force_refresh: bool = False) -> list[dict[str, Any]]:
        """
        获取预测市场数据（带缓存）

        每 PREDICTION_MARKET_REFRESH_INTERVAL 秒自动刷新一次
        """
        global _prediction_market_cache, _prediction_market_last_update

        now = time.time()
        interval = self.settings.PREDICTION_MARKET_REFRESH_INTERVAL

        if force_refresh or (now - _prediction_market_last_update) >= interval:
            _prediction_market_cache = await self.fetch_polymarket_markets()
            _prediction_market_last_update = now

        return _prediction_market_cache

    def get_cache_info(self) -> dict[str, Any]:
        """获取缓存状态信息"""
        return {
            "funding_rate": {
                "count": len(_funding_rate_cache),
                "last_update": (
                    datetime.fromtimestamp(
                        _funding_rate_last_update, tz=timezone.utc
                    ).isoformat()
                    if _funding_rate_last_update else None
                ),
                "refresh_interval": self.settings.FUNDING_RATE_REFRESH_INTERVAL,
            },
            "prediction_market": {
                "count": len(_prediction_market_cache),
                "last_update": (
                    datetime.fromtimestamp(
                        _prediction_market_last_update, tz=timezone.utc
                    ).isoformat()
                    if _prediction_market_last_update else None
                ),
                "refresh_interval": self.settings.PREDICTION_MARKET_REFRESH_INTERVAL,
            },
        }


# 全局服务实例
market_data_service = MarketDataService()
