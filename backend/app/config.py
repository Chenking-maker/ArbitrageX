# ============================================================
# ArbitrageX 配置管理
# 使用 pydantic-settings 管理环境变量配置
# ============================================================
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，从 .env 文件和环境变量中读取"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ---- 数据库 ----
    # 默认使用 SQLite（开发环境），Railway 生产环境通过环境变量设置 PostgreSQL
    DATABASE_URL: str = "sqlite+aiosqlite:///tmp/arbitragex/arbitragex.db"

    # ---- JWT 认证 ----
    SECRET_KEY: str = "your-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24小时

    # ---- GitHub OAuth ----
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/auth/github/callback"

    # ---- 微信登录 ----
    WECHAT_APP_ID: str = ""
    WECHAT_APP_SECRET: str = ""
    WECHAT_REDIRECT_URI: str = "http://localhost:8000/api/auth/wechat/callback"

    # ---- Polymarket API ----
    POLYMARKET_API_KEY: str = ""
    POLYMARKET_API_SECRET: str = ""
    POLYMARKET_CLOB_URL: str = "https://clob.polymarket.com"
    POLYMARKET_GAMMA_URL: str = "https://gamma-api.polymarket.com"

    # ---- Binance API（公开接口无需 Key，但保留配置供未来扩展） ----
    BINANCE_API_KEY: str = ""
    BINANCE_API_SECRET: str = ""
    BINANCE_FUTURES_URL: str = "https://fapi.binance.com"
    BINANCE_SPOT_URL: str = "https://api.binance.com"

    # ---- OKX API（公开接口无需 Key，但保留配置供未来扩展） ----
    OKX_API_KEY: str = ""
    OKX_API_SECRET: str = ""
    OKX_PASSPHRASE: str = ""
    OKX_API_URL: str = "https://www.okx.com"

    # ---- Gate.io API（公开接口无需 Key，但保留配置供未来扩展） ----
    GATEIO_API_KEY: str = ""
    GATEIO_API_SECRET: str = ""
    GATEIO_API_URL: str = "https://api.gateio.ws"

    # ---- Telegram 通知 ----
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # ---- 数据刷新间隔（秒） ----
    FUNDING_RATE_REFRESH_INTERVAL: int = 60  # 资金费率每60秒刷新
    PREDICTION_MARKET_REFRESH_INTERVAL: int = 300  # 预测市场每5分钟刷新

    # ---- 交易模式 ----
    PAPER_TRADING: bool = True  # 默认模拟交易

    # ---- 套利参数 ----
    MIN_ARBITRAGE_PROFIT: float = 0.03  # 最小套利利润阈值（3%）
    MAX_POSITION_SIZE: float = 100.0  # 最大单笔金额（USDT）
    MAX_OPEN_POSITIONS: int = 5  # 最大同时持仓数
    FUNDING_RATE_THRESHOLD: float = 0.001  # 资金费率阈值（0.1%）
    FUNDING_RATE_FEE: float = 0.001  # 交易所手续费率

    # ---- 邀请分佣 ----
    REFERRAL_COMMISSION_RATE: float = 0.10  # 佣金比例 10%

    # ---- CORS 允许的域名 ----
    # 生产环境：允许所有来源（Railway 部署时需要）
    # 如需限制，请设置 CORS_ORIGINS 环境变量，用逗号分隔
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "https://arbitragex-production.up.railway.app",
        "https://*.railway.app",
    ]

    # ---- 服务器 ----
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ---- 前端URL（用于OAuth回调，留空则使用当前请求的Host） ----
    FRONTEND_URL: str = ""


@lru_cache()
def get_settings() -> Settings:
    """获取全局配置单例"""
    return Settings()
