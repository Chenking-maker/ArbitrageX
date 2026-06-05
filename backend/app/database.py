# ============================================================
# ArbitrageX 异步 SQLAlchemy 数据库配置
# 支持 SQLite（开发）和 PostgreSQL（生产/Railway）
# ============================================================
import os
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类"""
    pass


# 获取配置
settings = get_settings()

# 解析数据库 URL，确保使用正确的异步驱动
database_url = settings.DATABASE_URL

# 自动替换同步驱动为异步驱动
if database_url.startswith("postgresql://"):
    # PostgreSQL: 同步 → 异步
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgres://"):
    # Railway 有时用 postgres:// 简写
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("sqlite://"):
    # SQLite: 同步 → 异步
    database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

# Railway 临时目录（容器内可写）
if "sqlite" in database_url and "/app/" in database_url:
    db_path = database_url.split("///")[-1]
    # 使用 /tmp 目录（Railway 容器一定可写）
    os.makedirs("/tmp/arbitragex", exist_ok=True)
    database_url = f"sqlite+aiosqlite:///tmp/arbitragex/arbitragex.db"

print(f"[DB] 使用数据库: {database_url.split('://')[0]}://***")

# 创建异步引擎
engine = create_async_engine(
    database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# 创建异步会话工厂
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI 依赖注入：获取数据库会话"""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """初始化数据库表"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[DB] 数据库表初始化完成")
    except Exception as e:
        print(f"[DB] 数据库初始化失败（将使用内存回退）: {e}")
        # 回退到内存数据库
        global engine, async_session
        engine = create_async_engine("sqlite+aiosqlite://", echo=False)
        async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[DB] 已回退到内存数据库")


async def close_db():
    """关闭数据库连接"""
    await engine.dispose()
