# ============================================================
# ArbitrageX - FastAPI 应用入口
# ============================================================
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import get_settings
from app.database import init_db, close_db
from app.services.market_data import (
    close_http_client,
    market_data_service,
    get_data_source_status,
)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理

    启动时：初始化数据库、启动定时任务、预热数据缓存
    关闭时：清理资源
    """
    logger.info("=" * 60)
    logger.info("  ArbitrageX - AI 三合一套利交易 Bot")
    logger.info("=" * 60)

    settings = get_settings()
    logger.info(f"交易模式: {'模拟交易 (Paper Trading)' if settings.PAPER_TRADING else '实盘交易'}")
    logger.info(f"最小套利利润阈值: {settings.MIN_ARBITRAGE_PROFIT:.2%}")
    logger.info(f"最大单笔金额: {settings.MAX_POSITION_SIZE} USDT")
    logger.info(f"最大持仓数: {settings.MAX_OPEN_POSITIONS}")
    logger.info(f"资金费率刷新间隔: {settings.FUNDING_RATE_REFRESH_INTERVAL}秒")
    logger.info(f"预测市场刷新间隔: {settings.PREDICTION_MARKET_REFRESH_INTERVAL}秒")

    # OAuth 配置状态
    if settings.GITHUB_CLIENT_ID:
        logger.info("GitHub OAuth: 已配置")
    else:
        logger.warning("GitHub OAuth: 未配置 (GITHUB_CLIENT_ID 为空)")
    if settings.WECHAT_APP_ID:
        logger.info("微信登录: 已配置")
    else:
        logger.warning("微信登录: 未配置 (WECHAT_APP_ID 为空)")

    # 初始化数据库
    logger.info("正在初始化数据库...")
    await init_db()
    logger.info("数据库初始化完成")

    # 启动定时任务
    logger.info("正在启动定时任务调度器...")
    from app.tasks.scheduler import setup_scheduler
    setup_scheduler()

    # 预热数据缓存
    logger.info("正在预热市场数据缓存...")
    try:
        await market_data_service.get_funding_rates(force_refresh=True)
        logger.info("资金费率数据预热完成")
    except Exception as e:
        logger.warning(f"资金费率数据预热失败: {e}")

    try:
        await market_data_service.get_prediction_markets(force_refresh=True)
        logger.info("预测市场数据预热完成")
    except Exception as e:
        logger.warning(f"预测市场数据预热失败: {e}")

    logger.info("ArbitrageX 启动完成!")
    logger.info(f"API 文档: http://{settings.HOST}:{settings.PORT}/docs")
    logger.info(f"ReDoc: http://{settings.HOST}:{settings.PORT}/redoc")

    yield

    # 关闭时清理
    logger.info("正在关闭 ArbitrageX...")
    await close_db()
    await close_http_client()
    logger.info("ArbitrageX 已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="ArbitrageX API",
    description="AI 三合一套利交易 Bot - 预测市场套利 + 资金费率套利 + AI趋势跟踪",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS 中间件配置
settings = get_settings()

cors_origins = list(settings.CORS_ORIGINS)
# 添加 Railway 部署域名
cors_origins.append("https://arbitragex-production.up.railway.app")
cors_origins.append("https://*.railway.app")
# 添加 Vercel 部署域名（支持所有 Vercel 子域名）
cors_origins.append("https://arbitragex.vercel.app")
cors_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 注册 API 路由
from app.api.auth import router as auth_router
from app.api.prediction_market import router as prediction_router
from app.api.funding_rate import router as funding_rate_router
from app.api.trend_following import router as trend_router
from app.api.trades import router as trades_router
from app.api.referral import router as referral_router
from app.api.websocket import router as websocket_router

app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(funding_rate_router)
app.include_router(trend_router)
app.include_router(trades_router)
app.include_router(referral_router)
app.include_router(websocket_router)


# 根路径
@app.get("/", tags=["系统"])
async def root():
    """系统信息"""
    settings = get_settings()
    return {
        "name": "ArbitrageX",
        "version": "2.0.0",
        "description": "AI 三合一套利交易 Bot",
        "mode": "paper_trading" if settings.PAPER_TRADING else "live",
        "auth_methods": ["email", "github", "wechat"],
        "strategies": [
            {"name": "prediction_market", "description": "预测市场套利"},
            {"name": "funding_rate", "description": "资金费率套利"},
            {"name": "trend_following", "description": "AI趋势跟踪"},
        ],
    }


@app.get("/api/health", tags=["系统"])
async def health_check():
    """
    健康检查端点

    返回系统状态、数据源连接状态、最后更新时间
    """
    settings = get_settings()

    # 获取数据源连接状态
    data_sources = get_data_source_status()

    # 获取缓存信息
    cache_info = market_data_service.get_cache_info()

    # OAuth 配置状态
    oauth_status = {
        "github": bool(settings.GITHUB_CLIENT_ID),
        "wechat": bool(settings.WECHAT_APP_ID),
    }

    return {
        "status": "healthy",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "paper_trading" if settings.PAPER_TRADING else "live",
        "oauth": oauth_status,
        "data_sources": data_sources,
        "cache": cache_info,
        "config": {
            "funding_rate_refresh_interval": settings.FUNDING_RATE_REFRESH_INTERVAL,
            "prediction_market_refresh_interval": settings.PREDICTION_MARKET_REFRESH_INTERVAL,
        },
    }


# ============================================================
# 托管前端静态文件
# 在 Docker 构建时，前端会被编译并复制到 backend/static/ 目录
# ============================================================

# 查找前端静态文件目录
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    # 挂载静态文件目录（JS、CSS、图片等）
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    # 所有非 API 路径返回 index.html（SPA 路由支持）
    @app.get("/{full_path:path}", tags=["前端"])
    async def serve_frontend(full_path: str):
        """
        托管前端 SPA
        所有非 /api 开头的路径都返回 index.html
        """
        # 如果请求的是具体文件且存在，直接返回
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        # 否则返回 index.html（SPA 路由）
        return FileResponse(str(STATIC_DIR / "index.html"))

    logger.info(f"前端静态文件目录: {STATIC_DIR}")
    logger.info("前端 SPA 托管已启用 - 访问根路径即可打开前端页面")
else:
    logger.info("前端静态文件目录不存在，仅提供 API 服务")
    logger.info("如需启用前端托管，请在 Dockerfile 中添加前端构建步骤")
