<div align="center">

# GitFileDock

**轻量级 Git 文件服务器 — 将你的 Git 仓库变成功能完整的文件管理与分享平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

通过简洁的 Web 界面管理多个 Git 仓库，支持文件浏览、语法高亮预览、在线编辑、拖拽上传、一键下载。所有变更自动提交推送到远程仓库，提供类似 GitHub Raw 的文件直链能力。支持 GitHub / Gitea / Gitee 三大平台的 Webhook 自动同步与定时拉取，无需数据库服务，一个 Docker 命令即可部署。

**[快速开始](#快速开始)** · **[功能总览](#功能总览)** · **[部署指南](#部署指南)** · **[配置说明](#配置说明)** · **[API 参考](#api-参考)**

</div>

---

## 为什么选择 GitFileDock？

你可能遇到过这样的场景：团队需要一个轻量级的文件共享服务，但又不想搭建复杂的网盘系统；你有一些配置文件、文档、脚本存放在 Git 仓库中，希望能通过 Web 界面方便地浏览、编辑和分享；你需要一个类似 GitHub Raw 的文件直链服务，让 `wget`、`curl` 或 HTML 引用能够直接获取文件内容。

GitFileDock 正是为这些需求而生的。它不是另一个 Git 管理平台（像 Gitea 或 Gogs），而是一个**以 Git 仓库为存储后端的文件服务器**。你只需将 Git 仓库的 SSH 地址告诉它，它就能自动克隆、展示文件、接收编辑，并将所有变更提交推送回远程仓库。整个过程对最终用户来说是透明的——他们只需要一个浏览器。

**与传统文件服务的对比：**

| 特性 | GitFileDock | Nextcloud | MinIO | raw.githubusercontent.com |
|------|:-----------:|:---------:|:-----:|:------------------------:|
| Web 文件浏览 | ✅ | ✅ | ✅ | ❌ |
| 语法高亮预览 | ✅ | ❌ | ❌ | ✅ |
| 在线代码编辑 | ✅ | 有限 | ❌ | ❌ |
| 文件直链 (wget/curl) | ✅ | 需分享链接 | 需 Presigned URL | ✅ |
| Git 自动提交推送 | ✅ | ❌ | ❌ | N/A |
| Webhook 自动同步 | ✅ | N/A | N/A | N/A |
| 多仓库管理 | ✅ | N/A | N/A | ✅ |
| 安装复杂度 | 极低 | 中等 | 中等 | N/A |
| 数据库依赖 | SQLite（内嵌） | MySQL/PostgreSQL | 需配置 | N/A |

---

## 功能总览

### 核心能力

| 功能 | 描述 |
|------|------|
| 🗂️ **多仓库管理** | 通过 Web 界面配置多个 Git 仓库，一键切换浏览，支持 GitHub / Gitea / Gitee 平台 |
| 📂 **文件浏览** | 面包屑导航逐层浏览目录，支持按名称排序、搜索过滤，文件夹显示包含的文件数 |
| 👁️ **文件预览** | Shiki 代码语法高亮（200+ 语言）、Markdown 渲染、图片预览、PDF 内嵌预览、纯文本显示 |
| ✏️ **在线编辑** | CodeMirror 6 编辑器，支持语法高亮、行号、自动缩进、撤销重做，保存自动 Git 提交推送 |
| 📤 **文件上传** | 点击选择或拖拽上传，支持批量上传，同名文件覆盖确认，单文件最大 100MB |
| 📥 **文件下载** | 单文件直接下载，文件夹自动打包 ZIP 下载 |
| 🔗 **文件直链** | 类似 GitHub Raw 的直链，支持浏览器访问、`wget`/`curl` 下载、HTML 引用 |
| 👻 **匿名访问** | 无需登录即可浏览公开文件，隐藏文件仍可通过直链访问（类似 GitHub Raw） |
| 🔄 **Git 同步** | 手动同步 + Webhook 自动同步（push 事件触发）+ 定时拉取（30 分钟 ~ 4 小时可配） |
| 🔐 **安全设计** | JWT 认证、bcrypt 密码哈希、AES-256-GCM SSH 密钥加密、路径遍历防护 |
| 🌙 **暗色主题** | GitHub Dark 风格的深色界面，开发者友好，保护视力 |
| 🐳 **Docker 部署** | 开箱即用的 Docker Compose 配置，一个命令启动，数据持久化 |
| 💾 **零外部依赖** | 使用 SQLite 嵌入式数据库，无需安装 MySQL、PostgreSQL 或 Redis |

### 文件预览与编辑能力

| 文件类型 | 预览方式 | 可编辑 | 支持的语言/格式 |
|---------|---------|:------:|----------------|
| 源代码文件 | 行号 + 语法高亮 | ✅ | JavaScript, TypeScript, Python, Go, Java, Rust, C/C++, PHP, Ruby, Swift, Kotlin, Dart, Shell, SQL 等 200+ 语言 |
| 配置文件 | 语法高亮 | ✅ | JSON, YAML, TOML, INI, XML, .env, Dockerfile, Makefile 等 |
| Markdown | 富文本渲染，可切换源码 | ✅ | 支持 GFM（表格、任务列表、删除线等） |
| 图片 | 直接展示 + 缩放 | ❌ | PNG, JPG/JPEG, GIF, WebP, SVG, BMP, ICO |
| PDF | 内嵌预览 | ❌ | PDF 文档 |
| 纯文本 | 等宽字体展示 | ✅ | .txt, .log, .csv, .conf 等未识别的文本文件 |
| 二进制文件 | 显示文件信息 + 下载 | ❌ | .zip, .tar, .gz, .exe, .dll 等 |

### 文件操作一览

所有文件操作（新建、删除、重命名、编辑、上传）均需登录后执行。操作完成后系统会自动执行 `git add` → `git commit` → `git push`，将变更同步到远程仓库。提交信息格式示例：`[web] 编辑文件: src/components/Button.tsx`。

- **新建**：支持新建文件和文件夹，输入名称后立即创建并提交
- **删除**：弹出确认对话框，支持删除文件和文件夹（递归删除）
- **重命名**：弹出重命名对话框，自动执行 `git mv` + commit + push
- **编辑**：CodeMirror 6 编辑器，支持 Ctrl+Z 撤销、Ctrl+Y 重做、Tab 缩进
- **上传**：拖拽上传 + 点击上传，支持批量文件，同名覆盖确认，100MB 限制
- **下载**：单文件直接下载，文件夹自动打包 ZIP
- **复制链接**：一键复制文件直链或目录浏览链接

---

## 界面预览

> 以下为界面布局示意图，实际界面以部署后的效果为准。

**主界面 — 文件浏览：**

```
+------------------------------------------------------------------+
|  📁 GitFileDock    [project-a ▾ main]    [🔍 搜索]  [↻] [⚙]  [👤] |
+------------------------------------------------------------------+
|                                                                  |
|  project-a > src > components                                    |
|                                                                  |
|  📁 📄 新建文件   📁 新建文件夹   ⬆ 上传                        |
|                                                                  |
|  ┌────────────────────────────────────────────────────────────┐  |
|  │ 名称            类型      大小      修改时间       操作    │  |
|  ├────────────────────────────────────────────────────────────┤  |
|  │ ⬆️ ..            目录      -         -             [浏览]  │  |
|  │ 📁 hooks         目录      3 文件    2 小时前      [浏览]  │  |
|  │ 📄 Button.tsx    文件      3.2 KB    2 小时前      [⋯]    │  |
|  │ 📄 Modal.tsx     文件      5.8 KB    1 天前        [⋯]    │  |
|  │ 📄 index.ts      文件      1.1 KB    3 天前        [⋯]    │  |
|  │ 📄 utils.ts      文件      0.8 KB    5 天前        [⋯]    │  |
|  └────────────────────────────────────────────────────────────┘  |
|                                                                  |
|  共 3 个文件，1 个目录  ·  main 分支                             |
|  最新提交: fix: update button style (a1b2c3d)                   |
+------------------------------------------------------------------+
```

**文件预览面板（右侧滑出）：**

```
+-----------------------------+------------------------------------+
|                             |  Button.tsx              [编辑][X] |
|                             |  3.2 KB · TypeScript                |
|                             +------------------------------------+
|                             |   1 | import React from 'react';     |
|                             |   2 | import { Button } from './ui'; |
|                             |   3 |                                 |
|  文件浏览区域                |   4 | interface ButtonProps {        |
|                             |   5 |   label: string;                |
|                             |   6 |   onClick?: () => void;         |
|                             |   7 | }                               |
|                             |   8 |                                 |
|                             |   9 | export function Button({...     |
|                             |  ...                                |
|                             +------------------------------------+
|                             |  [📋 复制链接]  [⬇ 下载]           |
+-----------------------------+------------------------------------+
```

---

## 快速开始

### Docker 部署（推荐）

这是最简单的部署方式，适合绝大多数场景。你只需要安装 Docker 和 Docker Compose。

**前置要求：**
- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) V2+

**部署步骤：**

```bash
# 1. 克隆仓库
git clone https://github.com/astralwaveorg/GitFileHub.git
cd GitFileHub

# 2. 配置环境变量
cp .env.example .env

# 3. 编辑 .env 文件，至少修改以下两项：
#    - BASE_URL=https://your-domain.com  （你的访问域名，用于生成分享链接）
#    - JWT_SECRET=一个随机字符串           （用于 JWT 签名，务必修改）
#    - ENCRYPTION_KEY=一个随机字符串       （用于 SSH 密钥加密，务必修改）

# 4. 一键启动
docker-compose up -d

# 5. 查看日志确认启动成功
docker-compose logs -f
```

启动后访问 `http://your-server:3000`，使用默认管理员账号登录：**admin** / **admin123**

**常用 Docker 命令：**

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看运行状态
docker-compose ps

# 更新到最新版本
git pull
docker-compose up -d --build

# 备份数据（数据库 + 仓库文件）
docker cp gitfiledock:/app/data ./backup-$(date +%Y%m%d)

# 恢复数据
docker cp ./backup-20260417 gitfiledock:/app/data
docker-compose restart
```

### Node.js 直接部署

如果你不想使用 Docker，也可以直接用 Node.js 运行。适合已有 Node.js 环境或需要自定义配置的场景。

**前置要求：**
- Node.js 20+
- Git（用于克隆和操作仓库）

**部署步骤：**

```bash
# 1. 克隆仓库
git clone https://github.com/astralwaveorg/GitFileHub.git
cd GitFileHub

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件（同上）

# 4. 初始化数据库
npx prisma db push

# 5. 创建数据目录
mkdir -p data/repos

# 6. 构建项目
npm run build

# 7. 启动服务
npm start
```

**使用 PM2 守护进程（推荐生产环境）：**

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name gitfiledock -- start

# 查看运行状态
pm2 status

# 查看实时日志
pm2 logs gitfiledock

# 设置开机自启
pm2 startup
pm2 save
```

**使用 systemd 守护进程（Linux）：**

创建 `/etc/systemd/system/gitfiledock.service`：

```ini
[Unit]
Description=GitFileDock - Git File Server
After=network.target

[Service]
Type=simple
User=gitfiledock
WorkingDirectory=/opt/GitFileHub
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable gitfiledock
sudo systemctl start gitfiledock
sudo systemctl status gitfiledock
```

### 反向代理配置

生产环境通常需要配置反向代理（Nginx / Caddy）以提供 HTTPS 和域名访问。

**Nginx 配置示例：**

```nginx
server {
    listen 80;
    server_name files.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name files.yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 100M;  # 匹配文件上传大小限制

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy 配置示例（自动 HTTPS）：**

```
files.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## 首次使用指南

### 第一步：登录系统

首次访问后，点击右上角的登录按钮进入登录页面。系统预置了管理员账号：

| 项目 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `admin123` |

首次登录后，系统会提示你**立即修改密码**。请在设置页面完成密码修改，以确保安全。

### 第二步：添加 SSH 密钥

GitFileDock 需要通过 SSH 协议与远程 Git 仓库通信，因此需要先添加 SSH 私钥。

1. 点击右上角 **⚙ 设置** 进入管理后台
2. 切换到 **SSH 密钥** 标签页
3. 点击 **添加密钥**
4. 填写密钥名称（例如 `GitHub Deploy Key`）
5. 粘贴你的 SSH **私钥** 内容（以 `-----BEGIN` 开头的完整内容）
6. 点击保存

**如何获取 SSH 密钥？**

如果已有密钥，可以直接使用：

```bash
# 查看默认密钥
cat ~/.ssh/id_ed25519

# 或查看 RSA 密钥
cat ~/.ssh/id_rsa
```

如果需要生成新密钥（推荐使用 Ed25519）：

```bash
# 生成 Ed25519 密钥
ssh-keygen -t ed25519 -C "gitfiledock" -f ~/.ssh/gitfiledock -N ""

# 查看私钥（粘贴到 GitFileDock）
cat ~/.ssh/gitfiledock

# 查看公钥（添加到 Git 平台）
cat ~/.ssh/gitfiledock.pub
```

**将公钥添加到 Git 平台：**

- **GitHub**：仓库 Settings → Deploy Keys → Add deploy key → 勾选 "Allow write access"
- **Gitea**：仓库 Settings → Keys → Add Key
- **Gitee**：仓库 管理 → 部署公钥管理 → 添加公钥

> 重要：必须授予**写入权限**，否则 GitFileDock 无法将编辑后的文件推送回远程仓库。

### 第三步：添加 Git 仓库

1. 在设置页面切换到 **仓库管理** 标签页
2. 点击 **添加仓库**
3. 填写仓库信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| **仓库名称** | 自定义的显示名称，全局唯一 | `my-project` |
| **远程地址** | Git 仓库的 SSH 克隆地址 | `git@github.com:user/repo.git` |
| **SSH 密钥** | 选择上一步添加的密钥 | `GitHub Deploy Key` |
| **分支** | 要克隆和跟踪的分支 | `main` / `master` |
| **平台** | Git 托管平台类型 | `github` / `gitea` / `gitee` |
| **隐藏路径** | 需要在浏览列表中隐藏的路径 | `.git`, `node_modules`, `.env` |
| **定时同步** | 自动拉取间隔 | 关闭 / 30 分钟 / 1 小时 / 2 小时 / 4 小时 |

4. 点击保存，系统会自动克隆仓库到本地。克隆完成后，Webhook URL 会自动生成并显示。

### 第四步：开始使用

仓库添加成功后：

- 回到首页，点击仓库切换器选择刚添加的仓库
- 点击文件夹进入子目录，点击面包屑快速跳转上级
- 点击文件名打开预览面板（右侧滑出）
- 文本和代码文件可以直接点击「编辑」按钮在线编辑
- 使用「复制链接」分享文件直链给团队成员
- 所有编辑和上传操作会自动 Git 提交并推送到远程仓库

---

## 功能详解

### 文件浏览

GitFileDock 采用**面包屑导航 + 懒加载文件列表**的浏览模式，而非传统的文件树结构。这种设计在大仓库场景下性能更优，避免了递归加载大量文件的性能问题。

- **面包屑导航**：页面顶部显示当前完整路径，点击任意层级可快速跳转到对应目录
- **仓库切换器**：顶部下拉菜单显示所有已添加的仓库，切换后自动加载对应仓库的文件列表
- **文件排序**：目录始终排在文件前面，同类按名称字母排序
- **文件信息**：文件显示大小和修改时间，文件夹显示包含的文件数量
- **搜索过滤**：支持在当前目录内按文件名搜索
- **返回上级**：文件列表顶部提供「返回上级目录」快捷入口

### 文件直链（Raw URL）

每个文件都有唯一的直链地址，这是 GitFileDock 的核心特性之一。直链设计兼容 GitHub Raw 的使用方式，可以在浏览器中直接访问，也可以通过命令行工具下载。

**链接格式：**

```
文件直链：https://your-domain.com/raw/{仓库名}/{文件路径}
目录浏览：https://your-domain.com/browse/{仓库名}/{目录路径}
```

**使用场景：**

```bash
# 1. 在浏览器中直接查看文件内容
https://files.example.com/raw/my-project/README.md

# 2. 使用 curl 获取文件内容
curl -O https://files.example.com/raw/my-project/config/app.json

# 3. 使用 wget 下载文件
wget https://files.example.com/raw/my-project/scripts/deploy.sh

# 4. 在 HTML 中引用图片
<img src="https://files.example.com/raw/my-project/images/logo.png" />

# 5. 在 HTML 中引用脚本或样式
<script src="https://files.example.com/raw/my-project/js/app.js"></script>
<link rel="stylesheet" href="https://files.example.com/raw/my-project/css/style.css" />

# 6. 在 CI/CD 中下载配置文件
curl -s https://files.example.com/raw/infra/config/production.yaml | kubectl apply -f -

# 7. 在 shell 脚本中动态获取脚本并执行
bash <(curl -s https://files.example.com/raw/scripts/setup.sh)

# 8. 分享目录浏览链接给团队成员
https://files.example.com/browse/my-project/docs
```

**复制链接操作：**
- 在文件列表中，每个文件和文件夹的操作菜单（⋯）中都有「复制链接」选项
- 点击后链接自动复制到剪贴板，包含完整的域名和路径
- 直链支持匿名访问，接收方无需登录即可查看和下载

**隐藏文件与直链的关系：**

即使文件在仓库设置中被配置为「隐藏」（在浏览列表中不显示），其直链仍然可以正常访问。这与 GitHub 的行为一致：`.gitignore` 中的文件虽然不在仓库页面显示，但通过 Raw URL 仍然可以获取。

### Git 同步机制

GitFileDock 提供三种同步方式，确保本地文件与远程仓库保持一致。你可以根据场景选择合适的同步策略。

#### 手动同步

点击顶部工具栏的同步按钮（刷新图标），立即执行 `git pull` 拉取远程仓库的最新更改。适用于需要立即获取最新变更的场景。

同步过程中会显示进度提示。如果本地有未提交的修改，系统会先尝试暂存（stash），拉取后再恢复（stash pop），以避免冲突。

#### Webhook 自动同步

当远程仓库收到新的 push 事件时，Git 平台会自动发送 HTTP 请求通知 GitFileDock，触发自动拉取。这是最推荐的同步方式，可以实现**秒级同步**。

**配置步骤：**

添加仓库后，GitFileDock 会自动生成一个唯一的 Webhook URL，格式为：`https://your-domain.com/api/webhook/{secret}`

将此 URL 配置到你的 Git 平台：

**GitHub：**
1. 进入仓库 Settings → Webhooks → Add webhook
2. Payload URL：填写 Webhook URL
3. Content type：选择 `application/json`
4. Secret：留空
5. Which events：勾选 `Just the push event`
6. 点击 Add webhook

**Gitea：**
1. 进入仓库 Settings → Webhooks → Add Webhook
2. 目标 URL：填写 Webhook URL
3. Content type：选择 `application/json`
4. 触发事件：选择 `push events`
5. 点击 Add Webhook

**Gitee：**
1. 进入仓库 管理 → WebHooks → 添加 webhook
2. URL：填写 Webhook URL
3. 密码/Token：留空
4. 勾选 Push 事件
5. 点击添加

**验证 Webhook：**

配置完成后，可以在 Git 平台的 Webhook 设置页面点击「测试」或「Ping」发送测试请求。GitFileDock 收到 Ping 事件会返回 `pong`，确认连接正常。

#### 定时同步

作为 Webhook 的补充，定时同步通过 `node-cron` 定期执行 `git pull`。适用于以下场景：
- Git 平台不支持 Webhook 或 Webhook 配置较复杂
- 需要兜底机制确保即使 Webhook 遗漏也能同步

在仓库设置的「定时同步」字段中选择拉取间隔：

| 选项 | Cron 表达式 | 适用场景 |
|------|-------------|---------|
| 关闭 | - | 有 Webhook 时推荐 |
| 每 30 分钟 | `*/30 * * * *` | 频繁更新的活跃项目 |
| 每 1 小时 | `0 * * * *` | 一般项目（推荐默认值） |
| 每 2 小时 | `0 */2 * * *` | 更新不太频繁的项目 |
| 每 4 小时 | `0 */4 * * *` | 稳定的生产项目 |

### 隐藏文件配置

你可以在仓库设置中配置需要隐藏的文件和目录。隐藏后的项目不会出现在文件浏览列表中，但通过直链仍然可以访问（与 GitHub 的行为一致）。

**配置规则：**
- 在仓库设置的「隐藏路径」字段中填写，每行一个路径
- 支持精确匹配和简单通配符匹配

**常用配置示例：**

```
.git
.gitignore
node_modules
dist
build
.env
.env.*
*.log
.DS_Store
Thumbs.db
coverage
.next
.cache
```

**匹配逻辑说明：**
- `node_modules` — 精确匹配，隐藏名为 `node_modules` 的文件或目录
- `*.log` — 通配符匹配，隐藏所有以 `.log` 结尾的文件
- `.env.*` — 通配符匹配，隐藏 `.env.local`、`.env.production` 等
- 路径匹配是在当前目录层级进行的，不是全局递归匹配

---

## 配置说明

### 环境变量

所有配置通过项目根目录的 `.env` 文件管理。可以使用 `.env.example` 作为模板。

| 变量名 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|:--------:|
| `PORT` | 服务监听端口 | `3000` | 否 |
| `BASE_URL` | 基础 URL，用于生成文件直链和 Webhook URL | `http://localhost:3000` | **是** |
| `DATABASE_URL` | SQLite 数据库文件路径 | `file:./data/gitfiledock.db` | 否 |
| `JWT_SECRET` | JWT Token 签名密钥 | `change-this-to-a-random-string` | **是** |
| `ENCRYPTION_KEY` | SSH 私钥 AES-256-GCM 加密密钥 | `change-this-to-a-random-key` | **是** |
| `GIT_USER_NAME` | Git 提交时使用的用户名 | `GitFileDock` | 否 |
| `GIT_USER_EMAIL` | Git 提交时使用的邮箱 | `gitfiledock@local` | 否 |

**生产环境配置示例：**

```env
PORT=3000
BASE_URL=https://files.yourdomain.com
DATABASE_URL=file:./data/gitfiledock.db
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
ENCRYPTION_KEY=x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0
GIT_USER_NAME=Your Name
GIT_USER_EMAIL=your@email.com
```

**生成安全随机密钥：**

```bash
# 生成 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 ENCRYPTION_KEY（必须是 32 字节）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 数据库说明

GitFileDock 使用 SQLite 作为数据库，数据存储在单一文件中。数据库包含以下表：

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `User` | 管理员账户 | username, passwordHash, mustChangePwd |
| `SSHKey` | SSH 私钥（加密存储） | name, privateKey (AES-256-GCM), fingerprint |
| `Repo` | 仓库配置 | name, remoteUrl, localPath, branch, hiddenPaths, webhookSecret, platform |

数据库文件默认位于 `data/gitfiledock.db`。Git 仓库本地存储在 `data/repos/` 目录下。这两个路径在 Docker 部署中会通过 Volume 持久化。

---

## API 参考

所有 API 均返回 JSON 格式。需要认证的接口依赖 HttpOnly Cookie（前端自动处理），无需手动传递 Token。

### 认证 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| `POST` | `/api/auth/login` | 管理员登录 | 否 |
| `POST` | `/api/auth/logout` | 登出 | 是 |
| `GET` | `/api/auth/me` | 获取当前用户信息 | 是 |
| `PUT` | `/api/auth/password` | 修改密码 | 是 |

**登录接口详情：**

```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 成功响应 (200)
# Set-Cookie: token=eyJ...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
# {"success":true,"user":{"username":"admin","mustChangePwd":true}}

# 失败响应 (401)
# {"error":"用户名或密码错误"}
```

**修改密码接口详情：**

```bash
curl -X PUT https://your-domain.com/api/auth/password \
  -H "Content-Type: application/json" \
  -b "token=eyJ..." \
  -d '{"currentPassword":"admin123","newPassword":"NewPassword456"}'
```

### 仓库 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| `GET` | `/api/repos` | 获取仓库列表 | 否 |
| `POST` | `/api/repos` | 添加仓库 | 是 |
| `PUT` | `/api/repos/[id]` | 编辑仓库配置 | 是 |
| `DELETE` | `/api/repos/[id]?deleteLocal=true` | 删除仓库（`deleteLocal` 控制是否删除本地文件） | 是 |
| `POST` | `/api/repos/[id]/sync` | 手动同步仓库 | 是 |
| `GET` | `/api/repos/[id]/status` | 获取仓库状态（分支、最新提交信息） | 否 |

> 仓库 API 中的 `[id]` 可以使用仓库的数据库 ID 或仓库名称，系统会自动识别。

**添加仓库请求示例：**

```json
{
  "name": "my-project",
  "remoteUrl": "git@github.com:user/repo.git",
  "sshKeyId": "key-xxx",
  "branch": "main",
  "platform": "github",
  "hiddenPaths": [".git", "node_modules", ".env"],
  "autoPullInterval": 60
}
```

**添加仓库成功响应：**

```json
{
  "success": true,
  "repo": {
    "id": "clx...",
    "name": "my-project",
    "branch": "main",
    "platform": "github",
    "webhookSecret": "abc123...",
    "webhookUrl": "https://your-domain.com/api/webhook/abc123...",
    "createdAt": "2026-04-17T00:00:00Z"
  }
}
```

**仓库状态响应：**

```json
{
  "branch": "main",
  "commit": {
    "hash": "a1b2c3d",
    "shortHash": "a1b2c3d",
    "message": "fix: update button style",
    "author": "GitFileDock",
    "date": "2026-04-17T12:00:00+08:00"
  }
}
```

### 文件 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| `GET` | `/api/files/[repo]` | 列出仓库根目录 | 否 |
| `GET` | `/api/files/[repo]/[...path]` | 列出子目录或获取文件内容 | 否 |
| `POST` | `/api/files/[repo]/[...path]` | 创建文件或目录 | 是 |
| `PUT` | `/api/files/[repo]/[...path]` | 编辑文件内容或重命名 | 是 |
| `DELETE` | `/api/files/[repo]/[...path]` | 删除文件或目录 | 是 |
| `POST` | `/api/files/[repo]/upload?path=dir` | 上传文件（`multipart/form-data`） | 是 |
| `GET` | `/api/files/[repo]/download/[...path]` | 下载文件或目录（ZIP） | 否 |

**浏览目录响应：**

```json
{
  "success": true,
  "type": "directory",
  "path": "src/components",
  "items": [
    {
      "name": "Button.tsx",
      "isDirectory": false,
      "size": 3276,
      "modifiedAt": "2026-04-17T10:30:00+08:00",
      "path": "src/components/Button.tsx"
    },
    {
      "name": "hooks",
      "isDirectory": true,
      "size": 0,
      "fileCount": 3,
      "modifiedAt": "2026-04-17T08:00:00+08:00",
      "path": "src/components/hooks"
    }
  ]
}
```

**获取文件内容响应：**

```json
{
  "success": true,
  "type": "file",
  "file": {
    "name": "index.ts",
    "size": 2048,
    "modifiedAt": "2026-04-17T09:00:00+08:00",
    "path": "src/index.ts",
    "isText": true,
    "extension": "ts",
    "language": "typescript",
    "content": "import express from 'express';\n..."
  }
}
```

**创建文件请求：**

```json
// 创建文件
POST /api/files/my-project/src/utils.ts
{ "type": "file", "content": "export function formatDate() {...}" }

// 创建目录
POST /api/files/my-project/src/utils
{ "type": "directory" }
```

**编辑文件请求：**

```json
// 编辑文件内容
PUT /api/files/my-project/src/index.ts
{ "content": "updated file content..." }

// 重命名文件
PUT /api/files/my-project/src/old-name.ts
{ "newName": "new-name.ts" }
```

**上传文件：**

```bash
# 单文件上传
curl -X POST "https://your-domain.com/api/files/my-project/upload?path=assets" \
  -b "token=eyJ..." \
  -F "file=@./logo.png"

# 批量上传
curl -X POST "https://your-domain.com/api/files/my-project/upload?path=docs" \
  -b "token=eyJ..." \
  -F "file1=@./guide.md" \
  -F "file2=@./api-reference.md"

# 覆盖已存在的文件
curl -X POST "https://your-domain.com/api/files/my-project/upload?path=config&overwrite=true" \
  -b "token=eyJ..." \
  -F "file=@./config.yaml"
```

### SSH 密钥 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| `GET` | `/api/keys` | 获取密钥列表 | 是 |
| `POST` | `/api/keys` | 添加密钥 | 是 |
| `PUT` | `/api/keys/[id]` | 更新密钥 | 是 |
| `DELETE` | `/api/keys/[id]` | 删除密钥（如被仓库引用则拒绝删除） | 是 |

**添加密钥请求：**

```json
{
  "name": "GitHub Deploy Key",
  "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEA...\n-----END OPENSSH PRIVATE KEY-----"
}
```

**密钥列表响应：**

```json
{
  "keys": [
    {
      "id": "key-xxx",
      "name": "GitHub Deploy Key",
      "fingerprint": "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8",
      "createdAt": "2026-04-17T00:00:00Z"
    }
  ]
}
```

### Webhook API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| `POST` | `/api/webhook/[secret]` | 接收 Git 平台推送通知 | 否 |

该端点会自动识别请求来源平台（通过 `User-Agent` 和请求体格式），处理 `push` 事件执行 `git pull`，响应 `ping` 事件返回 `pong`。

**请求处理逻辑：**

```
收到 Webhook 请求
  ├── 解析 secret 路径参数 → 查找对应仓库
  ├── 识别平台（GitHub / Gitea / Gitee）
  ├── 判断事件类型
  │   ├── push → 执行 git pull → 返回 200
  │   ├── ping → 返回 {"pong": true}
  │   └── 其他 → 忽略，返回 200
  └── secret 无效 → 返回 404
```

### Raw 文件端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| `GET` | `/raw/[repo]/[...path]` | 获取文件原始内容 | 否 |

该端点设计为兼容 `wget` 和 `curl` 等命令行工具：

- **文本文件**：直接返回文件内容，`Content-Type` 根据文件扩展名自动设置
- **二进制文件**：返回文件流，并设置 `Content-Disposition: attachment` 头，触发浏览器下载
- **目录路径**：返回 404

```bash
# 获取文本文件内容（直接输出到终端）
curl https://files.example.com/raw/my-project/README.md

# 下载二进制文件
curl -O https://files.example.com/raw/my-project/images/logo.png

# 下载并重命名
wget -O config.json https://files.example.com/raw/my-project/config/production.yaml
```

---

## 安全设计

GitFileDock 在多个层面实现了安全防护，确保数据和访问安全。

| 安全措施 | 实现方式 |
|---------|---------|
| **密码存储** | 使用 bcrypt 算法进行哈希，10 轮 salt，不可逆 |
| **SSH 密钥存储** | 使用 AES-256-GCM 加密算法加密存储，密钥来自环境变量 `ENCRYPTION_KEY` |
| **身份认证** | JWT (HS256) 签名，Token 有效期 7 天，通过 HttpOnly + Secure + SameSite Cookie 传递 |
| **路径安全** | 使用 `path.resolve` 严格校验所有文件操作路径，防止目录遍历（Path Traversal）攻击 |
| **文件上传** | 限制单个文件最大 100MB，校验目标路径在仓库目录内 |
| **Git 操作** | SSH 密钥写入临时文件（权限 600），Git 操作完成后立即删除临时文件 |
| **Webhook 安全** | 每个仓库拥有独立的随机 Webhook Secret（32 字节），URL 不可猜测 |
| **API 鉴权** | 服务端中间件自动检查需要认证的路由，未认证请求返回 401 |
| **访问控制** | 文件浏览和下载为公开访问（无需登录），所有写入操作（编辑、上传、删除）需要管理员认证 |
| **HTTPS 建议** | 生产环境强烈建议配置 HTTPS（通过 Nginx/Caddy 反向代理），确保 Cookie 和传输安全 |

**安全最佳实践：**

1. 务必修改默认的 `JWT_SECRET` 和 `ENCRYPTION_KEY`
2. 首次登录后立即修改默认管理员密码
3. 生产环境配置 HTTPS（通过反向代理）
4. 使用专用 SSH 密钥，不要复用个人密钥
5. 定期备份 `data/gitfiledock.db` 数据库文件
6. 如需限制访问，可通过防火墙或 Nginx 限制 IP 范围

---

## 技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| [Next.js](https://nextjs.org/) | 16 | 全栈框架 | App Router、Server Components、API Routes 一体化 |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | 开发语言 | 类型安全，提升代码质量和开发体验 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | 样式框架 | 原子化 CSS，快速构建一致界面 |
| [shadcn/ui](https://ui.shadcn.com/) | 最新 | UI 组件库 | 基于 Radix UI，高质量可访问组件 |
| [Prisma](https://www.prisma.io/) | 6.x | ORM | 类型安全的数据库操作，SQLite 无需额外服务 |
| [Shiki](https://shiki.matsu.io/) | 4.x | 代码高亮 | 服务端渲染，支持 200+ 语言和主题 |
| [CodeMirror 6](https://codemirror.net/) | 6.x | 代码编辑器 | 模块化架构，高性能浏览器端编辑 |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.x | JWT 认证 | 成熟的 Token 签发与验证库 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.x | 密码加密 | 纯 JS 实现，跨平台兼容 |
| [node-cron](https://www.npmjs.com/package/node-cron) | 4.x | 定时任务 | 轻量级定时任务调度 |
| [archiver](https://github.com/archiverjs/node-archiver) | 7.x | ZIP 打包 | 文件夹下载时打包为 ZIP |
| [formidable](https://github.com/node-formidable/formidable) | 3.x | 文件上传 | 稳定的 multipart/form-data 解析 |
| [simple-git](https://github.com/stevedon/simple-git) | 3.x | Git 操作 | 封装 Git CLI 调用，简化 Git 操作 |
| Docker | 20+ | 容器化 | 开箱即用，环境一致性 |

---

## 项目结构

```
GitFileDock/
├── PLAN.md                          # 详细开发计划文档（含模块清单、API 设计、数据库 Schema）
├── LICENSE                          # MIT 开源许可证
├── README.md                        # 本文件 — 项目文档
├── .gitignore                       # Git 忽略配置（data/、.env 等）
├── .env.example                     # 环境变量配置模板
├── docker-compose.yml               # Docker Compose 编排文件
├── Dockerfile                       # 多阶段 Docker 镜像构建
├── next.config.ts                   # Next.js 配置（standalone 输出模式）
├── package.json                     # 项目依赖和脚本
├── tsconfig.json                    # TypeScript 配置
├── prisma/
│   ├── schema.prisma                # 数据库模型定义（User、SSHKey、Repo）
│   └── seed.ts                      # 数据库种子数据（默认管理员账户）
├── src/
│   ├── app/
│   │   ├── layout.tsx               # 根布局（暗色主题、全局样式）
│   │   ├── page.tsx                 # 首页（自动重定向到第一个仓库）
│   │   ├── globals.css              # 全局 CSS 样式
│   │   ├── login/
│   │   │   └── page.tsx             # 管理员登录页面
│   │   ├── settings/
│   │   │   └── page.tsx             # 设置页面（仓库管理、SSH 密钥、个人信息）
│   │   ├── browse/
│   │   │   └── [repo]/
│   │   │       └── [...path]/
│   │   │           └── page.tsx     # 文件浏览主页面（面包屑 + 文件列表 + 预览面板）
│   │   ├── raw/
│   │   │   └── [repo]/
│   │   │       └── [...path]/
│   │   │           └── route.ts     # 文件直链端点（wget/curl 兼容）
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts   # 登录接口
│   │       │   ├── logout/route.ts  # 登出接口
│   │       │   ├── me/route.ts      # 当前用户信息接口
│   │       │   └── password/route.ts # 修改密码接口
│   │       ├── repos/
│   │       │   ├── route.ts         # 仓库列表（GET）/ 添加仓库（POST）
│   │       │   └── [id]/
│   │       │       ├── route.ts     # 编辑仓库（PUT）/ 删除仓库（DELETE）
│   │       │       ├── sync/route.ts # 手动同步接口
│   │       │       └── status/route.ts # 仓库状态查询接口
│   │       ├── files/
│   │       │   └── [repo]/
│   │       │       ├── [...path]/
│   │       │       │   └── route.ts # 浏览（GET）/ 创建（POST）/ 编辑（PUT）/ 删除（DELETE）
│   │       │       ├── upload/
│   │       │       │   └── route.ts # 文件上传接口
│   │       │       └── download/
│   │       │           └── [...path]/
│   │       │               └── route.ts # 文件/目录下载接口
│   │       ├── keys/
│   │       │   ├── route.ts         # SSH 密钥列表（GET）/ 添加密钥（POST）
│   │       │   └── [id]/
│   │       │       └── route.ts     # 编辑密钥（PUT）/ 删除密钥（DELETE）
│   │       └── webhook/
│   │           └── [secret]/
│   │               └── route.ts     # Webhook 接收端点
│   ├── components/
│   │   ├── ui/                      # shadcn/ui 基础组件（Button、Dialog、Input 等）
│   │   ├── Header.tsx               # 顶部导航栏（Logo、仓库切换器、同步、搜索、设置）
│   │   ├── RepoSwitcher.tsx         # 仓库下拉切换器
│   │   ├── BreadcrumbNav.tsx        # 路径面包屑导航
│   │   ├── FileList.tsx             # 文件列表组件（含排序、搜索、操作菜单）
│   │   ├── PreviewPanel.tsx         # 文件预览滑出面板（代码/Markdown/图片/PDF）
│   │   ├── CodeEditor.tsx           # CodeMirror 6 在线代码编辑器
│   │   └── UploadDialog.tsx         # 文件上传对话框（拖拽 + 点击 + 覆盖确认）
│   ├── lib/
│   │   ├── db.ts                    # Prisma 数据库客户端单例
│   │   ├── auth.ts                  # JWT 签发/验证、密码哈希/验证
│   │   ├── git.ts                   # Git 操作封装（clone/pull/push/add/commit/status）
│   │   ├── crypto.ts                # AES-256-GCM 加解密（SSH 密钥加密）
│   │   ├── file-utils.ts            # 文件类型检测、大小格式化、隐藏路径匹配
│   │   ├── scheduler.ts             # node-cron 定时同步任务调度
│   │   └── ssh-key-helper.ts        # SSH 密钥临时文件管理（写入 → 使用 → 删除）
│   └── middleware.ts                # Next.js 全局中间件
├── data/                            # 运行时数据目录（Docker Volume 挂载点）
│   ├── gitfiledock.db               # SQLite 数据库文件
│   └── repos/                       # Git 仓库本地克隆存储
└── public/                          # 静态资源目录
```

---

## 开发指南

### 环境准备

```bash
# 克隆项目
git clone https://github.com/astralwaveorg/GitFileHub.git
cd GitFileHub

# 安装依赖
npm install

# 初始化数据库
npx prisma db push

# 填充种子数据（创建默认管理员）
npx prisma db seed

# 启动开发服务器
npm run dev
```

开发服务器默认运行在 `http://localhost:3000`，支持热重载。

### 构建与部署

```bash
# 构建生产版本
npm run build

# 启动生产服务
npm start

# 代码检查
npm run lint
```

### 开发注意事项

- 项目使用 Next.js 16 App Router，所有页面路由在 `src/app/` 目录下
- API 路由在 `src/app/api/` 目录下，使用 Next.js Route Handlers
- 数据库操作通过 `src/lib/db.ts` 导入 Prisma Client
- Git 操作封装在 `src/lib/git.ts`，通过 `simple-git` 库调用 Git CLI
- 代码高亮使用 Shiki，在服务端渲染后返回 HTML（`/api/highlight` 端点）
- 代码编辑器使用 CodeMirror 6，在客户端渲染
- 暗色主题通过 Tailwind CSS 的 dark mode 类和自定义 CSS 变量实现
- 详细的开发计划和技术方案请查看 [PLAN.md](PLAN.md)

---

## 常见问题

### Q: 支持哪些 Git 远程地址格式？

目前支持 SSH 格式的远程地址：`git@github.com:user/repo.git`、`git@gitea.example.com:user/repo.git`、`git@gitee.com:user/repo.git`。暂不支持 HTTPS 格式（`https://github.com/user/repo.git`）。

### Q: 文件编辑后多久能推送到远程？

保存文件后，系统会立即执行 `git add → git commit → git push`，通常在几秒内完成。如果推送失败，页面会显示错误信息。

### Q: 多人同时编辑同一文件怎么办？

GitFileDock 目前不支持协同编辑。如果多人同时编辑同一文件，后提交的更改可能导致冲突。建议通过 Webhook 和定时同步机制保持最新状态，并在编辑前先手动同步。

### Q: 可以限制特定文件的访问吗？

通过「隐藏路径」配置可以在浏览列表中隐藏特定文件/目录，但它们的直链仍然可以访问（类似 GitHub Raw 的行为）。如果需要完全限制访问，建议使用 Nginx 的 `location` 规则或防火墙进行控制。

### Q: Docker 部署后如何更新版本？

```bash
cd GitFileHub
git pull
docker-compose up -d --build
```

数据库和仓库数据存储在 Docker Volume 中，更新不会丢失数据。

### Q: 如何备份和迁移数据？

```bash
# 备份
docker cp gitfiledock:/app/data ./backup

# 迁移到新服务器
scp -r ./backup new-server:/opt/gitfiledock-data/
# 在新服务器上启动后恢复
docker cp ./backup gitfiledock:/app/data
docker-compose restart
```

### Q: 支持哪些文件大小？

单个文件上传限制为 100MB（可在代码中修改 `UPLOAD_MAX_SIZE` 常量调整）。对于大文件场景，建议使用 Git LFS。

---

## 贡献指南

欢迎贡献代码、报告 Bug 或提出功能建议。

### 如何贡献

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m 'feat: 添加某功能'`
4. 推送分支：`git push origin feature/your-feature-name`
5. 提交 Pull Request

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `perf:` 性能优化
- `chore:` 构建/工具变更

### 报告 Bug

请通过 GitHub Issues 提交 Bug 报告，包含以下信息：
- 复现步骤
- 期望行为与实际行为
- 浏览器和操作系统信息
- 相关的错误日志

---

## 许可证

[MIT License](LICENSE)

Copyright (c) 2026 astralwaveorg. All rights reserved.
