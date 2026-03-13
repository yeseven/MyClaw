#!/bin/bash

# OpenClaw 一键初始化脚本

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🦞 开始初始化 MyClaw (OpenClaw 本地部署环境)...${NC}\n"

# 1. 检查 Docker 环境
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}警告: 未检测到 Docker。请先安装 Docker。${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}警告: 未检测到 Docker Compose。请先安装 Docker Compose。${NC}"
    exit 1
fi
echo "✓ Docker 检查通过"

# 2. 创建核心挂载目录
echo -e "\n${GREEN}>> 正在创建核心数据目录结构...${NC}"
mkdir -p data/memory
mkdir -p data/config
mkdir -p data/skills
mkdir -p scripts
echo "✓ 目录创建完成 (data/memory, data/config, data/skills, scripts)"

# 3. 初始化 .env 文件
echo -e "\n${GREEN}>> 检查并生成 .env 环境变量文件...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ 已从 .env.example 生成初始 .env 文件"
    else
        cat <<EOF > .env
# MyClaw 配置文件 (.env) - ⚠️请不要将此文件提交到 Git 仓库

# --- 网关通讯配置 ---
OPENCLAW_GATEWAY_TOKEN="change_me"

# --- 推理模型配置 ---
BAILIAN_API_KEY="replace_with_your_key"
VOLCANO_API_KEY="replace_with_your_key"

# --- Feishu/Lark 渠道配置 ---
FEISHU_APP_ID="cli_xxx"
FEISHU_APP_SECRET="replace_with_your_secret"
FEISHU_DOMAIN="feishu"

# --- 记录与日志 ---
LOG_LEVEL="INFO"
EOF
        echo "✓ 已生成初始 .env 文件"
    fi
fi

# 4. 初始化 config.yml
echo -e "\n${GREEN}>> 检查并生成 config.yml 配置文件...${NC}"
if [ ! -f data/config/config.yml ]; then
    if [ -f data/config/config.yml.example ]; then
        cp data/config/config.yml.example data/config/config.yml
        echo "✓ 已从模板创建 data/config/config.yml"
    else
        echo "警告: 未找到 config.yml.example，请手动创建配置文件。"
    fi
fi

# 5. 生成 .gitignore
if [ ! -f .gitignore ]; then
    cat <<EOF > .gitignore
.env
data/config/config.yml
data/memory/
data/ollama/
*.log
.DS_Store
EOF
    echo "✓ 已自动创建 .gitignore 以保护隐私数据"
fi

# 6. 提供启动指引
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}🎉 环境初始化成功！${NC}\n"
echo "部署目录: $(pwd)"
echo -e "\n后续启动步骤:"
echo "1. 编辑当前目录下的 .env 文件填入你的 API Key。"
echo "2. 根据需要修改 data/config/config.yml。"
echo "3. 运行 'docker compose up -d' 启动。"
echo -e "${GREEN}===========================================${NC}"
