# ============================================================
# 通用工具函数
# ============================================================
import logging
from datetime import datetime, timezone
from typing import Any


logger = logging.getLogger(__name__)


def format_usdt(amount: float, decimals: int = 2) -> str:
    """
    格式化 USDT 金额

    Args:
        amount: 金额
        decimals: 小数位数

    Returns:
        格式化字符串，如 "1,234.56 USDT"
    """
    formatted = f"{amount:,.{decimals}f}"
    return f"{formatted} USDT"


def format_percent(rate: float, decimals: int = 2) -> str:
    """
    格式化百分比

    Args:
        rate: 小数形式的比率（如 0.03 表示 3%）
        decimals: 小数位数

    Returns:
        格式化字符串，如 "3.00%"
    """
    return f"{rate * 100:.{decimals}f}%"


def timestamp_to_datetime(ts: int | str | None) -> datetime | None:
    """
    将时间戳转换为 datetime 对象

    Args:
        ts: 毫秒级时间戳

    Returns:
        datetime 对象或 None
    """
    if ts is None:
        return None

    try:
        ts_int = int(ts)
        # 毫秒转秒
        if ts_int > 1e12:
            ts_int = ts_int // 1000
        return datetime.fromtimestamp(ts_int, tz=timezone.utc)
    except (ValueError, OSError):
        return None


def safe_float(value: Any, default: float = 0.0) -> float:
    """
    安全转换为浮点数

    Args:
        value: 输入值
        default: 转换失败时的默认值

    Returns:
        浮点数
    """
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    截断字符串

    Args:
        text: 原始字符串
        max_length: 最大长度
        suffix: 截断后缀

    Returns:
        截断后的字符串
    """
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix
