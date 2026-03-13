# 🐳 本地 Docker 部署 OpenClaw 路径图与记录

本文档记录如何在本地通过 docker compose 一键拉起 OpenClaw 及周边依赖环境的路径大纲。

## 1. 架构与依赖服务分析

OpenClaw 并非一个简单的单体应用，为了让它能在本地完美运行（尤其是带有记忆和本地推理），通常需要拉起多个容器组成一个微服务网。

**典型的 Docker 部署架构路径图（MyClaw 选用方案）：**

```mermaid
graph TD;
    A[外部聊天软件\nTelegram/Slack] -->|Webhook/Polling| B(OpenClaw 主程序容器)
    
    subgraph 本地 Docker 网络 (Local Docker Network)
        B -->|读写记忆| C[(Markdown 记忆卷\n/app/memory/)]
        B -->|请求推理| D[本地通用大模型 API\nOllama / vLLM 容器]
        B -->|请求图像/视觉| E[视觉识别容器\nVision API]
        B -->|运行代码/插件| F[沙盒执行环境\nSandboxed OS]
    end
    
    subgraph 宿主机 (Host Machine)
        C -.-> G[宿主机映射目录\n./openclaw_data/memory]
        D -.-> H[本地显卡资源\nGPU Passthrough]
    end
```

## 2. 目录规划与准备

在宿主机上，建议按照以下目录结构来存放 Docker 的配置文件和挂载卷，防止容器销毁后数据（特别是**大模型的记忆**）丢失。

```text
/opt/openclaw/ (或你自定义的其他路径)
├── docker-compose.yml       # 核心编排文件
├── .env                     # 存放各类 API Key, Token 密码 (⚠️绝对不可以提交到公开仓库)
├── data/
│   ├── memory/              # ⭐️ 最核心的 Markdown 记忆库挂载目录
│   ├── config/              # OpenClaw 的 yaml 配置文件挂载
│   └── skills/              # 本地自定义插件挂载目录
└── scripts/                 # 一些启动、备份的 bash 脚本
```

## 3. 标准 docker-compose.yml 示例解析 (使用 docker compose 运行)

> 下列是一个基础拉起 OpenClaw 并挂载目录的简单示例。

```yaml
version: '3.8'

services:
  openclaw:
    image: ghcr.nju.edu.cn/openclaw/openclaw:latest
    container_name: my_openclaw
    restart: unless-stopped
    ports:
      - "8080:8080"  # 如果需要开放本地 Webhook 端口
    volumes:
      - ./data/memory:/app/data/memory    # 将核心记忆挂载到宿主机
      - ./data/config:/app/config         # 配置文件
      - ./data/skills:/app/skills         # 自定义技能
    env_file:
      - .env
    # 如果你要连接到本地刚跑起来的 Ollama 作为推理核心，可以使用 host 网络或指定内置 IP
    # extra_hosts:
    #   - "host.docker.internal:host-gateway"

  # 可选：如果你希望在同一台机器完全离线运行推理模型
  ollama:
    image: ollama/ollama
    container_name: ollama_reasoning
    volumes:
      - ./data/ollama:/root/.ollama
    ports:
      - "11434:11434"
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]
```

## 4. 下一步部署 Checklist

- [ ] 1. 确认宿主机系统资源（内存至少 8GB，跑本地大模型建议 16GB+ 及独立显卡）。
- [ ] 2. 确认 Docker 及 Docker Compose 已安装 (`docker --version`)。
- [ ] 3. 去你想接入的软件（如 Telegram 的 BotFather）申请 Token，并填入 `.env`。
- [ ] 4. 使用 `docker compose up -d` 启动并观察日志 (`docker logs -f my_openclaw`)。
- [ ] 5. 去 `docs/03-Reasoning/` 文档记录如何桥接大模型。

## 💡 常见问题：下载太慢怎么办？

如果你在拉取镜像时 (`Pulling`) 进度极其缓慢：
1. **只有第一次拉取需要下载**：一旦下载完成，Docker 会将其缓存在本地。下次启动或重启容器时，除非有更新，否则不会再次下载。
2. **断点续传**：如果你强行中止了下载，再次运行 `docker compose up -d` 会从刚才进度的位置继续。
3. **镜像加速器**：如果你在中国境内，由于网络环境原因 GHCR 可能会很慢。建议在 Docker Desktop 设置中配置镜像代理或加速器。
4. **更换网络**：如果可能，尝试使用更稳定的科学上网环境来加速拉取过程。
