# Contributing

感谢你愿意贡献 MyClaw！

## 开发流程建议

1. Fork 仓库并创建功能分支（`feat/...` / `fix/...`）
2. 保持提交粒度清晰，提交信息建议使用：
   - `feat:` 新功能
   - `fix:` 修复
   - `docs:` 文档
   - `chore:` 维护
3. 提交 PR 前请确认：
   - 不包含密钥、token、会话文件
   - 文档与配置样例同步更新
   - 本地 `docker compose up -d` 能正常启动

## 安全与隐私

- 严禁提交 `.env`、`data/openclaw_state/`、`data/memory/` 等私有数据
- 如误提交，请立即轮换相关密钥并重写历史

## 问题反馈

Issue 建议附上：

- 系统环境（macOS/Linux/Windows）
- OpenClaw 版本
- 复现步骤
- 关键日志（注意打码）
