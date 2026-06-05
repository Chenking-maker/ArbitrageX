# ArbitrageX - AI 三合一套利交易 Bot

一个创新的 AI 驱动的套利交易系统，集成预测市场套利、资金费率套利和 AI 趋势跟踪三大策略，支持邀请分佣功能。

## 🎯 核心功能

### 1. 预测市场套利（核心创新）
- 自动扫描 Polymarket 等预测市场的"是/否"合约价差
- 当 `yes_price + no_price < 1.0` 时自动套利
- 风险极低，收益稳定

### 2. 资金费率套利
- 监控多个交易所的永续合约资金费率
- 费率较高时：做多现货 + 做空永续合约
- 收取资金费率作为收益

### 3. AI 趋势跟踪
- 技术指标分析（MA, RSI, MACD）
- AI 模型判断趋势方向
- 自动生成买卖信号

### 4. 邀请分佣系统
- 邀请链接分享，别人赚钱你抽 10% 佣金
- 邀请排行榜，裂变增长

## 🚀 快速开始

### 后端启动

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 配置你的 API 密钥
uvicorn app.main:app --reload --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000 查看仪表盘

## 📁 项目结构

```
ai-arbitrage-bot/
├── backend/          # Python FastAPI 后端
│   ├── app/
│   │   ├── api/      # API 路由
│   │   ├── engines/  # 三大套利引擎
│   │   ├── models/   # 数据模型
│   │   ├── services/ # 服务层
│   │   └── tasks/    # 定时任务
│   └── requirements.txt
└── frontend/         # React Web 仪表盘
    ├── src/
    │   ├── pages/    # 页面组件
    │   ├── components/ # UI 组件
    │   └── api/      # API 客户端
    └── package.json
```

## ⚠️ 风险提示

- 默认开启**模拟交易模式**（Paper Trading），不会花真钱
- 建议先用模拟模式跑 1-2 周，验证策略有效后再切实盘
- 预测市场套利是风险最低的策略，建议从这里开始
- 投资有风险，入市需谨慎

## 📄 许可证

MIT License
