# Security Policy

## Supported Versions

当前主分支（main）为维护版本。

## Reporting a Vulnerability

如发现安全问题（密钥泄露、越权访问、依赖漏洞等），请勿公开提交 Issue。

请通过私下渠道联系维护者，并附：

- 漏洞描述与影响范围
- 复现步骤
- 可能的修复建议

我们会尽快确认并安排修复。

## Secret Hygiene

发布前请执行以下检查：

- `.env` 不入库（仅提交 `.env.example`）
- `data/openclaw_state/` 不入库
- `data/memory/` 不入库
- 日志与截图中移除 token / appSecret
