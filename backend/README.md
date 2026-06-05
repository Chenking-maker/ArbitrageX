# ArbitrageX - AI 三合一套利交易 Bot

## 项目简介

ArbitrageX 是一个集成了三大套利策略的 AI 交易机器人后端系统：

1. **预测市场套利** - 监控 Polymarket 等预测市场，利用 yes/no 合约价差套利
2. **资金费率套利** - 利用永续合约资金费率，现货多+合约空获取收益
3. **AI 趋势跟踪** - 基于技术指标和 AI 分析的趋势交易

## 技术栈

- Python 3.11+ / FastAPI / SQLAlchemy (async) / Alembic / SQLite
- APScheduler 定时任务 / httpx 异步HTTP / websockets 实时推送
- JWT 用户认证

## 快速开始

```bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 复制配置文件
cp .env.example .env

# 4. 初始化数据库
alembic upgrade head

# 5. 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 文档

启动后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 配置说明

所有配置项在 `.env` 文件中管理，详见 `.env.example`。

默认开启 **模拟交易（Paper Trading）** 模式，不会执行真实交易。
