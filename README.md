<div align="center">

# GitFileDock

**轻量级 Git 文件服务器 — 让你的 Git 仓库变成一个功能完整的文件服务器**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748)](https://www.prisma.io/)

通过 Web 界面管理多个 Git 仓库，浏览、预览、编辑、上传、下载文件，支持代码语法高亮与匿名访问。所有变更自动提交推送到远程仓库，提供类似 GitHub Raw 的文件直链能力。支持 GitHub / Gitea / Gitee 平台的 Webhook 自动同步与定时拉取。

[English](#english) | [中文文档](#功能特性)

</div>

---

## 目录

- [功能特性](#功能特性)
- [界面预览](#界面预览)
- [快速开始](#快速开始)
  - [Docker 部署（推荐）](#docker-部署推荐)
  - [Node.js 部署](#nodejs-部署)
- [首次使用指南](#首次使用指南)
  - [1. 登录系统](#1-登录系统)
  - [2. 添加 SSH 密钥](#2-添加-ssh-密钥)
  - [3. 添加 Git 仓库](#3-添加-git-仓库)
  - [4. 开始使用](#4-开始使用)
- [功能详解](#功能详解)
  - [文件浏览](#文件浏览)
  - [文件预览与编辑](#文件预览与编辑)
  - [文件操作](#文件操作)
  - [文件直链（Raw URL）](#文件直链raw-url)
  - [Git 同步](#git-同步)
  - [Webhook 自动同步](#webhook-自动同步)
  - [定时同步](#定时同步)
  - [隐藏文件](#隐藏文件)
- [配置说明](#配置说明)
  - [环境变量](#环境变量)
  - [隐藏路径配置](#隐藏路径配置)
- [API 参考](#api-参考)
  - [认证 API](#认证-api)
  - [仓库 API](#仓库-api)
  - [文件 API](#文件-api)
  - [SSH 密钥 API](#ssh-密钥-api)
  - [Webhook API](#webhook-api)
- [安全设计](#安全设计)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [许可证](#许可证)

---

## 功能特性

| 功能 | 描述 |
|------|------|
| **多仓库管理** | 通过 Web 界面配置多个 Git 仓库，支持一键切换 |
| **文件浏览** | 面包屑导航逐层进入目录，支持搜索和排序 |
| **文件预览** | 代码语法高亮（Shiki）、Markdown 渲染、图片预览、PDF 预览 |
| **在线编辑** | CodeMirror 6 代码编辑器，支持 20+ 语言语法高亮、行号、Tab 缩进 |
| **文件操作** | 新建文件/文件夹、删除、重命名，所有变更自动 Git 提交推送 |
| **文件上传** | 支持点击上传和拖拽上传，批量上传，同名文件覆盖确认 |
| **文件下载** | 单文件下载，文件夹打包 ZIP 下载 |
| **文件直链** | 类似 GitHub Raw 的文件直链，支持 wget/curl 直接下载 |
| **匿名访问** | 无需登录即可浏览公开文件，隐藏文件仍可通过直链访问 |
| **Git 同步** | 手动同步 + 定时拉取 + Webhook 自动同步 |
| **多平台 Webhook** | 支持 GitHub / Gitea / Gitee 三大平台 |
| **暗色主题** | GitHub Dark 风格的深色界面，开发者友好 |
| **Docker 部署** | 开箱即用的 Docker 和 Docker Compose 配置 |
| **轻量存储** | 使用 SQLite 数据库，无需额外数据库服务 |

---

## 界面预览

```
+--------------------------------------------------------------+
|  [GitFileDock]  [project-a v main ▾]  [搜索]  [同步] [设置]  |
+--------------------------------------------------------------+
|                                                              |
|  project-a > src > components                                |
|                                                              |
|  +----------------------------------------------------------+|
|  |  Name           | Size     | Modified      | Actions    ||
|  +----------------------------------------------------------+|
|  |  ...            | -        | -             | [上级目录]  ||
|  |  Button.tsx     | 3.2 KB   | 2 小时前      | [...]       ||
|  |  Modal.tsx      | 5.8 KB   | 1 天前        | [...]       ||
|  |  utils.ts       | 1.1 KB   | 3 天前        | [...]       ||
|  +----------------------------------------------------------+|
|                                                              |
|  共 3 个文件 | main 分支 | 最新提交: fix: update button style  |
+--------------------------------------------------------------+
```

**文件预览面板（右侧滑出）：**

```
+---------------------------+-----------------------------------+
|                           |  Button.tsx          [编辑] [X]  |
|                           |  3.2 KB · TS                       |
|                           +-----------------------------------+
|                           |  1  import React from 'react';     |
|  文件浏览区域              |  2  import { Button } from './ui'; |
|                           |  3                                  |
|                           |  4  interface ButtonProps {        |
|                           |  5    label: string;                |
|                           |  6    onClick?: () => void;         |
|                           |  7  }                                |
|                           |  ...                                |
|                           +-----------------------------------+
|                           |  [复制链接]  [下载]                 |
+---------------------------+-----------------------------------+
```

---

## 快速开始

### Docker 部署（推荐）

**前置要求：** 安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)

```bash
# 1. 克隆仓库
git clone https://github.com/astralwaveorg/GitFileHub.git
cd GitFileHub

# 2. 配置环境变量
cp .env.example .env
# 根据需要编辑 .env 文件（默认配置即可直接使用）

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

服务启动后访问 `http://your-server:3000`，默认管理员账号：`admin` / `admin123`

**常用命令：**

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 更新代码并重新构建
git pull
docker-compose up -d --build
```

**数据持久化：** 数据库文件和 Git 仓库存储在 Docker Volume 中，容器删除后数据不会丢失。如需备份：

```bash
# 备份数据
docker cp gitfiledock:/app/data ./backup

# 恢复数据
docker cp ./backup gitfiledock:/app/data
```

### Node.js 部署

**前置要求：** Node.js 20+、Git

```bash
# 1. 克隆仓库
git clone https://github.com/astralwaveorg/GitFileHub.git
cd GitFileHub

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

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

# 查看状态
pm2 status

# 查看日志
pm2 logs gitfiledock

# 设置开机自启
pm2 startup
pm2 save
```

---

## 首次使用指南

### 1. 登录系统

首次访问系统后，点击右上角「登录」按钮进入登录页面。

- 默认用户名：`admin`
- 默认密码：`admin123`
- 首次登录后系统会提示你修改密码

### 2. 添加 SSH 密钥

在管理 Git 仓库之前，需要先添加用于连接远程仓库的 SSH 私钥。

1. 点击右上角 **设置** 进入管理后台
2. 切换到 **SSH 密钥** 标签页
3. 点击 **添加密钥**
4. 填写密钥名称（如：`GitHub Deploy Key`）
5. 粘贴你的 SSH 私钥内容
6. 点击保存

**获取 SSH 私钥的方法：**

```bash
# 查看已有密钥
cat ~/.ssh/id_ed25519

# 或生成新密钥
ssh-keygen -t ed25519 -C "gitfiledock" -f ~/.ssh/gitfiledock
cat ~/.ssh/gitfiledock
```

> 重要：确保该 SSH 公钥已添加到你的 Git 平台（GitHub / Gitea / Gitee）账户或仓库的 Deploy Keys 中，并授予写入权限。

### 3. 添加 Git 仓库

1. 在设置页面切换到 **仓库管理** 标签页
2. 点击 **添加仓库**
3. 填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 仓库名称 | 用于显示的名称（唯一） | `my-project` |
| 远程地址 | Git 仓库的 SSH 地址 | `git@github.com:user/repo.git` |
| SSH 密钥 | 选择上一步添加的密钥 | `GitHub Deploy Key` |
| 分支 | 要克隆的分支 | `main` |
| 平台 | Git 平台类型 | `github` / `gitea` / `gitee` |
| 隐藏路径 | 需要隐藏的文件/目录 | `.git, node_modules, .env` |
| 自动同步 | 定时拉取间隔 | `关闭` / `30分钟` / `1小时` / `2小时` / `4小时` |

4. 点击保存，系统会自动克隆仓库到本地

### 4. 开始使用

仓库添加成功后：

- 回到首页即可浏览仓库文件
- 点击文件夹进入子目录
- 点击文件打开预览面板
- 文本文件可以直接在线编辑
- 通过右上角的仓库切换器在多个仓库之间切换

---

## 功能详解

### 文件浏览

- **面包屑导航**：页面顶部显示当前路径，点击任意层级可快速跳转
- **仓库切换**：顶部下拉菜单可切换不同的 Git 仓库
- **文件排序**：目录始终排在文件前面，同类按名称字母排序
- **文件信息**：显示文件大小、修改时间，文件夹显示包含的文件数量
- **搜索过滤**：支持在当前目录中搜索文件名
- **响应式设计**：在桌面端和移动端均有良好的显示效果

### 文件预览与编辑

| 文件类型 | 预览方式 | 是否可编辑 |
|---------|---------|:---------:|
| 代码文件（JS/TS/Python/Go/Java/Rust/C/C++ 等） | 行号 + 语法高亮 | 可 |
| Markdown (.md) | 富文本渲染，可切换源码视图 | 可 |
| JSON / YAML / TOML | 语法高亮 | 可 |
| Shell 脚本 (.sh/.bash) | 语法高亮 | 可 |
| SQL | 语法高亮 | 可 |
| 图片 (PNG/JPG/GIF/WebP/SVG) | 直接展示 | 否 |
| PDF | 内嵌预览 | 否 |
| 其他文本文件 | 纯文本 | 可 |
| 二进制文件 | 显示文件信息 + 下载按钮 | 否 |

**编辑功能说明：**
- 编辑器基于 CodeMirror 6，支持语法高亮、行号、自动缩进
- 支持 Ctrl+Z 撤销、Ctrl+Y 重做
- 保存时自动执行 `git add` → `git commit` → `git push`
- 提交信息自动生成，格式为 `[web] 编辑文件: path/to/file`

### 文件操作

所有文件操作（新建、删除、重命名、编辑、上传）都需要登录后才能执行，操作完成后会自动提交并推送到远程仓库。

**新建文件/文件夹：**
- 点击工具栏的「新建文件」或「新建文件夹」按钮
- 输入名称后立即创建
- 自动 git commit + push

**删除文件/文件夹：**
- 点击文件右侧操作菜单 →「删除」
- 弹出确认对话框，确认后删除
- 文件夹删除时会递归删除所有内容
- 自动 git commit + push

**重命名：**
- 点击操作菜单 →「重命名」
- 弹出重命名对话框，修改名称后确认
- 自动执行 `git mv` + commit + push

**上传文件：**
- 点击工具栏「上传」按钮
- 支持点击选择文件或拖拽文件到上传区域
- 支持批量上传多个文件
- 如果目标目录已存在同名文件，系统会提示是否覆盖
- 单个文件大小限制：100MB
- 上传完成后自动 git commit + push

### 文件直链（Raw URL）

每个文件都有唯一的直链地址，类似于 GitHub 的 Raw 文件链接。

**链接格式：**
```
文件直链：https://your-server.com/raw/{仓库名}/{文件路径}
目录链接：https://your-server.com/browse/{仓库名}/{目录路径}
```

**使用方式：**
```bash
# 在浏览器中预览文件
https://your-server.com/raw/my-project/src/index.ts

# 使用 curl 获取文件内容
curl https://your-server.com/raw/my-project/README.md

# 使用 wget 下载文件
wget https://your-server.com/raw/my-project/data/config.json

# 在 HTML 中引用
<img src="https://your-server.com/raw/my-project/images/logo.png" />
<script src="https://your-server.com/raw/my-project/js/app.js"></script>

# 分享目录浏览链接
https://your-server.com/browse/my-project/docs
```

**复制链接操作：**
- 在文件列表中点击操作菜单 →「复制链接」即可复制文件直链
- 文件夹也可复制目录浏览链接
- 链接支持匿名访问，无需登录

> 即使文件被设置为隐藏，通过直链仍然可以访问和下载。

### Git 同步

系统提供三种同步方式，确保本地文件始终与远程仓库保持一致。

#### 手动同步

点击顶部工具栏的同步按钮（刷新图标），立即执行 `git pull` 拉取最新代码。适用于需要立即获取最新更改的场景。

#### Webhook 自动同步

当远程仓库有新的 push 事件时，Git 平台会自动通知 GitFileDock 执行拉取。

**配置步骤：**

1. 在 GitFileDock 设置中添加仓库后，系统会自动生成一个 Webhook URL
2. Webhook URL 格式：`https://your-server.com/api/webhook/{secret}`
3. 到你的 Git 平台仓库设置中添加 Webhook：

**GitHub：**
- 进入仓库 Settings → Webhooks → Add webhook
- Payload URL 填写 Webhook URL
- Content type 选 `application/json`
- Secret 留空
- 勾选 `Just the push event`

**Gitea：**
- 进入仓库 Settings → Webhooks → Add Webhook
- 目标 URL 填写 Webhook URL
- Content type 选 `application/json`
- 触发事件选 `push`

**Gitee：**
- 进入仓库 管理 → WebHooks → 添加 webhook
- URL 填写 Webhook URL
- 密码留空
- 勾选 Push 事件

#### 定时同步

在仓库设置中可以配置自动拉取间隔：

| 选项 | 说明 |
|------|------|
| 关闭 | 不自动拉取 |
| 每 30 分钟 | 适合频繁更新的项目 |
| 每 1 小时 | 适合一般项目（推荐） |
| 每 2 小时 | 适合更新不频繁的项目 |
| 每 4 小时 | 适合稳定的项目 |

### 隐藏文件

可以在仓库设置中配置需要隐藏的文件和目录，隐藏后的文件不会在文件浏览列表中显示，但通过直链仍然可以访问。

**配置方式：**
- 在仓库设置中的「隐藏路径」字段填写
- 每行一个路径或模式
- 支持简单通配符匹配

**示例配置：**
```
.git
node_modules
.env
*.log
.DS_Store
dist
build
```

**匹配规则：**
- 精确匹配：`.git` 只匹配名为 `.git` 的文件/目录
- 通配符匹配：`*.log` 匹配所有 `.log` 结尾的文件

---

## 配置说明

### 环境变量

在项目根目录的 `.env` 文件中配置（或使用 `.env.example` 作为模板）：

| 变量名 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|:--------:|
| `PORT` | 服务监听端口 | `3000` | 否 |
| `BASE_URL` | 基础 URL，用于生成直链和 Webhook URL | `http://localhost:3000` | 是 |
| `DATABASE_URL` | SQLite 数据库文件路径 | `file:./data/gitfiledock.db` | 否 |
| `JWT_SECRET` | JWT Token 签名密钥，生产环境务必修改 | `change-this-to-a-random-string` | 是 |
| `ENCRYPTION_KEY` | SSH 私钥加密密钥，生产环境务必修改 | `change-this-to-a-random-key` | 是 |
| `GIT_USER_NAME` | Git 提交时使用的用户名 | `GitFileDock` | 否 |
| `GIT_USER_EMAIL` | Git 提交时使用的邮箱 | `gitfiledock@local` | 否 |

**生产环境安全配置示例：**
```env
PORT=3000
BASE_URL=https://files.yourdomain.com
DATABASE_URL=file:./data/gitfiledock.db
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
ENCRYPTION_KEY=x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6
GIT_USER_NAME=Your Name
GIT_USER_EMAIL=your@email.com
```

> 生成随机密钥的方法：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 隐藏路径配置

隐藏路径存储在数据库中，以 JSON 数组格式保存。在 Web 设置界面中，每行填写一个路径即可，系统会自动转换为 JSON 格式存储。

---

## API 参考

所有 API 均返回 JSON 格式。需要认证的 API 请求需要携带登录时设置的 HttpOnly Cookie（前端自动处理）。

### 认证 API

**POST /api/auth/login** — 登录

```json
// Request
{ "username": "admin", "password": "admin123" }

// Response (200)
{ "success": true, "user": { "username": "admin", "mustChangePwd": true } }

// Response (401)
{ "error": "用户名或密码错误" }
```

**POST /api/auth/logout** — 登出（需要认证）

```json
// Response (200)
{ "success": true }
```

**GET /api/auth/me** — 获取当前用户信息（需要认证）

```json
// Response (200)
{ "id": "xxx", "username": "admin", "mustChangePwd": false }
```

**PUT /api/auth/password** — 修改密码（需要认证）

```json
// Request
{ "currentPassword": "admin123", "newPassword": "newPassword123" }

// Response (200)
{ "success": true }
```

### 仓库 API

**GET /api/repos** — 获取仓库列表（无需认证）

```json
// Response (200)
{
  "repos": [
    {
      "id": "xxx",
      "name": "my-project",
      "branch": "main",
      "platform": "github",
      "autoPullInterval": 60,
      "createdAt": "2026-04-17T00:00:00Z"
    }
  ]
}
```

**POST /api/repos** — 添加仓库（需要认证）

```json
// Request
{
  "name": "my-project",
  "remoteUrl": "git@github.com:user/repo.git",
  "sshKeyId": "key-xxx",
  "branch": "main",
  "platform": "github",
  "hiddenPaths": [".git", "node_modules"],
  "autoPullInterval": 60
}

// Response (200)
{
  "success": true,
  "repo": {
    "id": "xxx",
    "webhookSecret": "abc123...",
    "webhookUrl": "https://your-server.com/api/webhook/abc123..."
  }
}
```

**PUT /api/repos/[id]** — 编辑仓库配置（需要认证）

**DELETE /api/repos/[id]?deleteLocal=true** — 删除仓库（需要认证）

**POST /api/repos/[id]/sync** — 手动同步仓库（需要认证）

**GET /api/repos/[id]/status** — 获取仓库状态（无需认证）

```json
// Response (200)
{
  "branch": "main",
  "commit": { "hash": "a1b2c3d", "message": "fix: update style", "date": "2026-04-17T12:00:00+08:00" }
}
```

### 文件 API

**GET /api/files/[repo]/[...path]** — 浏览目录或获取文件（无需认证）

目录响应：
```json
{
  "success": true,
  "type": "directory",
  "items": [
    { "name": "src", "isDirectory": true, "size": 0, "modifiedAt": "...", "path": "src" },
    { "name": "README.md", "isDirectory": false, "size": 1024, "modifiedAt": "...", "path": "README.md" }
  ]
}
```

文件响应：
```json
{
  "success": true,
  "type": "file",
  "file": {
    "name": "index.ts",
    "size": 2048,
    "modifiedAt": "...",
    "path": "src/index.ts",
    "isText": true,
    "extension": "ts",
    "content": "import express from 'express';\n..."
  }
}
```

**POST /api/files/[repo]/[...path]** — 创建文件或目录（需要认证）

```json
// Request (创建文件)
{ "type": "file", "content": "initial content" }

// Request (创建目录)
{ "type": "directory" }
```

**PUT /api/files/[repo]/[...path]** — 编辑或重命名（需要认证）

```json
// 编辑文件内容
{ "content": "new file content" }

// 重命名
{ "newName": "new-name.ts" }
```

**DELETE /api/files/[repo]/[...path]** — 删除文件或目录（需要认证）

**POST /api/files/[repo]/upload?path=src/components** — 上传文件（需要认证）

- Content-Type: `multipart/form-data`
- 支持多文件上传
- `overwrite` query 参数控制是否覆盖同名文件

**GET /api/files/[repo]/download/[...path]** — 下载文件或目录（无需认证）

- 单文件：直接返回文件流
- 目录：自动打包为 ZIP 返回

### SSH 密钥 API

**GET /api/keys** — 获取密钥列表（需要认证）

```json
// Response (200)
{
  "keys": [
    { "id": "xxx", "name": "GitHub Key", "fingerprint": "a1b2c3d4e5f6", "createdAt": "..." }
  ]
}
```

**POST /api/keys** — 添加密钥（需要认证）

```json
// Request
{ "name": "GitHub Key", "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n..." }
```

**PUT /api/keys/[id]** — 更新密钥（需要认证）

**DELETE /api/keys/[id]** — 删除密钥（需要认证，如被仓库引用则拒绝删除）

### Webhook API

**POST /api/webhook/[secret]** — 接收 Git 平台推送（无需认证）

- 自动识别 GitHub / Gitea / Gitee 平台
- 处理 push 事件，自动执行 `git pull`
- 响应 ping 事件返回 `pong`

---

## 安全设计

| 安全措施 | 实现方式 |
|---------|---------|
| **密码存储** | 使用 bcrypt 哈希算法，10 轮 salt |
| **SSH 密钥存储** | 使用 AES-256-GCM 加密，密钥来自环境变量 ENCRYPTION_KEY |
| **身份认证** | JWT (HS256) 签名，Token 有效期 7 天，HttpOnly + SameSite Cookie |
| **路径安全** | 使用 `path.resolve` 严格校验文件路径，防止目录遍历攻击 |
| **文件上传** | 文件大小限制 100MB，路径校验防止写入非仓库目录 |
| **Git 操作** | SSH 密钥写入临时文件（mode 600），使用后立即删除 |
| **Webhook** | 每个仓库独立的 Webhook Secret，URL 不可猜测 |
| **API 鉴权** | 中间件自动保护需要认证的路由，未认证返回 401 |
| **公开访问** | 文件浏览和下载无需登录，写入操作需要认证 |

---

## 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| [Next.js 16](https://nextjs.org/) | 全栈框架 | App Router, Server Components, API Routes |
| [TypeScript](https://www.typescriptlang.org/) | 开发语言 | 类型安全 |
| [Tailwind CSS 4](https://tailwindcss.com/) | 样式框架 | 原子化 CSS |
| [shadcn/ui](https://ui.shadcn.com/) | UI 组件库 | 基于 Radix UI 的高质量组件 |
| [Prisma](https://www.prisma.io/) | ORM | SQLite 数据库操作 |
| [Shiki](https://shiki.matsu.io/) | 代码高亮 | 服务端渲染语法高亮，支持 200+ 语言 |
| [CodeMirror 6](https://codemirror.net/) | 代码编辑器 | 浏览器端代码编辑 |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT 认证 | Token 签发与验证 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 密码加密 | 密码哈希与验证 |
| [node-cron](https://www.npmjs.com/package/node-cron) | 定时任务 | 定时 Git 拉取 |
| [archiver](https://github.com/archiverjs/node-archiver) | ZIP 打包 | 文件夹下载 |
| [Docker](https://www.docker.com/) | 容器化部署 | 开箱即用的容器镜像 |

---

## 项目结构

```
GitFileDock/
├── PLAN.md                       # 详细开发计划文档
├── LICENSE                       # MIT 开源许可证
├── README.md                     # 本文件
├── .gitignore                    # Git 忽略配置
├── .env.example                  # 环境变量模板
├── docker-compose.yml            # Docker Compose 编排
├── Dockerfile                    # 多阶段 Docker 镜像构建
├── next.config.ts                # Next.js 配置（standalone 输出）
├── package.json                  # 项目依赖
├── prisma/
│   ├── schema.prisma             # 数据库模型定义（User, SSHKey, Repo）
│   └── seed.ts                   # 初始数据种子（默认管理员）
├── src/
│   ├── app/                      # Next.js App Router 页面
│   │   ├── layout.tsx            # 根布局（暗色主题）
│   │   ├── page.tsx              # 首页（重定向到第一个仓库）
│   │   ├── login/page.tsx        # 登录页
│   │   ├── settings/page.tsx     # 设置页（仓库/密钥/用户管理）
│   │   ├── browse/[repo]/[...path]/page.tsx  # 文件浏览页
│   │   ├── raw/[repo]/[...path]/route.ts     # 原始文件端点
│   │   └── api/                  # API 路由
│   │       ├── auth/             # 认证（登录/登出/用户/密码）
│   │       ├── repos/            # 仓库管理
│   │       ├── files/            # 文件操作（浏览/编辑/上传/下载）
│   │       ├── keys/             # SSH 密钥管理
│   │       ├── highlight/        # 代码高亮 API
│   │       └── webhook/          # Webhook 接收
│   ├── components/               # React 组件
│   │   ├── ui/                   # shadcn/ui 基础组件
│   │   ├── layout/Header.tsx     # 顶部导航栏
│   │   ├── nav/Breadcrumb.tsx    # 面包屑导航
│   │   ├── repo/RepoSwitcher.tsx # 仓库切换器
│   │   ├── file/                 # 文件列表、图标
│   │   ├── preview/              # 代码/Markdown/图片预览面板
│   │   ├── editor/CodeEditor.tsx # CodeMirror 编辑器
│   │   └── common/               # 通用组件（上传/确认/搜索等）
│   ├── lib/                      # 工具库
│   │   ├── db.ts                 # Prisma 数据库客户端
│   │   ├── auth.ts               # JWT 认证工具
│   │   ├── api-auth.ts           # API 认证中间件
│   │   ├── edge-auth.ts          # Edge 兼容认证
│   │   ├── git.ts                # Git 操作封装
│   │   ├── crypto.ts             # AES-256-GCM 加解密
│   │   ├── constants.ts          # 文件类型、语言映射
│   │   ├── scheduler.ts          # 定时同步调度
│   │   └── ssh-key-helper.ts     # SSH 密钥临时文件管理
│   └── middleware.ts             # Next.js 中间件
├── data/                         # 运行时数据（Docker Volume 挂载）
│   ├── gitfiledock.db            # SQLite 数据库
│   └── repos/                    # Git 仓库本地存储
└── public/                       # 静态资源
```

---

## 开发指南

```bash
# 克隆项目
git clone https://github.com/astralwaveorg/GitFileHub.git
cd GitFileHub

# 安装依赖
npm install

# 初始化数据库
npx prisma db push
npx prisma db seed

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm start
```

**开发注意事项：**

- 项目使用 Next.js App Router，所有路由在 `src/app/` 目录下
- API 路由在 `src/app/api/` 目录下
- 数据库操作使用 Prisma Client，通过 `src/lib/db.ts` 导入
- Git 操作封装在 `src/lib/git.ts`，使用 child_process 调用 git CLI
- 代码高亮通过 `/api/highlight` API 实现（Shiki 需要服务端渲染）
- 详细的开发计划请查看 [PLAN.md](PLAN.md)

---

## 许可证

[MIT License](LICENSE)

Copyright (c) 2026 astralwaveorg
