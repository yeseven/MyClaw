# MyClaw 🦞

基于 Docker 的 OpenClaw 本地部署模板，包含：

- 推理模型接入（默认百炼 `qwen3-max`）
- 飞书官方插件接入与稳定化配置
- 一键启动前自修复脚本（防止 UI/插件把配置改乱）
- 开源发布友好的目录与隐私保护策略

> 本仓库是“可复用部署模板 + 实战运维经验”集合，适合个人本地部署与二次开发。

---

## ✨ 功能特性

- Docker Compose 一键启动
- `.env` 驱动密钥配置（不把真实密钥入库）
- 自动修正 OpenClaw 运行态配置（模型/飞书/插件冲突）
- 文档化的排障知识库（`docs/`）

## 📦 快速开始

### 1) 准备环境

- Docker
- Docker Compose（`docker compose`）

### 2) 初始化配置

- 复制模板环境变量：`cp .env.example .env`
- 填写 `.env` 中真实密钥（BAILIAN、飞书 AppID/Secret）

### 3) 启动服务

- `docker compose up -d`

启动后可访问 Dashboard（默认端口 `8080` / 网关端口见 `docker-compose.yml`）。

---

## 🧩 目录结构

- `docker-compose.yml`：主部署编排
- `scripts/sync-env-models.mjs`：启动自修复脚本（关键）
- `data/config/`：OpenClaw 配置模板
- `data/openclaw_state/`：运行时状态（已在 `.gitignore` 忽略）
- `docs/`：部署、网关、模型、记忆、技能等记录

---

## 🔐 安全与隐私

本仓库遵循“模板入库、状态不入库”原则：

- ✅ 提交：`.env.example`、脚本、模板配置、文档
- ❌ 不提交：`.env`、`data/openclaw_state/`、`data/memory/`、日志

发布到 GitHub 前建议检查：

1. `.env` 中所有真实密钥已移除（仅本地保留）
2. `data/openclaw_state/` 未加入版本控制
3. 截图和日志已打码

如果曾泄露密钥，请立即轮换。

---

## 🤝 贡献

欢迎 PR 与 Issue！请先阅读：

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)

---

## 📚 参考文档

- OpenClaw 官方：<https://openclaw.ai>
- 本仓库实践文档：`docs/`

---

## 📄 License

本项目采用 [MIT License](./LICENSE)。
